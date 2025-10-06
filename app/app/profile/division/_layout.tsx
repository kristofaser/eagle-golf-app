import { Stack } from 'expo-router';

export default function DivisionLayout() {
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
          title: 'Division',
        }}
      />
    </Stack>
  );
}
