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
import { logOut } from '../services/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

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
        role: role || 'customer',
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
            setLoggingOut(true);
            try {
              // Call Firebase logout to end session
              await logOut();

              // Clear all AsyncStorage data
              await AsyncStorage.multiRemove([
                'userToken',
                'userId',
                'userEmail',
                'userFirstName',
                'userRole',
              ]);

              // Small delay to ensure async cleanup is processed
              setTimeout(() => {
                try {
                  router.replace('/login');
                } catch (navErr) {
                  console.error('Navigation error after logout:', navErr);
                }
              }, 150);

              Alert.alert('Logged out', 'You have been signed out.', [
                { text: 'OK', onPress: () => {} },
              ]);
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, userData?.role === 'cleaner' && styles.cleanerAvatar]}>
            <Text style={styles.avatarText}>
              {userData?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{userData?.firstName || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.role === 'cleaner' ? '🚛 Cleaner' : '👤 Customer'}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData?.email || 'Not available'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{userData?.id?.slice(0, 20) || 'Not available'}...</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>
              {userData?.role === 'cleaner' ? 'Cleaner' : 'Customer'}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingCard}>
            <Text style={styles.settingIcon}>✏️</Text>
            <Text style={styles.settingText}>Edit Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingText}>Privacy & Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} disabled={loggingOut}>
          <Text style={styles.logoutText}>{loggingOut ? 'Signing out...' : '🚪 Logout'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cleanerAvatar: {
    backgroundColor: '#F59E0B',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
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
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#0B1220',
    fontWeight: '600',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#0B1220',
    fontWeight: '600',
  },
  settingArrow: {
    fontSize: 24,
    color: '#94A3B8',
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
