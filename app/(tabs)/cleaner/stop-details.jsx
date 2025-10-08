import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import AppHeader from '../../../components/app-header';
import { MockCleaner } from '../../../services/mockCleanerApi';
import KeyValue from '../../../components/cleaner/KeyValue';
import StatusChip from '../../../components/cleaner/StatusChip';

export default function StopDetailsScreen() {
  const router = useRouter();
  const { stopId } = useLocalSearchParams();
  const [stop, setStop] = useState(null);

  useEffect(() => {
    if (stopId) {
      MockCleaner.getStop(stopId).then(setStop);
    }
  }, [stopId]);

  if (!stop) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg.page }} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{stop.address}</Text>
          <Text style={styles.subtitle}>Customer: {stop.customer.name}</Text>
          <Text style={styles.subtitle}>Phone: {stop.customer.phone}</Text>
          <Text style={styles.instructions}>{stop.instructions}</Text>

          <View style={{ marginTop: Spacing.md }}>
            <KeyValue label="Bin" value={stop.bin.binId} />
            <KeyValue label="Waste" value={stop.bin.wasteTypes.join(', ')} />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primary}
            onPress={() =>
              router.push({ pathname: '/(tabs)/cleaner/scan-bin', params: { stopId, binId: stop.bin.binId } })
            }
          >
            <Text style={styles.primaryText}>Scan Bin Tag</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ghost}
            onPress={() =>
              router.push({ pathname: '/(tabs)/cleaner/collection-details', params: { stopId, binId: stop.bin.binId } })
            }
          >
            <Text style={styles.ghostText}>Enter Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ghost, { marginTop: Spacing.sm }]}
            onPress={() =>
              router.push({ pathname: '/(tabs)/cleaner/report-issue', params: { stopId, binId: stop.bin.binId } })
            }
          >
            <Text style={styles.ghostText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.warn}
            onPress={() => router.push({ pathname: '/(tabs)/cleaner/missed', params: { stopId } })}
          >
            <Text style={styles.warnText}>Mark Missed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghost}>
            <Text style={styles.ghostText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginTop: Spacing.lg }]}> 
          <Text style={styles.sectionTitle}>Status</Text>
          <StatusChip status="pending" />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  instructions: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  primary: {
    flex: 1,
    backgroundColor: Colors.role.cleaner,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: FontSizes.body,
  },
  ghost: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ghostText: {
    color: Colors.brand.teal,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  warn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderColor: Colors.role.cleaner,
    borderWidth: 1,
    borderRadius: Radii.btn,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  warnText: {
    color: '#B45309',
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
});
