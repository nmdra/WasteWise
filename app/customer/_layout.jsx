import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/customerTheme';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.green,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: Colors.bg.card,
          borderTopColor: Colors.line,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="map"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="bins"
        options={{
          title: 'Bins',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="delete" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />

      {/* Hide these from tabs but keep them accessible via navigation */}
      <Tabs.Screen name="qr" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="education" options={{ href: null }} />
      <Tabs.Screen name="report-issue" options={{ href: null }} />
      <Tabs.Screen name="payment-detail" options={{ href: null }} />
      <Tabs.Screen name="special-pickup" options={{ href: null }} />
      <Tabs.Screen name="link-bin" options={{ href: null }} />
      <Tabs.Screen name="locations" options={{ href: null }} />
      <Tabs.Screen name="my-bills" options={{ href: null }} />
      <Tabs.Screen name="bill-details" options={{ href: null }} />
      <Tabs.Screen name="select-payment" options={{ href: null }} />
      <Tabs.Screen name="payment-details" options={{ href: null }} />
      <Tabs.Screen name="payment-success" options={{ href: null }} />
    </Tabs>
  );
}
