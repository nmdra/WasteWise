import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';

export default function ScanBinScreen() {
  const router = useRouter();
  const [detectedType, setDetectedType] = useState('General Waste');
  const [location, setLocation] = useState({ lat: 34.052235, lon: -118.243683 });

  const handleScan = () => {
    // Simulate successful scan - navigate to collection details
    router.push('/(tabs)/cleaner/collection-details');
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <View style={styles.content}>
        <View style={styles.scanArea}>
          <MaterialIcons name="qr-code-scanner" size={64} color={Colors.brand.green} />
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanBtnText}>Scan Bin Tag</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Detected Waste Type</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{detectedType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={24} color={Colors.state.info} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Location</Text>
              <Text style={styles.locationCoords}>
                Lat: {location.lat}, Lon: {location.lon}
              </Text>
            </View>
          </View>
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
  },
  scanArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    borderRadius: Radii.card,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  scanBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scanBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.bg.light,
    borderRadius: Radii.btn,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  chip: {
    backgroundColor: Colors.brand.lightGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.chip,
  },
  chipText: {
    color: Colors.brand.green,
    fontSize: FontSizes.small,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  locationTitle: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});
