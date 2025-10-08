import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';

const REASONS = [
  { key: 'no_bin', label: 'No bin out' },
  { key: 'access_blocked', label: 'Access blocked' },
  { key: 'contamination', label: 'Contamination' },
  { key: 'unsafe', label: 'Unsafe conditions' },
];

export default function MissedScreen() {
  const router = useRouter();
  const { stopId } = useLocalSearchParams();
  const [selected, setSelected] = useState('access_blocked');

  const handleSubmit = async () => {
    const result = await MockCleaner.markMissed({ stopId, reason: selected });
    if (result.ok) {
      Alert.alert('Marked missed', `${stopId} • ${selected}`);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      <View style={styles.content}>
        <Text style={styles.title}>Mark stop as missed</Text>
        <Text style={styles.subtitle}>Stop {stopId}</Text>

        <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
          {REASONS.map((reason) => {
            const active = reason.key === selected;
            return (
              <TouchableOpacity
                key={reason.key}
                onPress={() => setSelected(reason.key)}
                style={[styles.row, active && styles.rowActive]}
              >
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{reason.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.primary} onPress={handleSubmit}>
          <Text style={styles.primaryText}>Confirm</Text>
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
  row: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.card,
  },
  rowActive: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.role.cleaner,
  },
  rowText: {
    fontWeight: '700',
    color: Colors.text.primary,
  },
  rowTextActive: {
    color: '#B45309',
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
