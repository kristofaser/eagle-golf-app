import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSearch } from '../../hooks/useSearch';
import { searchService } from '../../services/search.service';

// Mock du service de recherche
jest.mock('../../services/search.service');

const mockedSearchService = searchService as jest.Mocked<typeof searchService>;

describe('useSearch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.query).toBe('');
    expect(result.current.category).toBe('all');
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.prosCount).toBe(0);
    expect(result.current.coursesCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should update query and category', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    // Test mise à jour de la query
    result.current.setQuery('test query');
    expect(result.current.query).toBe('test query');

    // Test mise à jour de la catégorie
    result.current.setCategory('pros');
    expect(result.current.category).toBe('pros');
  });

  it('should perform search when query is valid', async () => {
    const mockData = {
      mode: 'by-pro' as const,
      pros: [
        {
          id: 'pro1',
          first_name: 'John',
          last_name: 'Doe',
          city: 'Paris',
          pro_profiles: {
            skill_driving: 8,
            skill_putting: 9,
          },
        },
      ],
      golfCourses: [
        {
          id: 'course1',
          name: 'Golf Club Test',
          city: 'Paris',
          holes_count: 18,
          par: 72,
        },
      ],
      totalResults: 2,
    };

    mockedSearchService.quickSearch.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useSearch({
      initialQuery: 'test',
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.prosCount).toBe(1);
      expect(result.current.coursesCount).toBe(1);
      expect(result.current.totalCount).toBe(2);
    });

    expect(mockedSearchService.quickSearch).toHaveBeenCalledWith({
      query: 'test',
      type: 'all',
      limit: 20,
    });
  });

  it('should not search when query is too short', () => {
    const { result } = renderHook(() => useSearch({
      initialQuery: 'a', // Trop court
    }), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(mockedSearchService.quickSearch).not.toHaveBeenCalled();
  });

  it('should handle different categories', async () => {
    const { result } = renderHook(() => useSearch({
      initialQuery: 'test',
      initialCategory: 'pros',
    }), { wrapper });

    await waitFor(() => {
      expect(mockedSearchService.quickSearch).toHaveBeenCalledWith({
        query: 'test',
        type: 'pros',
        limit: 20,
      });
    });
  });

  it('should clear results', () => {
    const { result } = renderHook(() => useSearch({
      initialQuery: 'test',
    }), { wrapper });

    result.current.clearResults();
    expect(result.current.query).toBe('');
  });

  it('should handle search errors', async () => {
    mockedSearchService.quickSearch.mockResolvedValue({
      data: null,
      error: new Error('Search failed'),
    });

    const { result } = renderHook(() => useSearch({
      initialQuery: 'test',
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it('should debounce search queries', async () => {
    const { result } = renderHook(() => useSearch({
      debounceMs: 100,
    }), { wrapper });

    // Simuler plusieurs changements rapides
    result.current.setQuery('t');
    result.current.setQuery('te');
    result.current.setQuery('tes');
    result.current.setQuery('test');

    // Attendre que le debounce soit terminé
    await new Promise(resolve => setTimeout(resolve, 150));

    await waitFor(() => {
      // Ne devrait être appelé qu'une fois avec la dernière valeur
      expect(mockedSearchService.quickSearch).toHaveBeenCalledTimes(1);
      expect(mockedSearchService.quickSearch).toHaveBeenCalledWith({
        query: 'test',
        type: 'all',
        limit: 20,
      });
    });
  });
});