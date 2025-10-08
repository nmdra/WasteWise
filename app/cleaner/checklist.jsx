import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCleaner } from '../../services/mockCleanerApi';

export default function ChecklistScreen() {
  const [checklist, setChecklist] = useState(null);

  useEffect(() => {
    MockCleaner.getChecklist().then(setChecklist);
  }, []);

  if (!checklist) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg.page }} />;
  }

  const togglePPE = (key) => {
    setChecklist((prev) => ({
      ...prev,
      ppe: { ...prev.ppe, [key]: !prev.ppe[key] },
    }));
  };

  const toggleVehicle = (key) => {
    setChecklist((prev) => ({
      ...prev,
      vehicle: { ...prev.vehicle, [key]: !prev.vehicle[key] },
    }));
  };

  const handleSubmit = async () => {
    const result = await MockCleaner.submitChecklist(checklist);
    if (result.ok) {
      Alert.alert('Checklist submitted', 'Have a safe shift!');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />

      <View style={styles.content}>
        <Text style={styles.title}>Pre-shift checklist</Text>
        <Text style={styles.subtitle}>Date: {checklist.date}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PPE</Text>
          {Object.entries(checklist.ppe).map(([key, value]) => (
            <Row key={key} label={key} value={value} onChange={() => togglePPE(key)} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          {Object.entries(checklist.vehicle).map(([key, value]) => (
            <Row key={key} label={key} value={value} onChange={() => toggleVehicle(key)} />
          ))}
        </View>

        <TouchableOpacity style={styles.primary} onPress={handleSubmit}>
          <Text style={styles.primaryText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value, onChange }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

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
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
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
