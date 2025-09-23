export const MediaTypeOptions = {
  All: 0,
  Videos: 1,
  Images: 2,
};

export const ImagePickerOptions = {};

export const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  expires: 'never',
  granted: true,
  canAskAgain: true,
});

export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  expires: 'never',
  granted: true,
  canAskAgain: true,
});

export const launchCameraAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: null,
});

export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: null,
});

export const getCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  expires: 'never',
  granted: true,
  canAskAgain: true,
});

export const getMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  expires: 'never',
  granted: true,
  canAskAgain: true,
});
