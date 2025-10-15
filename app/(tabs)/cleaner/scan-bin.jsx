import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { collection, collectionGroup, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import AppHeader from '../../../components/app-header';
import { auth, db } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { collectionService } from '../../../services/collectionService';

export default function ScanBinScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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
      // Parse QR code data (assuming it contains bin information)
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        // If not JSON, try to extract binId from string
        qrData = { binId: data };
      }

      const scannedBinId = qrData.binId || data;
      console.log('🔍 Scanned Bin ID:', scannedBinId);

      // Search for stops across ALL schedules that contain this bin
      console.log('🔍 Searching for stops with binId:', scannedBinId);
      
      // Use collectionGroup to search stops across all schedules
      const stopsQuery = query(
        collectionGroup(db, 'stops'),
        where('status', '==', 'pending')
      );

      const stopsSnapshot = await getDocs(stopsQuery);
      console.log('📍 Found', stopsSnapshot.size, 'pending stops total');

      let foundStop = null;
      let scheduleId = null;

      // Search through all stops to find one with matching binId
      for (const stopDoc of stopsSnapshot.docs) {
        const stopData = stopDoc.data();
        
        // Check both old format (single bin) and new format (bins array)
        let binMatch = false;
        
        if (stopData.bins && Array.isArray(stopData.bins)) {
          // New format: bins is an array
          binMatch = stopData.bins.some(bin => bin.binId === scannedBinId);
        } else if (stopData.binId === scannedBinId) {
          // Old format: single binId field
          binMatch = true;
        }

        if (binMatch) {
          foundStop = {
            id: stopDoc.id,
            ref: stopDoc.ref,
            ...stopData
          };
          // Get schedule ID from the document path
          scheduleId = stopDoc.ref.parent.parent.id;
          console.log('✅ Found matching stop:', foundStop.id, 'in schedule:', scheduleId);
          break;
        }
      }

      if (!foundStop) {
        Alert.alert(
          'Stop Not Found',
          `No pending collection stop found for bin ${scannedBinId}. This bin may not be scheduled for collection.`,
          [{ 
            text: 'Try Again', 
            onPress: () => {
              setScanned(false);
              setScanning(true);
              setProcessing(false);
            }
          }]
        );
        return;
      }

      // Mark the stop as collected
      console.log('📝 Updating stop status to collected...');
      await updateDoc(foundStop.ref, {
        status: 'collected',
        collectedAt: new Date(),
        collectedBy: auth.currentUser?.uid || 'cleaner',
      });

      // Create collection record
      const collectionData = {
        stopId: foundStop.id,
        scheduleId: scheduleId,
        binId: scannedBinId,
        userId: auth.currentUser?.uid || 'cleaner',
        scannedAt: new Date().toISOString(),
        wasteTypes: qrData.wasteTypes || foundStop.wasteTypes || ['general'],
        status: 'collected',
        notes: 'QR scan successful - automatic collection',
        collectedAt: new Date(),
      };

      console.log('💾 Creating collection record...');
      await collectionService.createCollection(collectionData);

      Alert.alert(
        'Collection Recorded ✅',
        `Bin ${scannedBinId} has been marked as collected!\n\nSchedule: ${scheduleId}\nStop: ${foundStop.id}`,
        [{
          text: 'Done',
          onPress: () => router.back()
        },
        {
          text: 'Scan Another',
          onPress: () => {
            setScanned(false);
            setScanning(true);
            setProcessing(false);
          }
        }]
      );

    } catch (error) {
      console.error('❌ Scan error:', error);
      Alert.alert(
        'Scan Error',
        `Failed to process QR code: ${error.message}`,
        [{ 
          text: 'Try Again', 
          onPress: () => {
            setScanned(false);
            setScanning(true);
            setProcessing(false);
          }
        }]
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
            • System automatically finds the stop in all schedules{'\n'}
            • Stop is marked as collected{'\n'}
            • Collection record is created{'\n'}
            • Works for any scheduled bin
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
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
});
