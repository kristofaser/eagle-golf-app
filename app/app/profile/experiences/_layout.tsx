import { Stack } from 'expo-router';

export default function ExperiencesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Retour',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Mes Expériences',
        }}
      />
    </Stack>
  );
}