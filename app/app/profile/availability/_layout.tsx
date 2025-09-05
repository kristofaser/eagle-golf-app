import { Stack } from 'expo-router';

export default function AvailabilityLayout() {
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
          title: 'Mes Disponibilités',
        }}
      />
      <Stack.Screen
        name="select-course"
        options={{
          title: 'Choisir un parcours',
        }}
      />
      <Stack.Screen
        name="select-dates/[courseId]"
        options={{
          title: 'Sélectionner les dates',
        }}
      />
    </Stack>
  );
}