import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/customerTheme';

export default function CleanerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.role.cleaner,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home-filled" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: 'Stops',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list-alt" size={size ?? 24} color={color} />
          ),
        }}
      />
      
      {/* Hide all other screens from tab bar */}
      <Tabs.Screen name="_layout" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="checklist" options={{ href: null }} />
      <Tabs.Screen name="collection" options={{ href: null }} />
      <Tabs.Screen name="collection-details" options={{ href: null }} />
      <Tabs.Screen name="collection-history" options={{ href: null }} />
      <Tabs.Screen name="confirm-collection" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="missed" options={{ href: null }} />
      <Tabs.Screen name="qr" options={{ href: null }} />
      <Tabs.Screen name="report-issue" options={{ href: null }} />
      <Tabs.Screen name="scan-bin" options={{ href: null }} />
      <Tabs.Screen name="scan-error" options={{ href: null }} />
      <Tabs.Screen name="stop-details" options={{ href: null }} />
    </Tabs>
  );
}
