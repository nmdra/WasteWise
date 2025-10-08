import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';

export default function ScanErrorScreen() {
  const router = useRouter();

  const handleRetry = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/(tabs)/cleaner/home');
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <View style={styles.content}>
        <View style={styles.errorIcon}>
          <MaterialIcons name="close" size={40} color="#F44336" />
        </View>

        <Text style={styles.title}>Scanner Not Responding</Text>
        <Text style={styles.message}>
          Please ensure your device camera is enabled and try again. If the issue persists, contact support.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>Retry Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
            <Text style={styles.homeBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 40,
  },
  actions: {
    width: '100%',
  },
  retryBtn: {
    backgroundColor: '#F44336',
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  retryBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  homeBtn: {
    backgroundColor: Colors.bg.card,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  homeBtnText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
