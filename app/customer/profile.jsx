import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth } from '../../config/firebase';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { getUserProfile, logOut, updateUserProfile } from '../../services/auth';

const ZONES = ['A', 'B', 'C', 'D', 'E'];

export default function CustomerProfile() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

      console.log('Loading profile for user:', user.uid);
      const result = await getUserProfile(user.uid);
      console.log('Profile load result:', result);
      
      if (result.success && result.user) {
        const userData = result.user;
        console.log('User data loaded:', userData);
        
        setProfile(userData);
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setPhoneNumber(userData.phoneNumber || '');
        setAddress(userData.address || '');
        setSelectedZone(userData.zone || 'A'); // Default to 'A' if zone doesn't exist
      } else {
        // Handle case where profile doesn't exist
        console.warn('Profile not found or failed to load:', result.error);
        Alert.alert('Warning', 'Could not load your profile data. You can still update your information.');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!firstName.trim()) {
        Alert.alert('Validation Error', 'First name is required');
        return;
      }

      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        zone: selectedZone,
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim() || user.email,
      };

      console.log('Saving profile updates:', updates);

      const result = await updateUserProfile(user.uid, updates);

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false); // Exit edit mode
        loadProfile(); // Reload profile
      } else {
        console.error('Profile update failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setAddress(profile.address || '');
      setSelectedZone(profile.zone || 'A');
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    console.log('🔄 Starting edit mode...');
    setIsEditing(true);
    console.log('✅ Edit mode activated');
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
          <View style={styles.headerContent}>
            <Text style={styles.title}>👤 My Profile</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Edit your account information' : 'Manage your account information'}
            </Text>
          </View>
          
          {console.log('🔍 Current editing state:', isEditing)}
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleStartEdit}>
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
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
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={isEditing}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput, !isEditing && styles.inputDisabled]}
            placeholder="Enter your full address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            editable={isEditing}
            placeholderTextColor="#999"
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
                  !isEditing && styles.zoneChipDisabled,
                ]}
                onPress={() => isEditing && setSelectedZone(zone)}
                disabled={!isEditing}
              >
                <Text
                  style={[
                    styles.zoneChipText,
                    selectedZone === zone && styles.zoneChipTextSelected,
                    !isEditing && styles.zoneChipTextDisabled,
                  ]}
                >
                  Zone {zone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save/Cancel Buttons - Only show when editing */}
        {isEditing && (
          <View style={styles.section}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
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
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerContent: {
    flex: 1,
  },
  editButton: {
    backgroundColor: Colors.primary || '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.small,
  },
  editButtonText: {
    color: 'white',
    fontSize: FontSizes.body,
    fontWeight: '600',
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
    color: Colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#6b7280',
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
  zoneChipDisabled: {
    opacity: 0.6,
  },
  zoneChipText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  zoneChipTextSelected: {
    color: Colors.primary || '#16A34A',
  },
  zoneChipTextDisabled: {
    color: '#9ca3af',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: FontSizes.h3,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
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
