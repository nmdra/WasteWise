import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { wasteTypeIcons } from '../../../services/scheduleService';
import {
  subscribeToStopsBySchedule,
  markStopAsCollected,
  markStopAsSkipped,
  getStopStats,
} from '../../../services/stopsService';

export default function ScheduleDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [schedule, setSchedule] = useState(null);
  const [stops, setStops] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, main, customer, pending, collected

  // Safe navigation helper
  const safeGoBack = () => {
    try {
      setTimeout(() => {
        try {
          router.back();
        } catch (err) {
          try {
            router.push('/');
          } catch (e) {
            console.warn('Navigation fallback failed', e);
          }
        }
      }, 50);
    } catch (err) {
      console.warn('safeGoBack error', err);
    }
  };

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid schedule ID');
      safeGoBack();
      return;
    }

    loadSchedule();
    const unsubscribe = subscribeToStopsBySchedule(id, (stopsData) => {
      setStops(stopsData);
      loadStats();
    });

    return () => unsubscribe();
  }, [id]);

  const loadSchedule = async () => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', id));
      if (scheduleDoc.exists()) {
        setSchedule({
          id: scheduleDoc.id,
          ...scheduleDoc.data(),
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await getStopStats(id);
    setStats(statsData);
  };
  // Cross-platform prompt helper: uses Alert.prompt on iOS, falls back to window.prompt on web/Android
  const promptInput = (title, message, placeholder = '') => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        // eslint-disable-next-line no-undef
        Alert.prompt(title, message, (text) => resolve(text));
      } else if (typeof window !== 'undefined' && window.prompt) {
        const result = window.prompt(`${title}\n${message}`, placeholder);
        resolve(result);
      } else {
        // Fallback: simple alert then resolve with empty
        Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve('') }]);
      }
    });
  };

  const handleMarkCollected = async (stopId) => {
    const notes = await promptInput('Mark as Collected', 'Add any notes (optional)');
    const result = await markStopAsCollected(id, stopId, notes || '');
    if (result.success) {
      Alert.alert('Success', 'Stop marked as collected');
    } else {
      Alert.alert('Error', 'Failed to mark as collected');
    }
  };

  const handleMarkSkipped = async (stopId) => {
    const reason = await promptInput('Skip Stop', 'Why are you skipping this stop?');
    const result = await markStopAsSkipped(id, stopId, reason || 'No reason provided');
    if (result.success) {
      Alert.alert('Success', 'Stop skipped');
    } else {
      Alert.alert('Error', 'Failed to skip stop');
    }
  };

  const getFilteredStops = () => {
    switch (filter) {
      case 'main':
        return stops.filter(s => s.type === 'main');
      case 'customer':
        return stops.filter(s => s.type === 'customer');
      case 'pending':
        return stops.filter(s => s.status === 'pending');
      case 'collected':
        return stops.filter(s => s.status === 'collected');
      default:
        return stops;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Schedule not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredStops = getFilteredStops();

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {/* Schedule Info */}
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleDate}>{formatDate(schedule.date)}</Text>
          <View style={styles.zoneAreaRow}>
            <View style={styles.zoneBadge}>
              <Text style={styles.zoneBadgeText}>Zone {schedule.zone}</Text>
            </View>
            <Text style={styles.areaText}>{schedule.area}</Text>
          </View>

          <View style={styles.timeSection}>
            {schedule.timeRanges?.map((range, idx) => (
              <View key={idx} style={styles.timeBadge}>
                <Text style={styles.timeText}>
                  ⏰ {range.start} - {range.end}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.wasteTypes}>
            {schedule.wasteTypes?.map((type) => (
              <View key={type} style={styles.wasteTypeBadge}>
                <Text style={styles.wasteTypeText}>
                  {wasteTypeIcons[type]} {type}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Stops</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>
              {stats.mainStops || 0}
            </Text>
            <Text style={styles.statLabel}>Main</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>
              {stats.customerStops || 0}
            </Text>
            <Text style={styles.statLabel}>Customer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>
              {stats.collected || 0}
            </Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.pending || 0}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'main', 'customer', 'pending', 'collected'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stops List */}
        <View style={styles.stopsList}>
          <Text style={styles.stopsTitle}>
            📍 Stops ({filteredStops.length})
          </Text>

          {filteredStops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stops match this filter</Text>
            </View>
          ) : (
            filteredStops.map((stop, index) => (
              <View
                key={stop.id}
                style={[
                  styles.stopCard,
                  stop.status === 'collected' && styles.stopCardCollected,
                  stop.status === 'skipped' && styles.stopCardSkipped,
                ]}
              >
                <View style={styles.stopHeader}>
                  <View style={styles.stopHeaderLeft}>
                    <Text style={styles.stopNumber}>#{index + 1}</Text>
                    <View
                      style={[
                        styles.stopTypeBadge,
                        stop.type === 'main'
                          ? { backgroundColor: '#16A34A' }
                          : { backgroundColor: '#2563EB' },
                      ]}
                    >
                      <Text style={styles.stopTypeBadgeText}>
                        {stop.type === 'main' ? '📍 Main' : '👤 Customer'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      stop.status === 'collected' && { backgroundColor: '#16A34A' },
                      stop.status === 'pending' && { backgroundColor: '#F59E0B' },
                      stop.status === 'skipped' && { backgroundColor: '#DC2626' },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {stop.status === 'collected' ? '✅' : stop.status === 'skipped' ? '⏭️' : '⏳'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.stopAddress}>{stop.address}</Text>

                {stop.notes && (
                  <Text style={styles.stopNotes}>📝 {stop.notes}</Text>
                )}

                {stop.collectedAt && (
                  <Text style={styles.collectedTime}>
                    Collected: {stop.collectedAt.toLocaleTimeString()}
                  </Text>
                )}

                {stop.status === 'pending' && (
                  <View style={styles.stopActions}>
                    <TouchableOpacity
                      style={styles.collectButton}
                      onPress={() => handleMarkCollected(stop.id)}
                    >
                      <Text style={styles.collectButtonText}>✅ Mark Collected</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={() => handleMarkSkipped(stop.id)}
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.h2,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.card,
  },
  backButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  scheduleInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  scheduleDate: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  zoneAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  zoneBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
    marginRight: Spacing.sm,
  },
  zoneBadgeText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  areaText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  timeSection: {
    marginBottom: Spacing.md,
  },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wasteTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  wasteTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  wasteTypeText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.bg.card,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.small,
  },
  statValue: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  filterBar: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    backgroundColor: '#F3F4F6',
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  stopsList: {
    padding: Spacing.lg,
  },
  stopsTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  stopCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: Colors.line,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stopCardCollected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  stopCardSkipped: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumber: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  stopTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  stopTypeBadgeText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 18,
  },
  stopAddress: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  stopNotes: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  collectedTime: {
    fontSize: FontSizes.small,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  stopActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  collectButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  collectButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
