import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RadiusOption = 10 | 25 | 50 | 100 | 200 | 300;

interface LocationPreferencesState {
  radiusKm: RadiusOption;
  setRadiusKm: (radius: RadiusOption) => void;
}

export const useLocationPreferences = create<LocationPreferencesState>()(
  persist(
    (set) => ({
      radiusKm: 50, // Valeur par défaut : 50 km
      setRadiusKm: (radius) => set({ radiusKm: radius }),
    }),
    {
      name: 'location-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
