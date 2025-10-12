import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Spacing } from '../../constants/customerTheme';
import { MockCustomer } from '../../services/mockCustomerApi';

export default function CustomerMap() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    const mapData = await MockCustomer.getMap();
    setData(mapData);
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <View style={styles.comingSoon}>
          <Text style={styles.icon}>🗺️</Text>
          <Text style={styles.title}>Map View Coming Soon</Text>
          <Text style={styles.subtitle}>
            Track your waste collection truck in real-time
          </Text>
          {data && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>📍 Your Location</Text>
              <Text style={styles.infoValue}>
                Lat: {data.userLocation.lat.toFixed(4)}, Lng: {data.userLocation.lng.toFixed(4)}
              </Text>
              <Text style={styles.infoLabel}>🚛 Truck Status</Text>
              <Text style={styles.infoValue}>ETA: {data.etaMinutes} minutes</Text>
              <Text style={styles.infoValue}>{data.stopsBefore} stops before you</Text>
              <Text style={styles.infoLabel}>👨‍✈️ Driver</Text>
              <Text style={styles.infoValue}>{data.truck.driverName}</Text>
            </View>
          )}
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
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  infoCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    width: '100%',
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
