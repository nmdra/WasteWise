import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';

export default function ConfirmCollectionScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/(tabs)/cleaner/home');
  };

  const handleReschedule = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check" size={40} color={Colors.text.white} />
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.title}>Collection Confirmed!</Text>
          <Text style={styles.message}>
            Details for the waste collection have been successfully recorded. You can now mark the task as complete or choose to reschedule if needed.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete}>
            <Text style={styles.primaryBtnText}>Mark as Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReschedule}>
            <Text style={styles.secondaryBtnText}>Reschedule Pickup</Text>
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
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  messageCard: {
    backgroundColor: Colors.bg.light,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    width: '100%',
    marginBottom: 40,
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
  },
  actions: {
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: Colors.bg.card,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  secondaryBtnText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
