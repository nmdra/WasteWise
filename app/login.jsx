import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmail, signInWithGoogle } from '../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);

      if (result.success) {
        // Store user token and data
        const token = await result.user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', result.user.uid);
        await AsyncStorage.setItem('userEmail', result.user.email);
        
        // Store user profile data
        if (result.profile) {
          await AsyncStorage.setItem('userRole', result.profile.role || 'customer');
          await AsyncStorage.setItem('userFirstName', result.profile.firstName || '');
        }

        Alert.alert('Success', 'Welcome back!');
        
        // Navigate based on role
        const userRole = result.profile?.role || 'customer';
        if (userRole === 'cleaner') {
          router.replace('/(tabs)/cleaner/home');
        } else {
          router.replace('/(tabs)/customer/home');
        }
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();

      if (result.success) {
        // Store user token and data
        const token = await result.user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', result.user.uid);
        await AsyncStorage.setItem('userEmail', result.user.email);
        
        // Store user profile data
        if (result.profile) {
          await AsyncStorage.setItem('userRole', result.profile.role || 'customer');
          await AsyncStorage.setItem('userFirstName', result.profile.firstName || result.user.displayName || '');
        }

        if (result.isNewUser) {
          Alert.alert('Welcome!', 'Account created successfully. You can complete your profile later.');
        } else {
          Alert.alert('Success', 'Welcome back!');
        }

        // Navigate based on role
        const userRole = result.profile?.role || 'customer';
        if (userRole === 'cleaner') {
          router.replace('/(tabs)/cleaner/home');
        } else {
          router.replace('/(tabs)/customer/home');
        }
      } else {
        Alert.alert('Google Sign-In Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Google sign-in failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to continue to WasteWise</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={() => Alert.alert('Forgot Password', 'Reset flow coming soon')}
          style={styles.forgotPassword}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleLogin}
          style={[styles.primaryBtn, loading && styles.btnDisabled]}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryBtnText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleGoogleSignIn}
          style={styles.googleBtn}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity onPress={handleSignUp} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Create New Account</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  linkText: {
    color: '#0F766E',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
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
    marginVertical: 32,
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
    marginBottom: 12,
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
  secondaryBtn: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  secondaryBtnText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 17,
  },
  legal: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  legalLink: {
    color: '#0F766E',
    fontWeight: '600',
  },
});
