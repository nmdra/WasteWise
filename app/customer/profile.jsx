import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { getUserProfile, updateUserProfile, logOut } from '../../services/auth';

const ZONES = ['A', 'B', 'C', 'D', 'E'];

export default function CustomerProfile() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedZone, setSelectedZone] = useState('A');

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user) {
        router.replace('/login');
        return;
      }

      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setProfile(result.user);
        setFirstName(result.user.firstName || '');
        setLastName(result.user.lastName || '');
        setPhoneNumber(result.user.phoneNumber || '');
        setAddress(result.user.address || '');
        setSelectedZone(result.user.zone || 'A');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        zone: selectedZone,
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim() || user.email,
      };

      const result = await updateUserProfile(user.uid, updates);

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        loadProfile(); // Reload profile
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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
              await logOut();
              await AsyncStorage.clear();
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary || '#16A34A'} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>👤 My Profile</Text>
          <Text style={styles.subtitle}>Manage your account information</Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {profile?.role === 'cleaner' ? 'Collector' : 'Customer'}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Enter your full address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Zone Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Zone</Text>
          <Text style={styles.helperText}>
            Select your zone to see relevant collection schedules
          </Text>

          <View style={styles.zonesRow}>
            {ZONES.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.zoneChip,
                  selectedZone === zone && styles.zoneChipSelected,
                ]}
                onPress={() => setSelectedZone(zone)}
              >
                <Text
                  style={[
                    styles.zoneChipText,
                    selectedZone === zone && styles.zoneChipTextSelected,
                  ]}
                >
                  Zone {zone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Account Details */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.detailsCard}>
              <Text style={styles.detailText}>
                Account created: {profile.createdAt ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'N/A'}
              </Text>
              <Text style={styles.detailText}>
                User ID: {profile.uid}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  inputLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    marginBottom: Spacing.sm,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  zonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  zoneChip: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bg.card,
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  zoneChipSelected: {
    borderColor: Colors.primary || '#16A34A',
    backgroundColor: '#e8f5e9',
  },
  zoneChipText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  zoneChipTextSelected: {
    color: Colors.primary || '#16A34A',
  },
  saveButton: {
    backgroundColor: Colors.primary || '#16A34A',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: Colors.state.error,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: Colors.bg.light,
    padding: Spacing.md,
    borderRadius: Radii.small,
  },
  detailText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
});
