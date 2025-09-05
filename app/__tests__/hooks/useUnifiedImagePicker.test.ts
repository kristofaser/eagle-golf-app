import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useUnifiedImagePicker,
  useSimpleImagePicker,
  useImagePicker,
  useExpoImagePicker,
} from '@/hooks/useUnifiedImagePicker';

// Mock des dépendances
jest.mock('expo-image-picker');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;

describe('useUnifiedImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock des permissions par défaut
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });

    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useUnifiedImagePicker());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.showImagePicker).toBe('function');
    expect(typeof result.current.takePhoto).toBe('function');
    expect(typeof result.current.pickFromGallery).toBe('function');
  });

  it('should request permissions correctly', async () => {
    const { result } = renderHook(() => useUnifiedImagePicker());

    await act(async () => {
      const hasPermissions = await result.current.requestPermissions();
      expect(hasPermissions).toBe(true);
    });

    expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('should handle permission denial gracefully', async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: true,
    });

    const { result } = renderHook(() => useUnifiedImagePicker());

    await act(async () => {
      const hasPermissions = await result.current.requestPermissions();
      expect(hasPermissions).toBe(false);
    });

    expect(mockAlert.alert).toHaveBeenCalledWith(
      'Permission photos requise',
      "Cette application a besoin d'accéder à vos photos.",
      [{ text: 'OK' }]
    );
  });

  it('should validate image correctly', () => {
    const { result } = renderHook(() =>
      useUnifiedImagePicker({
        maxFileSize: 1024 * 1024, // 1MB
        minWidth: 200,
        minHeight: 200,
      })
    );

    // Image valide
    const validImage = {
      uri: 'test://image.jpg',
      width: 300,
      height: 300,
      fileSize: 500 * 1024, // 500KB
    };

    const validResult = result.current.validateImage(validImage);
    expect(validResult.isValid).toBe(true);

    // Image trop grande
    const tooLargeImage = {
      uri: 'test://image.jpg',
      width: 300,
      height: 300,
      fileSize: 2 * 1024 * 1024, // 2MB
    };

    const tooLargeResult = result.current.validateImage(tooLargeImage);
    expect(tooLargeResult.isValid).toBe(false);
    expect(tooLargeResult.error).toContain('trop grande');

    // Image trop petite
    const tooSmallImage = {
      uri: 'test://image.jpg',
      width: 100,
      height: 100,
      fileSize: 100 * 1024,
    };

    const tooSmallResult = result.current.validateImage(tooSmallImage);
    expect(tooSmallResult.isValid).toBe(false);
    expect(tooSmallResult.error).toContain('au moins 200x200');
  });

  it('should handle successful photo selection from gallery', async () => {
    const mockAsset = {
      uri: 'test://selected-image.jpg',
      width: 400,
      height: 400,
      type: 'image/jpeg',
      fileSize: 1024 * 500, // 500KB
    };

    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    const { result } = renderHook(() => useUnifiedImagePicker());

    await act(async () => {
      const selectedImage = await result.current.pickFromGallery();

      expect(selectedImage).toEqual({
        uri: mockAsset.uri,
        width: mockAsset.width,
        height: mockAsset.height,
        type: mockAsset.type,
        fileSize: mockAsset.fileSize,
      });
    });

    expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });
  });

  it('should handle canceled selection', async () => {
    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    });

    const { result } = renderHook(() => useUnifiedImagePicker());

    await act(async () => {
      const selectedImage = await result.current.pickFromGallery();
      expect(selectedImage).toBeNull();
    });
  });

  it('should apply custom configuration', () => {
    const customConfig = {
      quality: 0.5,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      minWidth: 300,
      minHeight: 300,
      title: 'Sélectionner une image',
    };

    const { result } = renderHook(() => useUnifiedImagePicker(customConfig));

    // Test de validation avec nouvelle config
    const image = {
      uri: 'test://image.jpg',
      width: 250, // Trop petit selon la nouvelle config
      height: 250,
      fileSize: 1024 * 1024,
    };

    const validationResult = result.current.validateImage(image);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.error).toContain('300x300');
  });
});

describe('Compatibility hooks', () => {
  it('useSimpleImagePicker should work', () => {
    const { result } = renderHook(() => useSimpleImagePicker());

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.showImagePicker).toBe('function');
  });

  it('useImagePicker should work', () => {
    const { result } = renderHook(() => useImagePicker());

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.showImagePicker).toBe('function');
  });

  it('useExpoImagePicker should work', () => {
    const { result } = renderHook(() => useExpoImagePicker());

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.showImagePicker).toBe('function');
  });
});
