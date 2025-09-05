import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from '@/components/organisms/SplashScreen';

export default function SplashScreenPage() {
  const router = useRouter();

  const handleSplashFinish = useCallback(() => {
    console.log('Splash screen finished, navigating to tabs...');

    // Naviguer vers les tabs (le splash natif est déjà caché)
    router.replace('/(tabs)');
  }, [router]);

  console.log('SplashScreenPage rendering...');

  return (
    <View style={styles.container}>
      <SplashScreen onFinish={handleSplashFinish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // S'assurer qu'il s'affiche au-dessus du splash natif
  },
});
