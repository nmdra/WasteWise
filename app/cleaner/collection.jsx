import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCleaner } from '../../services/mockCleanerApi';

export default function CollectionScreen() {
  const router = useRouter();
  const { stopId, binId } = useLocalSearchParams();
  const [weight, setWeight] = useState('10.5');
  const [bags, setBags] = useState('2');
  const [types, setTypes] = useState({ general: true, recyclables: true, organic: false });

  const toggleType = (key) => {
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    const payload = {
      stopId,
      binId,
      weightKg: parseFloat(weight),
      bagCount: parseInt(bags || '0', 10),
      wasteType: Object.keys(types).filter((key) => types[key]),
      timestamp: new Date().toISOString(),
      photos: ['/mock/before.jpg', '/mock/after.jpg'],
    };

    const result = await MockCleaner.submitPickup(payload);
    if (result.ok) {
      Alert.alert('Pickup saved', `ID: ${result.pickupId}`);
      router.replace('/(tabs)/cleaner/home');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Collection</Text>
          <Text style={styles.subtitle}>
            Stop {stopId} • Bin {binId}
          </Text>

          <View style={styles.group}>
            <Text style={styles.label}>Waste types</Text>
            <View style={styles.row}>
              {['general', 'recyclables', 'organic'].map((type) => {
                const active = types[type];
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleType(type)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Bag count</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={bags}
              onChangeText={setBags}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.ghost}>
              <Text style={styles.ghostText}>Add photos (stub)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} onPress={handleSubmit}>
              <Text style={styles.primaryText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
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
  group: {
    marginTop: Spacing.lg,
  },
  label: {
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  chip: {
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg.card,
  },
  chipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.role.cleaner,
  },
  chipText: {
    color: Colors.text.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: Colors.role.cleaner,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg.card,
  },
  ghost: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
  },
  ghostText: {
    color: Colors.brand.teal,
    fontWeight: '700',
  },
  primary: {
    flex: 1,
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
