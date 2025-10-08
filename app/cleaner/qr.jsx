import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCleaner } from '../../services/mockCleanerApi';

export default function CleanerQR() {
  const router = useRouter();
  const { stopId, binId } = useLocalSearchParams();

  const simulateScan = async () => {
    const payload = { accountId: 'acc_78A3', binId: binId || 'bin_1234', nonce: 'demo-2025-10-17' };
    const result = await MockCleaner.validateScan(payload);
    if (result.ok) {
      router.replace({
        pathname: '/cleaner/collection',
        params: { stopId, binId: result.binId, fromScan: 'true' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      <View style={styles.content}>
        <Text style={styles.title}>QR Scanner (Mock)</Text>
        <Text style={styles.subtitle}>Stop {stopId}</Text>

        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>Scanner View Placeholder</Text>
        </View>

        <TouchableOpacity style={styles.primary} onPress={simulateScan}>
          <Text style={styles.primaryText}>Simulate Scan Success</Text>
        </TouchableOpacity>
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
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  qrPlaceholder: {
    marginTop: Spacing.xl,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.card,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    color: Colors.text.muted,
  },
  primary: {
    marginTop: Spacing.xl,
    borderRadius: Radii.btn,
    backgroundColor: Colors.role.cleaner,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.text.white,
    fontWeight: '700',
  },
});
