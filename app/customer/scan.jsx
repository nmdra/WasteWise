import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../components/app-header';
import Button from '../../components/customer/Button';
import { Colors, FontSizes, Spacing } from '../../constants/customerTheme';

export default function LinkBinScan() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setScanning(false);

    try {
      // Try to parse QR data
      const qrData = JSON.parse(data);
      
      Alert.alert(
        'QR Code Scanned',
        `Bin ID: ${qrData.binId || 'Unknown'}\nTag ID: ${qrData.tagId || 'N/A'}\n\nLink this bin to your account?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setScanning(true);
            },
          },
          {
            text: 'Link Bin',
            onPress: () => handleLinkBin(qrData),
          },
        ]
      );
    } catch (error) {
      // If not valid JSON, show raw data
      Alert.alert(
        'QR Code Scanned',
        `Data: ${data}\n\nThis doesn't appear to be a valid bin QR code.`,
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setScanning(true);
            },
          },
        ]
      );
    }
  };

  const handleLinkBin = (qrData) => {
    // In real app, this would call API to link bin to user account
    Alert.alert(
      'Success!',
      `Bin ${qrData.binId} has been linked to your account.`,
      [
        {
          text: 'View My Bins',
          onPress: () => router.push('/customer/bins'),
        },
        {
          text: 'Scan Another',
          onPress: () => {
            setScanned(false);
            setScanning(true);
          },
        },
      ]
    );
  };

  const handleSimulateScan = () => {
    const mockData = {
      binId: 'bin_' + Math.floor(Math.random() * 9999),
      tagId: 'QR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      types: ['general', 'recyclables'],
      timestamp: Date.now(),
    };

    handleBarCodeScanned({
      type: 'QR',
      data: JSON.stringify(mockData),
    });
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContent}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To scan QR codes on bins, we need access to your camera.
          </Text>
          <Button
            title="Open Settings"
            onPress={openSettings}
            variant="primary"
          />
          <Button
            title="Simulate Scan (Demo)"
            onPress={handleSimulateScan}
            variant="ghost"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.cameraContainer}>
        {scanning ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.topOverlay} />
              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.sideOverlay} />
              </View>
              <View style={styles.bottomOverlay}>
                <View style={styles.instructions}>
                  <Text style={styles.instructionText}>
                    Position QR code within the frame
                  </Text>
                  <Text style={styles.instructionSubtext}>
                    Make sure the QR code is clearly visible
                  </Text>
                </View>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.scannedOverlay}>
            <Text style={styles.scannedText}>✓ QR Code Detected</Text>
          </View>
        )}
      </View>

      {/* Demo Button */}
      <View style={styles.bottomActions}>
        <Button
          title="Simulate Scan (Demo)"
          onPress={handleSimulateScan}
          variant="ghost"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  message: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 280,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.brand.green,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
  },
  instructions: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  instructionText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  instructionSubtext: {
    fontSize: FontSizes.small,
    color: Colors.text.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  scannedOverlay: {
    flex: 1,
    backgroundColor: Colors.brand.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.white,
  },
  bottomActions: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
