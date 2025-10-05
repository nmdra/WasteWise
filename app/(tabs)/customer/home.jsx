import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AppHeader from '../../../components/app-header';

export default function CustomerHome() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [nextPickup, setNextPickup] = useState('Wednesday, 7:30 AM');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userId = await AsyncStorage.getItem('userId');
      const firstName = await AsyncStorage.getItem('userFirstName');
      const role = await AsyncStorage.getItem('userRole');

      setUserData({
        email: userEmail,
        id: userId,
        firstName: firstName || 'User',
        role: role,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.multiRemove([
                'userToken',
                'userId',
                'userEmail',
                'userFirstName',
                'userRole',
                'hasSeenOnboarding',
              ]);
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader userName={userData?.firstName} userRole="customer" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>Hello, {userData?.firstName || 'User'}! 👋</Text>
          <Text style={styles.subtitle}>Let's keep your environment clean</Text>
        </View>

        {/* Next Pickup Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📅 Next Pickup</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Scheduled</Text>
            </View>
          </View>
          <Text style={styles.pickupTime}>{nextPickup}</Text>
          <Text style={styles.pickupLocation}>123 Main Street, Colombo</Text>
          
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionTitle}>Track Truck</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📆</Text>
              <Text style={styles.actionTitle}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionTitle}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTitle}>Payment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Pickups</Text>
          
          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>✅</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Pickup Completed</Text>
              <Text style={styles.activityDate}>Monday, Oct 13 • 7:45 AM</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>✅</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Pickup Completed</Text>
              <Text style={styles.activityDate}>Friday, Oct 10 • 7:30 AM</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>✅</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Pickup Completed</Text>
              <Text style={styles.activityDate}>Wednesday, Oct 8 • 7:50 AM</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B1220',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  pickupTime: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 8,
  },
  pickupLocation: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
  },
  activityDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
