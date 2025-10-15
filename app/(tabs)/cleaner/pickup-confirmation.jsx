import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBinById } from '../../../services/binService';
import { getUserProfile } from '../../../services/userService';
import { collectionService } from '../../../services/collectionService';
import { auth } from '../../../config/firebase';
import AppHeader from '../../../components/app-header';
import StatusChip from '../../../components/cleaner/StatusChip';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';

export default function PickupConfirmation() {
  const router = useRouter();
  const { binId, scannedData } = useLocalSearchParams();
  const [bin, setBin] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadBinAndOwnerDetails();
  }, [binId]);

  const loadBinAndOwnerDetails = async () => {
    try {
      setLoading(true);

      // Get bin details
      const binData = await getBinById(binId);
      if (!binData) {
        Alert.alert('Error', 'Bin not found');
        router.back();
        return;
      }
      setBin(binData);

      // Get owner details
      const ownerData = await getUserProfile(binData.userId);
      setOwner(ownerData);

    } catch (error) {
      console.error('Error loading bin details:', error);
      Alert.alert('Error', 'Failed to load bin details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!bin || !owner) return;

    // Validate weight if provided
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (numbers only)');
      return;
    }

    try {
      setConfirming(true);

      // Create collection record
      const collectionData = {
        stopId: `stop_${binId}_${Date.now()}`, // Generate unique stop ID
        binId: bin.binId,
        userId: auth.currentUser?.uid || 'cleaner_demo',
        scannedAt: new Date().toISOString(),
        wasteTypes: [bin.category],
        status: 'collected',
        notes: notes.trim(),
        binDocId: binId, // Store the Firebase document ID
        ownerId: owner.id,
        ownerName: owner.displayName || owner.firstName || 'Customer',
        weight: weight ? parseFloat(weight) : null
      };

      // Submit collection using Firebase
      await collectionService.createCollection(collectionData);

      Alert.alert(
        'Pickup Confirmed',
        `Successfully collected ${weight ? `${weight}kg` : 'waste'} from ${owner.displayName || owner.firstName || 'Customer'}'s ${bin.category} bin`,
        [{
          text: 'OK',
          onPress: () => router.replace('/(tabs)/cleaner/stops')
        }]
      );

    } catch (error) {
      console.error('Error confirming pickup:', error);
      Alert.alert('Error', 'Failed to confirm pickup. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bin details...</Text>
        </View>
      </View>
    );
  }

  if (!bin || !owner) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bin or owner details not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadBinAndOwnerDetails}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Confirm Pickup</Text>

        {/* Bin Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bin Details</Text>
          <View style={styles.card}>
            <View style={styles.binHeader}>
              <Text style={styles.binId}>ID: {bin.binId}</Text>
              <StatusChip status={bin.isActive ? 'active' : 'inactive'} />
            </View>
            <Text style={styles.binCategory}>
              {bin.category?.toUpperCase()} BIN
            </Text>
            <Text style={styles.binDescription}>
              {bin.description || 'No description provided'}
            </Text>
            {bin.location && (
              <Text style={styles.binLocation}>📍 {bin.location}</Text>
            )}
          </View>
        </View>

        {/* Owner Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner Details</Text>
          <View style={styles.card}>
            <Text style={styles.ownerName}>
              {owner.displayName || `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Customer'}
            </Text>
            <Text style={styles.ownerEmail}>{owner.email}</Text>
            {owner.phone && <Text style={styles.ownerPhone}>📞 {owner.phone}</Text>}
            {owner.address && <Text style={styles.ownerAddress}>🏠 {owner.address}</Text>}
            {owner.zone && <Text style={styles.ownerZone}>📍 Zone: {owner.zone}</Text>}
          </View>
        </View>

        {/* Collection Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.weightInput}
              placeholder="Enter weight in kg"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about the collection..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={confirming}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
            onPress={handleConfirmPickup}
            disabled={confirming}
          >
            <Text style={styles.confirmBtnText}>
              {confirming ? 'Confirming...' : 'Confirm Pickup'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: Colors.brand.teal,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.btn,
  },
  retryBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  binHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  binId: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  binCategory: {
    fontSize: FontSizes.h4,
    fontWeight: '700',
    color: Colors.role.cleaner,
    marginBottom: Spacing.sm,
  },
  binDescription: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  binLocation: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  ownerName: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  ownerEmail: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ownerPhone: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ownerAddress: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ownerZone: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  weightInput: {
    backgroundColor: Colors.bg.page,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  notesInput: {
    backgroundColor: Colors.bg.page,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.brand.teal,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.role.cleaner,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});