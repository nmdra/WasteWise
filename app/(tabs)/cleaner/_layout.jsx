import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function CleanerTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 24, color }}>🏠</Text>,
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#94A3B8',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 24, color }}>🗺️</Text>,
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#94A3B8',
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: 'Stops',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 24, color }}>📋</Text>,
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#94A3B8',
        }}
      />
    </Tabs>
  );
}
