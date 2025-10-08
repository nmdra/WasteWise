import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';

export default function CollectionDetailsScreen() {
  const router = useRouter();
  const [wasteType, setWasteType] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!wasteType || !weight) {
      Alert.alert('Missing Info', 'Please fill in waste type and weight');
      return;
    }
    router.push('/(tabs)/cleaner/confirm-collection');
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Waste Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Select waste type"
            value={wasteType}
            onChangeText={setWasteType}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5.3"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any specific details about the collection..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm Collection</Text>
        </TouchableOpacity>
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
  content: {
    padding: Spacing.xl,
    flexGrow: 1,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  confirmBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  confirmBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
