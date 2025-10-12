import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signInWithGoogle, signUpWithEmail } from '../services/auth';

export default function SignUpScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [fillLater, setFillLater] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' or 'collector'

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email?.trim() || !formData.password || !formData.firstName?.trim()) {
      Alert.alert('Error', 'First name, email, and password are required');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const trimmedFirstName = formData.firstName.trim();
      const trimmedLastName = formData.lastName.trim();
      const result = await signUpWithEmail(formData.email, formData.password, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        displayName: `${trimmedFirstName} ${trimmedLastName}`.trim(),
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        role: selectedRole === 'collector' ? 'cleaner' : 'customer', // Map collector -> cleaner
      });

      if (result.success) {
        // Store user token and data
        const token = await result.user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', result.user.uid);
        await AsyncStorage.setItem('userEmail', result.user.email || '');
        
        // Store user profile data
        if (result.profile) {
          await AsyncStorage.setItem('userRole', result.profile.role || 'customer');
          const resolvedFirstName =
            result.profile.firstName || result.profile.displayName || trimmedFirstName || '';
          await AsyncStorage.setItem('userFirstName', resolvedFirstName);
        }

        // Navigate first
        navigateToDashboard(result.profile?.role || 'customer');
        
        // Show success message after navigation
        if (fillLater) {
          setTimeout(() => Alert.alert('Success', 'Account created! You can complete your profile later.'), 100);
        } else {
          setTimeout(() => Alert.alert('Success', 'Account created successfully!'), 100);
        }
      } else {
        Alert.alert('Sign Up Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDashboard = (role) => {
    if (role === 'cleaner') {
      router.replace('/(tabs)/cleaner/home');
    } else {
      router.replace('/customer/home');
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle(selectedRole === 'collector' ? 'cleaner' : 'customer');

      if (result.success) {
        const token = await result.user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', result.user.uid);
        await AsyncStorage.setItem('userEmail', result.user.email || '');
        
        // Store user profile data
        if (result.profile) {
          await AsyncStorage.setItem('userRole', result.profile.role || 'customer');
          await AsyncStorage.setItem('userFirstName', result.profile.firstName || result.user.displayName || '');
        }

        // Navigate first
        navigateToDashboard(result.profile?.role || 'customer');
        
        // Show success message after navigation
        setTimeout(() => Alert.alert('Success', 'Account created with Google!'), 100);
      } else {
        // Don't show alert if user just cancelled the popup
        if (!result.cancelled) {
          Alert.alert('Google Sign-Up Failed', result.error || 'Please try again');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Google sign-up failed');
      console.error('Google sign-up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join WasteWise</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>I want to sign up as:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              onPress={() => setSelectedRole('customer')}
              style={[
                styles.roleButton,
                selectedRole === 'customer' && styles.roleButtonActive,
              ]}>
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'customer' && styles.roleButtonTextActive,
                ]}>
                👤 Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedRole('collector')}
              style={[
                styles.roleButton,
                selectedRole === 'collector' && styles.roleButtonActive,
              ]}>
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'collector' && styles.roleButtonTextActive,
                ]}>
                🚛 Collector
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.roleHint}>
            {selectedRole === 'customer'
              ? 'Access waste collection, schedules, and payments'
              : 'Manage collection routes, pickups, and reports'}
          </Text>
        </View>

        {/* Fill Later Toggle */}
        <TouchableOpacity
          onPress={() => setFillLater(!fillLater)}
          style={styles.fillLaterContainer}>
          <View style={[styles.checkbox, fillLater && styles.checkboxChecked]}>
            {fillLater && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.fillLaterText}>Fill optional details later</Text>
        </TouchableOpacity>

        {/* First Name - Required */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            First Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Enter your first name"
            style={styles.input}
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
          />
        </View>

        {/* Last Name - Optional */}
        {!fillLater && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              placeholder="Enter your last name"
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => updateFormData('lastName', value)}
            />
          </View>
        )}

        {/* Email - Required */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
          />
        </View>

        {/* Phone Number - Optional */}
        {!fillLater && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              placeholder="+94 XX XXX XXXX"
              keyboardType="phone-pad"
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(value) => updateFormData('phoneNumber', value)}
            />
          </View>
        )}

        {/* Address - Optional */}
        {!fillLater && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              placeholder="Enter your address"
              style={styles.input}
              multiline
              numberOfLines={2}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
            />
          </View>
        )}

        {/* Password - Required */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Password <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Minimum 6 characters"
            secureTextEntry
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
          />
        </View>

        {/* Confirm Password - Required */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Confirm Password <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Re-enter your password"
            secureTextEntry
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleSignUp}
          style={[styles.primaryBtn, loading && styles.btnDisabled]}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        {/* Google Sign Up Button */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleGoogleSignUp}
          style={styles.googleBtn}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Sign up with Google</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By creating an account, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>. You will be
          registered as a <Text style={styles.roleText}>{selectedRole === 'collector' ? 'Collector' : 'Customer'}</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#0F766E',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0B1220',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
  },
  fillLaterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  fillLaterText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#64748B',
    fontSize: 15,
  },
  loginLink: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 15,
  },
  legal: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  legalLink: {
    color: '#0F766E',
    fontWeight: '600',
  },
  roleText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  roleContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#16A34A',
  },
  roleHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
