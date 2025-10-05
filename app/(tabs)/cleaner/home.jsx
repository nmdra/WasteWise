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

export default function CleanerHome() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [routeStats, setRouteStats] = useState({
    totalStops: 42,
    completed: 18,
    remaining: 24,
  });

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
        firstName: firstName || 'Cleaner',
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

  const progressPercentage = Math.round(
    (routeStats.completed / routeStats.totalStops) * 100
  );

  return (
    <View style={styles.container}>
      <AppHeader userName={userData?.firstName} userRole="cleaner" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>Today's Route 🚛</Text>
          <Text style={styles.subtitle}>Keep up the great work, {userData?.firstName}!</Text>
        </View>

        {/* Route Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📍 Route Progress</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{routeStats.totalStops}</Text>
              <Text style={styles.statLabel}>Total Stops</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statGreen]}>
                {routeStats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statOrange]}>
                {routeStats.remaining}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPercentage}% Complete</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>📍 View Full Route</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionTitle}>Navigate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionTitle}>Scan QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionTitle}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionTitle}>Checklist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Stops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Stops</Text>
          
          <View style={styles.stopCard}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>19</Text>
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopAddress}>123 Main Street</Text>
              <Text style={styles.stopDetails}>Colombo 07 • Residential</Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn}>
              <Text style={styles.navigateText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stopCard}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>20</Text>
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopAddress}>456 Park Avenue</Text>
              <Text style={styles.stopDetails}>Colombo 05 • Commercial</Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn}>
              <Text style={styles.navigateText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stopCard}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>21</Text>
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopAddress}>789 Green Road</Text>
              <Text style={styles.stopDetails}>Colombo 03 • Residential</Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn}>
              <Text style={styles.navigateText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shift Info */}
        <View style={styles.shiftCard}>
          <Text style={styles.shiftTitle}>⏰ Today's Shift</Text>
          <Text style={styles.shiftTime}>6:30 AM - 2:30 PM</Text>
          <Text style={styles.shiftBreak}>Break: 12:00 PM - 12:30 PM</Text>
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B1220',
  },
  statGreen: {
    color: '#16A34A',
  },
  statOrange: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#F59E0B',
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
  stopCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  stopContent: {
    flex: 1,
  },
  stopAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
  },
  stopDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  navigateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  shiftCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  shiftBreak: {
    fontSize: 14,
    color: '#64748B',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
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
