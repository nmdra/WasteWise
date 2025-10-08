import React from 'react';
import { Stack } from 'expo-router';

export default function CleanerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="stop-details" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="collection" />
      <Stack.Screen name="missed" options={{ presentation: 'modal' }} />
      <Stack.Screen name="checklist" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
