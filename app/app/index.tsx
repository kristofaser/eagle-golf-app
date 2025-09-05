import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function IndexPage() {
  const router = useRouter();
  const [canNavigate, setCanNavigate] = useState(false);

  useEffect(() => {
    console.log('IndexPage: Preparing navigation...');

    // Attendre que le layout soit complètement monté
    const timer = setTimeout(() => {
      setCanNavigate(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canNavigate) {
      console.log('IndexPage: Now redirecting to splash...');
      router.replace('/splash');
    }
  }, [canNavigate, router]);

  console.log('IndexPage rendering...');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Blanc neutre
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'normal',
  },
});
