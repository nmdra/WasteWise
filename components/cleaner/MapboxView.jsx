import React, { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Colors } from '../../constants/customerTheme';

const formatNumber = (value) => {
  if (value == null) return '—';
  return Number(value).toFixed(4);
};

const StopRow = ({ stop }) => {
  const chipStyle = stop.status === 'done' ? styles.chipDone : styles.chipPending;
  return (
    <View style={styles.stopRow}>
      <View style={styles.stopMain}>
        <Text style={styles.stopTitle}>{stop.name}</Text>
        <Text style={styles.stopMeta}>Lat {formatNumber(stop.lat)} · Lng {formatNumber(stop.lng)}</Text>
      </View>
      <View style={[styles.statusChip, chipStyle]}>
        <Text style={styles.statusText}>{stop.status === 'done' ? 'Completed' : 'Pending'}</Text>
      </View>
    </View>
  );
};

export default function MapboxView({ center, stops = [], polyline = [] }) {
  const summary = useMemo(() => {
    const totalStops = stops.length;
    const completed = stops.filter((stop) => stop.status === 'done').length;
    const pending = totalStops - completed;
    const approxDistanceKm = polyline.length ? (polyline.length * 0.08).toFixed(1) : '—';

    return {
      totalStops,
      completed,
      pending,
      approxDistanceKm,
    };
  }, [stops, polyline]);

  return (
    <View style={styles.mockContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Overview</Text>
  <Text style={styles.subtitle}>Mock visualization (map service disabled)</Text>
      </View>

      <View style={styles.focusCard}>
        <Text style={styles.focusLabel}>Current Focus</Text>
        <Text style={styles.focusValue}>
          Lat {formatNumber(center?.lat)} · Lng {formatNumber(center?.lng)}
        </Text>
  <Text style={styles.focusHint}>Live map will reappear when map credentials are configured.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Stops</Text>
          <Text style={styles.summaryValue}>{summary.totalStops}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardAccent]}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{summary.completed}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>{summary.pending}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Route km</Text>
          <Text style={styles.summaryValue}>{summary.approxDistanceKm}</Text>
        </View>
      </View>

      <FlatList
        data={stops}
        keyExtractor={(item) => item.stopId}
        renderItem={({ item }) => <StopRow stop={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No stops assigned to this route yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mockContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: Colors.bg.card,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 4,
  },
  focusCard: {
    backgroundColor: Colors.bg.light,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  focusLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.text.muted,
  },
  focusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.role.cleaner,
    marginTop: 8,
  },
  focusHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  summaryCardAccent: {
    backgroundColor: Colors.brand.lightGreen,
    borderColor: Colors.role.cleaner,
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.text.muted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    color: Colors.text.primary,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  stopMain: {
    flex: 1,
    marginRight: 12,
  },
  stopTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  stopMeta: {
    fontSize: 13,
    color: Colors.text.muted,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipDone: {
    backgroundColor: Colors.brand.lightGreen,
  },
  chipPending: {
    backgroundColor: Colors.bg.light,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.muted,
    marginTop: 32,
  },
});
