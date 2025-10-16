import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { collection, collectionGroup, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import AppHeader from '../../../components/app-header';
import { auth, db } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { collectionService } from '../../../services/collectionService';
import { getBinById, updateBinStatus } from '../../../services/binService.optimized';
import { updateStop } from '../../../services/stopsService';

export default function ScanBinScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  // New state for form workflow
  const [showForm, setShowForm] = useState(false);
  const [binDetails, setBinDetails] = useState(null);
  const [scannedBinId, setScannedBinId] = useState(null);
  const [formData, setFormData] = useState({
    weight: '',
    notes: '',
  });

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setScanning(false);
    setProcessing(true);

    try {
      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        qrData = { binId: data };
      }

      const binId = qrData.binId || data;
      console.log('🔍 Scanned Bin ID:', binId);
      
      // Fetch bin details from Firebase
      const bin = await getBinById(binId);
      
      if (!bin) {
        Alert.alert(
          'Bin Not Found',
          `Could not find bin with ID: ${binId}`,
          [{ 
            text: 'Try Again', 
            onPress: resetScanner
          }]
        );
        return;
      }

      console.log('✅ Loaded bin details:', bin);
      
      // Store bin details and show form
      setBinDetails(bin);
      setScannedBinId(binId);
      setShowForm(true);

    } catch (error) {
      console.error('❌ Scan error:', error);
      Alert.alert(
        'Scan Error',
        `Failed to load bin details: ${error.message}`,
        [{ 
          text: 'Try Again', 
          onPress: resetScanner
        }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setProcessing(false);
    setShowForm(false);
    setBinDetails(null);
    setScannedBinId(null);
    setFormData({ weight: '', notes: '' });
  };

  const handleConfirmCollection = async () => {
    if (!binDetails || !scannedBinId) return;

    setProcessing(true);

    try {
      console.log('🔍 Searching for stops containing bin:', scannedBinId);
      
      // Search for stops across ALL schedules that contain this bin
      const stopsQuery = query(
        collectionGroup(db, 'stops'),
        where('status', '==', 'pending')
      );

      const stopsSnapshot = await getDocs(stopsQuery);
      console.log('📍 Found', stopsSnapshot.size, 'pending stops total');

      const matchingStops = [];

      // Find all stops that contain this binId
      for (const stopDoc of stopsSnapshot.docs) {
        const stopData = stopDoc.data();
        
        // Check if bins array contains this binId
        if (stopData.bins && Array.isArray(stopData.bins)) {
          const hasBin = stopData.bins.some(bin => bin.binId === scannedBinId);
          
          if (hasBin) {
            const scheduleId = stopDoc.ref.parent.parent.id;
            matchingStops.push({
              stopId: stopDoc.id,
              scheduleId: scheduleId,
              stopRef: stopDoc.ref,
              stopData: stopData
            });
            console.log('✅ Found matching stop:', stopDoc.id, 'in schedule:', scheduleId);
          }
        }
      }

      if (matchingStops.length === 0) {
        Alert.alert(
          'No Stops Found',
          `No pending collection stops found for bin ${binDetails.binCode || scannedBinId}. This bin may not be scheduled for collection.`,
          [{ text: 'OK', onPress: resetScanner }]
        );
        return;
      }

      console.log(`📝 Updating ${matchingStops.length} stop(s) to collected...`);

      // Mark all matching stops as collected
      const updatePromises = matchingStops.map(async (stop) => {
        await updateDoc(stop.stopRef, {
          status: 'collected',
          collectedAt: new Date(),
          collectedBy: auth.currentUser?.uid || 'cleaner',
          notes: formData.notes || ''
        });
      });

      await Promise.all(updatePromises);
      console.log('✅ All stops marked as collected');

      // Create collection record (this also increments scan count and updates lastScanned)
      const collectionData = {
        binId: scannedBinId,
        binDocId: binDetails.id,
        binCode: binDetails.binCode,
        userId: auth.currentUser?.uid || 'cleaner',
        ownerId: binDetails.userId,
        ownerName: binDetails.ownerName || 'Unknown',
        scannedAt: new Date().toISOString(),
        collectedAt: new Date(),
        wasteTypes: binDetails.wasteTypes || [binDetails.category] || ['general'],
        status: 'collected',
        notes: formData.notes || 'QR scan collection',
        weight: formData.weight ? parseFloat(formData.weight) : null,
        location: binDetails.location || null,
        // Include first stop details
        stopId: matchingStops[0].stopId,
        scheduleId: matchingStops[0].scheduleId,
      };

      console.log('💾 Creating collection record...', collectionData);
      await collectionService.createCollection(collectionData);
      console.log('✅ Collection record created');

      // Deactivate the bin after collection
      console.log('🔒 Deactivating bin...');
      const deactivateResult = await updateBinStatus(binDetails.id, false);
      if (deactivateResult.success) {
        console.log('✅ Bin deactivated successfully');
      } else {
        console.warn('⚠️ Failed to deactivate bin:', deactivateResult.error);
      }

      // Success message
      Alert.alert(
        'Collection Recorded ✅',
        `Bin ${binDetails.binCode || scannedBinId} has been collected!\n\n` +
        `Stops Updated: ${matchingStops.length}\n` +
        `Weight: ${formData.weight ? formData.weight + ' kg' : 'Not specified'}\n` +
        `Owner: ${binDetails.ownerName || 'Unknown'}\n` +
        `Status: Bin deactivated and scan count updated`,
        [
          {
            text: 'Done',
            onPress: () => {
              resetScanner();
              router.back();
            }
          },
          {
            text: 'Scan Another',
            onPress: resetScanner
          }
        ]
      );

    } catch (error) {
      console.error('❌ Collection error:', error);
      Alert.alert(
        'Collection Error',
        `Failed to record collection: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.content}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.content}>
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={requestPermission}
          >
            <Text style={styles.retryBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Scan Bin QR Code 📱</Text>
        <Text style={styles.subtitle}>Scan any bin to mark it as collected</Text>

        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scanner}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          
          {scanned && (
            <View style={styles.scannedOverlay}>
              {processing ? (
                <>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.scannedText}>Processing...</Text>
                </>
              ) : (
                <Text style={styles.scannedText}>✓ Scanned</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            • Point camera at any bin's QR code{'\n'}
            • Review bin details and fill collection form{'\n'}
            • Confirm to mark as collected{'\n'}
            • All related stops are automatically updated{'\n'}
            • Collection record is created
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Collection Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Collection Details</Text>
              
              {binDetails && (
                <View style={styles.binInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bin Code:</Text>
                    <Text style={styles.infoValue}>{binDetails.binCode}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Category:</Text>
                    <Text style={styles.infoValue}>{binDetails.category || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Owner:</Text>
                    <Text style={styles.infoValue}>{binDetails.ownerName || 'Unknown'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location:</Text>
                    <Text style={styles.infoValue}>{binDetails.location || 'N/A'}</Text>
                  </View>
                  {binDetails.description && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Description:</Text>
                      <Text style={styles.infoValue}>{binDetails.description}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Weight (kg) - Optional</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter weight in kg"
                  placeholderTextColor={Colors.text.secondary}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes - Optional</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add any notes about this collection..."
                  placeholderTextColor={Colors.text.secondary}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetScanner}
                  disabled={processing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmCollection}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Collection</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  permissionText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  scannerContainer: {
    borderRadius: Radii.card,
    overflow: 'hidden',
    height: 300,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  scanner: {
    flex: 1,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    color: Colors.text.white,
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: Colors.bg.light,
    borderRadius: Radii.btn,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  manualBtn: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  manualBtnText: {
    color: Colors.brand.teal,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: Colors.bg.light,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.text.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  retryBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  binInfo: {
    backgroundColor: Colors.bg.light,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  infoLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.light,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: Colors.bg.light,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  confirmButton: {
    backgroundColor: Colors.brand.green,
  },
  cancelButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confirmButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.white,
  },
});
