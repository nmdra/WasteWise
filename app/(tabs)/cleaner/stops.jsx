import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../../components/app-header';
import StatusChip from '../../../components/cleaner/StatusChip';
import { auth } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { recordBinScan } from '../../../services/binService';
import { MockCleaner } from '../../../services/mockCleanerApi';

const FILTERS = ['all', 'pending', 'completed'];

// Web-compatible alert function
const showAlert = (title, message, buttons = [], onRetry = null) => {
  if (Platform.OS === 'web') {
    const userResponse = window.confirm(`${title}\n\n${message}`);
    if (userResponse && onRetry) {
      onRetry();
    }
  } else {
    Alert.alert(title, message, buttons.length > 0 ? buttons : [{ text: 'OK' }]);
  }
};

export default function CleanerStops() {
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userName, setUserName] = useState('Cleaner');
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('scan'); // 'list' or 'scan' - default to scan for the Scan tab
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const loadStops = useCallback(async () => {
    try {
      const stopsData = await MockCleaner.getStopsList();
      setStops(stopsData);
    } catch (error) {
      console.error('Error loading stops:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStops();
    setRefreshing(false);
  }, [loadStops]);

  useEffect(() => {
    loadStops();
    loadUser();
  }, [loadStops]);

  // Camera permission for scanning
  useEffect(() => {
    if (mode === 'scan') {
      requestPermission();
    }
  }, [mode, requestPermission]);

  const loadUser = async () => {
    // UI-only mode: no AsyncStorage checks
    setUserName('Cleaner');
  };

  const filteredStops = stops.filter((item) =>
    filter === 'all' ? true : item.status === filter,
  );

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(false);

    try {
      console.log('🔍 QR Code scanned:', { type, data });
      
      // Parse the QR code data (it's JSON containing bin information)
      let qrData;
      try {
        qrData = JSON.parse(data);
        console.log('📄 Parsed QR data:', qrData);
      } catch (parseError) {
        showAlert(
          'Invalid QR Code',
          'QR code data is not in valid JSON format. Please scan a valid bin QR code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }],
          () => setScanned(false)
        );
        return;
      }

      // Validate QR code structure
      if (!qrData.binId || !qrData.accountId || qrData.type !== 'bin_qr') {
        showAlert(
          'Invalid Bin QR Code',
          'This QR code is not a valid bin QR code. Please scan a bin QR code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }],
          () => setScanned(false)
        );
        return;
      }

      const binDocId = qrData.binId; // Firebase document ID
      const accountId = qrData.accountId; // Bin owner's user ID
      const binCategory = qrData.binCategory; // Bin category (paper, plastic, etc.)

      console.log('✅ Valid bin QR code detected:', {
        binDocId,
        accountId,
        binCategory
      });

      // Record the bin scan (update lastScanned and scanCount)
      try {
        console.log('📊 Recording bin scan...');
        await recordBinScan(qrData.binCode || binDocId, {
          logScan: true,
          scannedBy: auth.currentUser?.uid || 'cleaner_demo',
          location: 'Field Collection',
          notes: `QR scan by cleaner for collection`
        });
        console.log('✅ Bin scan recorded successfully');
      } catch (scanError) {
        console.warn('⚠️ Failed to record bin scan:', scanError);
        // Continue with collection process even if scan recording fails
      }

      // Navigate to pickup confirmation screen with the bin document ID
      router.push({
        pathname: '/(tabs)/cleaner/pickup-confirmation',
        params: {
          binId: binDocId,
          scannedData: JSON.stringify({ 
            type, 
            data, 
            timestamp: new Date().toISOString(),
            parsedData: qrData
          })
        }
      });

    } catch (error) {
      console.error('❌ QR Scan error:', error);
      showAlert(
        'Scan Error',
        `Failed to process QR code: ${error.message || 'Unknown error'}. Please try again.`,
        [{ text: 'Try Again', onPress: () => setScanned(false) }],
        () => setScanned(false)
      );
    }
  };

  // Render scan mode
  if (mode === 'scan') {
    // Check camera permissions first
    if (!permission) {
      return (
        <View style={styles.container}>
          <AppHeader userName={userName} userRole="cleaner" />
          <View style={styles.content}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <AppHeader userName={userName} userRole="cleaner" />
          <View style={styles.content}>
            <Text style={styles.title}>QR Scanner</Text>
            <Text style={styles.subtitle}>Camera access required</Text>
            
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                � Camera access is needed to scan QR codes
              </Text>
              
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={requestPermission}
              >
                <Text style={styles.primaryBtnText}>Allow Camera Access</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'web' && (
                <View style={styles.webPermissionHelp}>
                  <Text style={styles.webPermissionHelpText}>
                    Click "Allow" when your browser asks for camera permission
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.testBtn}
                onPress={() => {
                  // Test with example QR data
                  const testQRData = {
                    "accountId": "RZtTpvzq9UVAckcOlMrWCOyJ8yI3",
                    "binId": "QynjhuuGpQm93KQfMUkd",
                    "binCategory": "paper",
                    "nonce": "1761258709850-go67ze",
                    "type": "bin_qr",
                    "timestamp": Date.now()
                  };
                  handleBarCodeScanned({ 
                    type: 'qr', 
                    data: JSON.stringify(testQRData)
                  });
                }}
              >
                <Text style={styles.testBtnText}>🧪 Simulate QR Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryBtn}
                onPress={() => setMode('list')}
              >
                <Text style={styles.secondaryBtnText}>Back to Stops</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Camera is available and permission granted, show camera view
    return (
      <View style={styles.container}>
        <AppHeader userName={userName} userRole="cleaner" />
        
        <View style={styles.content}>
          <Text style={styles.title}>Scan Bin QR Code</Text>
          <Text style={styles.subtitle}>Point camera at bin QR code to record collection</Text>

          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.scanner}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              {...(Platform.OS === 'web' && {
                enableTorch: false,
                ratio: '16:9',
              })}
              onCameraReady={() => {
                console.log('📹 Camera ready');
                setCameraReady(true);
              }}
              onMountError={(error) => {
                console.error('📹 Camera mount error:', error);
                setCameraReady(false);
                showAlert('Camera Error', 'Failed to initialize camera. Please refresh the page and try again.');
              }}
            />
            
            {!cameraReady && (
              <View style={styles.cameraLoadingOverlay}>
                <Text style={styles.cameraLoadingText}>📹 Initializing camera...</Text>
                <Text style={styles.cameraLoadingSubtext}>
                  Please allow camera access when prompted
                </Text>
              </View>
            )}

            {scanned && (
              <View style={styles.scannedOverlay}>
                <Text style={styles.scannedText}>Processing...</Text>
              </View>
            )}
            
            {Platform.OS === 'web' && cameraReady && (
              <View style={styles.webCameraInfo}>
                <Text style={styles.webCameraInfoText}>
                  📹 Point camera at QR code to scan
                </Text>
              </View>
            )}
          </View>

          <View style={styles.scanActions}>
            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => setMode('list')}
            >
              <Text style={styles.secondaryBtnText}>View Stops</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.manualBtn}
              onPress={() => setScanned(false)}
              disabled={!scanned}
            >
              <Text style={styles.manualBtnText}>Scan Again</Text>
            </TouchableOpacity>
          </View>

          {/* Test Button for Development */}
          {__DEV__ && (
            <View style={styles.testSection}>
              <TouchableOpacity 
                style={styles.testBtn}
                onPress={() => {
                  // Test with example QR data matching the real format
                  const testQRData = {
                    "accountId": "RZtTpvzq9UVAckcOlMrWCOyJ8yI3",
                    "binId": "QynjhuuGpQm93KQfMUkd",
                    "binCategory": "paper",
                    "nonce": "1761258709850-go67ze",
                    "type": "bin_qr",
                    "timestamp": Date.now()
                  };
                  
                  handleBarCodeScanned({ 
                    type: 'qr', 
                    data: JSON.stringify(testQRData)
                  });
                }}
              >
                <Text style={styles.testBtnText}>🧪 Test Scan (Dev Only)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Render list mode
  return (
    <View style={styles.container}>
      <AppHeader userName={userName} userRole="cleaner" />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Stops</Text>
          <TouchableOpacity 
            style={styles.scanTabBtn}
            onPress={() => setMode('scan')}
          >
            <Text style={styles.scanTabBtnText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredStops}
          keyExtractor={(item) => item.stopId}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.stopCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: '/(tabs)/cleaner/stop-details', params: { stopId: item.stopId } })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.stopTitle}>{item.address}</Text>
                <Text style={styles.stopMeta}>
                  {item.time} • Bin {item.binId}
                </Text>
              </View>
              <StatusChip status={item.status} />
            </TouchableOpacity>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scanTabBtn: {
    backgroundColor: Colors.role.cleaner,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.btn,
  },
  scanTabBtnText: {
    color: Colors.text.white,
    fontWeight: '600',
    fontSize: FontSizes.body,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.btn,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.card,
  },
  filterBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.role.cleaner,
  },
  filterText: {
    color: Colors.text.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: Colors.role.cleaner,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: Spacing.md,
  },
  stopTitle: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  stopMeta: {
    color: Colors.text.secondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xs,
  },
  // Scan mode styles
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
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.surface,
  },
  scanner: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' && {
      objectFit: 'cover',
    }),
  },
  webCameraInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 5,
    padding: 8,
  },
  webCameraInfoText: {
    color: Colors.text.white,
    fontSize: FontSizes.caption,
    textAlign: 'center',
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cameraLoadingText: {
    color: Colors.text.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  cameraLoadingSubtext: {
    color: Colors.text.secondary,
    fontSize: FontSizes.caption,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  primaryBtn: {
    backgroundColor: Colors.role.cleaner,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.btn,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  webPermissionHelp: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.card,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  webPermissionHelpText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.caption,
    textAlign: 'center',
    fontStyle: 'italic',
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
  scanActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.brand.teal,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  manualBtn: {
    flex: 1,
    backgroundColor: Colors.role.cleaner,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  manualBtnText: {
    color: Colors.text.white,
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
  testScanBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  testScanBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  testSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  testBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  testBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  webFallbackContainer: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.lg,
  },
  webFallbackTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  webFallbackText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
});
