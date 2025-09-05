import { renderHook } from '@testing-library/react-native';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useWindowDimensions } from 'react-native';

// Mock useWindowDimensions
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useWindowDimensions: jest.fn(),
}));

const mockedUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

describe('useResponsiveCardSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate mobile card size correctly', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 375, // iPhone size
      height: 812,
      scale: 3,
      fontScale: 1,
    });

    const { result } = renderHook(() => useResponsiveCardSize());

    expect(result.current.cardWidth).toBeGreaterThan(0);
    expect(result.current.cardHeight).toBe(result.current.cardWidth); // 1:1 aspect ratio
    expect(result.current.cardsPerRow).toBe(2);
    expect(result.current.isTablet).toBe(false);
  });

  it('should calculate tablet card size correctly', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 768, // iPad size
      height: 1024,
      scale: 2,
      fontScale: 1,
    });

    const { result } = renderHook(() => useResponsiveCardSize());

    expect(result.current.cardWidth).toBeGreaterThan(0);
    expect(result.current.cardHeight).toBe(result.current.cardWidth);
    expect(result.current.cardsPerRow).toBe(3);
    expect(result.current.isTablet).toBe(true);
  });

  it('should respect minimum card width', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 200, // Very small screen
      height: 400,
      scale: 2,
      fontScale: 1,
    });

    const { result } = renderHook(() => useResponsiveCardSize());

    expect(result.current.cardWidth).toBeGreaterThanOrEqual(150); // MIN_WIDTH from constants
  });

  it('should respect maximum card width', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 2000, // Very large screen
      height: 1500,
      scale: 1,
      fontScale: 1,
    });

    const { result } = renderHook(() => useResponsiveCardSize());

    expect(result.current.cardWidth).toBeLessThanOrEqual(200); // MAX_WIDTH from constants
  });

  it('should memoize calculations for performance', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 3,
      fontScale: 1,
    });

    const { result, rerender } = renderHook(() => useResponsiveCardSize());

    const firstResult = result.current;

    rerender({});

    // Should return the same object reference due to memoization
    expect(result.current).toBe(firstResult);
  });

  it('should recalculate when screen width changes', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 3,
      fontScale: 1,
    });

    const { result, rerender } = renderHook(() => useResponsiveCardSize());

    const firstCardWidth = result.current.cardWidth;

    // Change screen width
    mockedUseWindowDimensions.mockReturnValue({
      width: 768,
      height: 1024,
      scale: 2,
      fontScale: 1,
    });

    rerender({});

    // Should have different card width
    expect(result.current.cardWidth).not.toBe(firstCardWidth);
  });
});
