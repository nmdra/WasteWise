import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CleanerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
  tabBarActiveTintColor: '#ffffff',
  tabBarInactiveTintColor: '#bfbfbf',
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
        name="my-schedules"
        options={{
          title: 'Schedules',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-note" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-bin"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size ?? 24} color={color} />
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
      <Tabs.Screen name="manage-schedule" options={{ href: null }} />
      <Tabs.Screen name="schedule-details" options={{ href: null }} />
      <Tabs.Screen name="pending-bookings" options={{ href: null }} />
      <Tabs.Screen name="booking-approval" options={{ href: null }} />
      <Tabs.Screen name="booking-management" options={{ href: null }} />
      <Tabs.Screen name="booking-detail" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="missed" options={{ href: null }} />
      <Tabs.Screen name="qr" options={{ href: null }} />
      <Tabs.Screen name="report-issue" options={{ href: null }} />
      <Tabs.Screen name="stops" options={{ href: null }} />
      <Tabs.Screen name="scan-error" options={{ href: null }} />
      <Tabs.Screen name="stop-details" options={{ href: null }} />
      <Tabs.Screen name="pickup-confirmation" options={{ href: null }} />
    </Tabs>
  );
}
