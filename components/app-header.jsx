import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function AppHeader({ userName, userRole }) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🌱 WasteWise</Text>
      </View>

      {/* Profile Avatar */}
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        style={styles.profileBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        {userRole && (
          <View style={[styles.roleBadge, userRole === 'cleaner' && styles.cleanerBadge]}>
            <Text style={styles.roleText}>
              {userRole === 'cleaner' ? '🚛' : '👤'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
  },
  profileBtn: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F0FDF4',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  cleanerBadge: {
    backgroundColor: '#F59E0B',
  },
  roleText: {
    fontSize: 10,
  },
});
