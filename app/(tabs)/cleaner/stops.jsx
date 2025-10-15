import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AppHeader from '../../../components/app-header';
import StatusChip from '../../../components/cleaner/StatusChip';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';
import { collectionService } from '../../../services/collectionService';
import { auth } from '../../../config/firebase';

const FILTERS = ['all', 'pending', 'completed'];

export default function CleanerStops() {
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userName, setUserName] = useState('Cleaner');
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('scan'); // 'list' or 'scan' - default to scan for the Scan tab
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
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
      // The QR code contains the Firebase document ID of the bin
      const binDocId = data.trim();

      // Validate that it's a Firebase document ID (should be 20 characters)
      if (binDocId.length !== 20) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain a valid bin ID. Please scan a valid bin QR code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Navigate to pickup confirmation screen with the bin document ID
      router.push({
        pathname: '/(tabs)/cleaner/pickup-confirmation',
        params: {
          binId: binDocId,
          scannedData: JSON.stringify({ type, data })
        }
      });

    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    }
  };

  // Render scan mode
  if (mode === 'scan') {
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
            <Text style={styles.permissionText}>Camera permission denied</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={requestPermission}
            >
              <Text style={styles.retryBtnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { marginTop: Spacing.md }]}
              onPress={() => setMode('list')}
            >
              <Text style={styles.retryBtnText}>Back to Stops</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

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
            />
            
            {scanned && (
              <View style={styles.scannedOverlay}>
                <Text style={styles.scannedText}>Processing...</Text>
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
});
