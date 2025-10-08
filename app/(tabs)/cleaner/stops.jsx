import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';
import StatusChip from '../../../components/cleaner/StatusChip';

const FILTERS = ['all', 'pending', 'completed'];

export default function CleanerStops() {
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userName, setUserName] = useState('Cleaner');

  useEffect(() => {
    MockCleaner.getStopsList().then(setStops);
    loadUser();
  }, []);

  const loadUser = async () => {
    // UI-only mode: no AsyncStorage checks
    setUserName('Cleaner');
  };

  const filteredStops = stops.filter((item) =>
    filter === 'all' ? true : item.status === filter,
  );

  return (
    <View style={styles.container}>
      <AppHeader userName={userName} userRole="cleaner" />
      <View style={styles.content}>
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
});
