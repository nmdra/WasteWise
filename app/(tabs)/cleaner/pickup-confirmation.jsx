import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBinById, getBinWithOwner, toggleBinStatus } from '../../../services/binService';
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
  const [qrInfo, setQrInfo] = useState(null);

  useEffect(() => {
    // Parse scanned data if available
    if (scannedData) {
      try {
        const parsedScannedData = JSON.parse(scannedData);
        if (parsedScannedData.parsedData) {
          setQrInfo(parsedScannedData.parsedData);
          console.log('📱 QR Info extracted:', parsedScannedData.parsedData);
        }
      } catch (error) {
        console.warn('Failed to parse scanned data:', error);
      }
    }
    
    loadBinAndOwnerDetails();
  }, [binId, scannedData]);

  // Platform-specific alert function
  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (buttons && buttons.length > 1) {
        if (confirmed) {
          buttons[1].onPress();
        } else if (buttons[0].onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const loadBinAndOwnerDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading bin and owner details for ID:', binId);

      // Get bin and owner details together
      const result = await getBinWithOwner(binId);
      
      if (!result || !result.bin) {
        showAlert(
          'Bin Not Found', 
          `No bin found with ID: ${binId}. Please check the QR code and try again.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setBin(result.bin);
      setOwner(result.owner);

      console.log('✅ Loaded bin details:', {
        binId: result.bin.binId,
        category: result.bin.category,
        ownerName: result.owner?.displayName || 'Unknown'
      });

    } catch (error) {
      console.error('❌ Error loading bin details:', error);
      showAlert(
        'Loading Error', 
        `Failed to load bin details: ${error.message || 'Unknown error'}. Please try again.`,
        [
          { text: 'Retry', onPress: () => loadBinAndOwnerDetails() },
          { text: 'Back', onPress: () => router.back() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!bin || !owner) return;

    // Validate weight if provided
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) {
      showAlert('Invalid Weight', 'Please enter a valid weight in kg (numbers only)');
      return;
    }

    try {
      setConfirming(true);

      console.log('🚀 Starting collection process for bin:', bin.binId);

      // Create collection record
      const collectionData = {
        binId: bin.binId, // The binId field from the bins collection (e.g., "BIN-1760878989284")
        userId: auth.currentUser?.uid || 'cleaner_demo', // Cleaner who collected it
        scannedAt: qrInfo?.timestamp ? new Date(qrInfo.timestamp).toISOString() : new Date().toISOString(), // When the QR was scanned
        wasteTypes: [qrInfo?.binCategory || bin.category], // Array of waste types from QR or bin category
        status: 'collected', // Collection status
        notes: notes.trim() || `QR scan collection - Category: ${qrInfo?.binCategory || bin.category}`, // Collection notes with QR info
        binDocId: binId, // Firebase document ID of the bin (e.g., "QynjhuuGpQm93KQfMUkd")
        ownerId: qrInfo?.accountId || owner.id, // Bin owner's user ID from QR or database
        ownerName: owner.displayName || owner.firstName || 'Customer', // Owner's display name
        weight: weight ? parseFloat(weight) : null, // Weight in kg if provided
        location: bin.location || owner.address || null, // Collection location
        stopId: `stop_${binId}_${Date.now()}`, // Generate unique stop ID
        qrScanData: qrInfo ? {
          nonce: qrInfo.nonce,
          timestamp: qrInfo.timestamp,
          type: qrInfo.type
        } : null // Store QR scan metadata
      };

      console.log('📝 Collection data prepared:', {
        binId: collectionData.binId,
        binDocId: collectionData.binDocId,
        ownerId: collectionData.ownerId,
        weight: collectionData.weight
      });

      // Submit collection using Firebase
      const createdCollection = await collectionService.createCollection(collectionData);
      console.log('✅ Collection created successfully:', createdCollection.id);

      // Update bin status to inactive (collected)
      console.log('🔄 Updating bin status to inactive...');
      let binStatusMessage = '';
      
      try {
        const binUpdateResult = await toggleBinStatus(binId, false);
        
        if (binUpdateResult.success) {
          console.log('✅ Bin status updated to inactive:', binUpdateResult.message);
          binStatusMessage = '\n\n📋 Bin marked as collected (inactive)';
          
          // Also log additional details if schedules were updated
          if (binUpdateResult.count > 0) {
            console.log(`📅 Removed from ${binUpdateResult.count} future schedule(s)`);
            binStatusMessage += `\n🗓️ Removed from ${binUpdateResult.count} future pickup(s)`;
          }
        } else {
          console.warn('⚠️ Failed to update bin status:', binUpdateResult.error);
          binStatusMessage = '\n\n⚠️ Collection recorded (bin status update pending)';
        }
      } catch (binUpdateError) {
        console.warn('⚠️ Bin status update failed:', binUpdateError);
        binStatusMessage = '\n\n⚠️ Collection recorded (bin status update pending)';
        // Continue with collection success - don't fail the entire operation
      }

      const weightText = weight ? ` (${weight}kg)` : '';
      const ownerDisplayName = owner.displayName || owner.firstName || 'Customer';
      
      showAlert(
        'Pickup Confirmed ✅',
        `Successfully collected ${bin.category} waste${weightText} from ${ownerDisplayName}'s bin.\n\nBin ID: ${bin.binId}\nCollection ID: ${createdCollection.id}${binStatusMessage}`,
        [{
          text: 'Continue Scanning',
          onPress: () => router.replace('/(tabs)/cleaner/stops')
        }]
      );

    } catch (error) {
      console.error('❌ Error confirming pickup:', error);
      showAlert(
        'Collection Error',
        `Failed to record collection: ${error.message || 'Unknown error'}. Please try again or contact support.`,
        [
          { text: 'Retry', onPress: () => setConfirming(false) },
          { text: 'Cancel', onPress: () => router.back() }
        ]
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    showAlert(
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

        {/* QR Scan Information */}
        {qrInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Scan Info</Text>
            <View style={styles.card}>
              <Text style={styles.qrInfoText}>
                📱 Scanned: {new Date(qrInfo.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.qrInfoText}>
                🗂️ Category: {qrInfo.binCategory?.toUpperCase()}
              </Text>
              <Text style={styles.qrInfoText}>
                🔐 Account: {qrInfo.accountId?.slice(0, 8)}...
              </Text>
              <Text style={styles.qrInfoText}>
                🎯 Type: {qrInfo.type}
              </Text>
            </View>
          </View>
        )}

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
            <View style={styles.binStats}>
              <Text style={styles.statText}>
                Created: {bin.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
              </Text>
              <Text style={styles.statText}>
                Scans: {bin.scanCount || 0}
              </Text>
              {bin.lastScanned && (
                <Text style={styles.statText}>
                  Last Scan: {bin.lastScanned?.toDate?.()?.toLocaleDateString() || 'Never'}
                </Text>
              )}
            </View>
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
            <Text style={styles.inputLabel}>Weight (kg) *</Text>
            <TextInput
              style={styles.weightInput}
              placeholder="e.g., 2.5"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.inputHint}>Enter the weight of collected waste in kilograms</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Collection Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g., QynjhuuGpQm93KQfMUkd, Full bin, Good condition..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>Add any relevant notes, IDs, or observations</Text>
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
  binStats: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  statText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
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
  inputHint: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  qrInfoText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
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