import { renderHook, act } from '@testing-library/react-native';
import { useAsyncOperation, useAsyncAction } from '@/hooks/useAsyncOperation';

describe('useAsyncOperation', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAsyncOperation<string>());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful operation', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>());
    const mockOperation = jest.fn().mockResolvedValue('success data');

    await act(async () => {
      const returnedData = await result.current.execute(mockOperation);
      expect(returnedData).toBe('success data');
    });

    expect(result.current.data).toBe('success data');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should handle failed operation', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>());
    const mockError = new Error('Operation failed');
    const mockOperation = jest.fn().mockRejectedValue(mockError);

    await act(async () => {
      const returnedData = await result.current.execute(mockOperation);
      expect(returnedData).toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should set loading state during operation', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>());
    let resolvePromise: (value: string) => void;
    const mockOperation = jest.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
    );

    // Start the operation
    act(() => {
      result.current.execute(mockOperation);
    });

    // Should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Resolve the promise
    await act(async () => {
      resolvePromise('resolved data');
    });

    // Should not be loading anymore
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('resolved data');
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useAsyncOperation<string>());

    // Set some state
    act(() => {
      result.current.setData('some data');
    });

    expect(result.current.data).toBe('some data');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle string errors correctly', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>());
    const mockOperation = jest.fn().mockRejectedValue('String error');

    await act(async () => {
      await result.current.execute(mockOperation);
    });

    expect(result.current.error).toEqual(new Error('String error'));
  });
});

describe('useAsyncAction', () => {
  it('should work for operations without data return', async () => {
    const { result } = renderHook(() => useAsyncAction());
    const mockAction = jest.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.execute(mockAction);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockAction).toHaveBeenCalledTimes(1);

    // Should not have data or setData methods
    expect('data' in result.current).toBe(false);
    expect('setData' in result.current).toBe(false);
  });
});
