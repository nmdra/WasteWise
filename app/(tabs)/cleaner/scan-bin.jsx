import { BarCodeScanner } from 'expo-barcode-scanner';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { collectionService } from '../../../services/collectionService';
import { auth } from '../../../config/firebase';

export default function ScanBinScreen() {
  const router = useRouter();
  const { stopId, binId } = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(false);

    try {
      // Parse QR code data (assuming it contains bin information)
      const qrData = JSON.parse(data);

      // Validate that scanned bin matches expected bin
      if (qrData.binId !== binId) {
        Alert.alert(
          'Bin Mismatch',
          `Scanned bin (${qrData.binId}) doesn't match expected bin (${binId})`,
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Create collection record
      const collectionData = {
        stopId,
        binId: qrData.binId,
        userId: auth.currentUser?.uid || 'cleaner_demo',
        scannedAt: new Date().toISOString(),
        wasteTypes: qrData.wasteTypes || ['general'],
        status: 'collected',
        notes: 'QR scan successful - automatic collection'
      };

      // Submit collection using Firebase
      await collectionService.createCollection(collectionData);

      Alert.alert(
        'Collection Recorded',
        'Bin scanned and collection recorded successfully!',
        [{
          text: 'OK',
          onPress: () => router.replace('/(tabs)/cleaner/stops')
        }]
      );

    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.content}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <AppHeader userName="Cleaner" userRole="cleaner" />
        <View style={styles.content}>
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={() => BarCodeScanner.requestPermissionsAsync()}
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
        <Text style={styles.title}>Scan Bin QR Code</Text>
        <Text style={styles.subtitle}>Expected Bin: {binId}</Text>

        <View style={styles.scannerContainer}>
          {scanning && (
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
            />
          )}
          
          {scanned && (
            <View style={styles.scannedOverlay}>
              <Text style={styles.scannedText}>Processing...</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Scanning Instructions</Text>
          <Text style={styles.infoText}>
            • Point camera at the QR code on the bin{'\n'}
            • Ensure good lighting{'\n'}
            • Hold steady until scan completes{'\n'}
            • Collection will be recorded automatically
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.manualBtn}
          onPress={() => router.push({ 
            pathname: '/(tabs)/cleaner/collection-details', 
            params: { stopId, binId } 
          })}
        >
          <Text style={styles.manualBtnText}>Enter Details Manually</Text>
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
