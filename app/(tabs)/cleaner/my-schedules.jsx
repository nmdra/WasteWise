import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../../../components/app-header';
import { db } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { deleteSchedule, wasteTypeIcons } from '../../../services/scheduleService';
import { getStopStats } from '../../../services/stopsService';

export default function MySchedules() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Safe navigation helper to avoid "navigate before mount" errors
  const safeGoBack = () => {
    try {
      // Defer navigation slightly so the root navigator has time to mount
      setTimeout(() => {
        try {
          router.back();
        } catch (err) {
          // If back fails (no history), fallback to home
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

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopStats, setStopStats] = useState({});

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      safeGoBack();
      return;
    }

    // Subscribe to schedules created by this collector
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('collectorId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      schedulesQuery,
      async (snapshot) => {
        const schedulesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        setSchedules(schedulesData);
        
        // Load stop stats for each schedule
        const stats = {};
        for (const schedule of schedulesData) {
          const stopData = await getStopStats(schedule.id);
          stats[schedule.id] = stopData;
        }
        setStopStats(stats);
        
        setLoading(false);
      },
      (error) => {
        console.error('Error loading schedules:', error);
        Alert.alert('Error', 'Failed to load schedules');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleViewSchedule = (scheduleId) => {
    router.push(`/(tabs)/cleaner/schedule-details?id=${scheduleId}`);
  };

  const handleDeleteSchedule = (scheduleId) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? All stops will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSchedule(scheduleId);
            if (result.success) {
              Alert.alert('Success', 'Schedule deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#16A34A';
      case 'completed':
        return '#9CA3AF';
      case 'cancelled':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.header}>
        <Text style={styles.title}>📅 My Schedules</Text>
        <Text style={styles.subtitle}>
          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} created
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Schedules Yet</Text>
            <Text style={styles.emptyText}>
              Create your first collection schedule to get started
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/cleaner/manage-schedule')}
            >
              <Text style={styles.createButtonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {schedules.map((schedule) => {
              const stats = stopStats[schedule.id] || {};
              
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={styles.scheduleCard}
                  onPress={() => handleViewSchedule(schedule.id)}
                >
                  <View style={styles.scheduleHeader}>
                    <View style={styles.scheduleHeaderLeft}>
                      <Text style={styles.scheduleDate}>
                        {formatDate(schedule.date)}
                      </Text>
                      <View style={styles.zoneArea}>
                        <View style={[styles.zoneBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                          <Text style={styles.zoneBadgeText}>Zone {schedule.zone}</Text>
                        </View>
                        <Text style={styles.areaText}>{schedule.area}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.scheduleBody}>
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

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total || 0}</Text>
                        <Text style={styles.statLabel}>Total Stops</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#16A34A' }]}>
                          {stats.mainStops || 0}
                        </Text>
                        <Text style={styles.statLabel}>Main Stops</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#2563EB' }]}>
                          {stats.customerStops || 0}
                        </Text>
                        <Text style={styles.statLabel}>Customer Stops</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#16A34A' }]}>
                          {stats.collected || 0}
                        </Text>
                        <Text style={styles.statLabel}>Collected</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.scheduleFooter}>
                    <Text style={styles.viewDetailsText}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/cleaner/manage-schedule')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.card,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  list: {
    padding: Spacing.lg,
  },
  scheduleCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  scheduleHeaderLeft: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  zoneArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneBadge: {
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
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  scheduleBody: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  statItem: {
    alignItems: 'center',
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
  scheduleFooter: {
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
