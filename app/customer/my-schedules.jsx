import { useRouter } from 'expo-router';
import { getAuth } from '../../config/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { db } from '../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { getUserProfile } from '../../services/auth';
import { formatScheduleDate, formatTimeRange, wasteTypeIcons } from '../../services/scheduleService';

export default function MySchedules() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', zone: 'A' });
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (!userInfo.zone) return;

    const today = new Date().toISOString().slice(0, 10);
    
    let schedulesQuery;
    if (filter === 'upcoming') {
      schedulesQuery = query(
        collection(db, 'schedules'),
        where('zone', '==', userInfo.zone),
        where('date', '>=', today),
        where('status', '==', 'active'),
        orderBy('date', 'asc')
      );
    } else if (filter === 'past') {
      schedulesQuery = query(
        collection(db, 'schedules'),
        where('zone', '==', userInfo.zone),
        where('date', '<', today),
        orderBy('date', 'desc')
      );
    } else {
      schedulesQuery = query(
        collection(db, 'schedules'),
        where('zone', '==', userInfo.zone),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      schedulesQuery,
      (snapshot) => {
        const schedulesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        setSchedules(schedulesData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading schedules:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [userInfo.zone, filter]);

  const loadUserInfo = async () => {
    try {
      if (!user) return;
      
      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setUserInfo({
          name: result.user.displayName || result.user.firstName || 'Customer',
          zone: result.user.zone || 'A',
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserInfo();
  };

  const handleViewDetails = (scheduleId) => {
    router.push(`/customer/schedule-details?id=${scheduleId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader userName={userInfo.name} userRole="customer" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader userName={userInfo.name} userRole="customer" />

      <View style={styles.header}>
        <Text style={styles.title}>📅 Collection Schedules</Text>
        <Text style={styles.subtitle}>
          Zone {userInfo.zone} • {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterTabText, filter === 'upcoming' && styles.filterTabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterTabText, filter === 'past' && styles.filterTabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Schedules Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'upcoming' 
                ? 'No upcoming collection schedules in your zone.'
                : filter === 'past'
                ? 'No past collection schedules found.'
                : 'No collection schedules available for your zone.'}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/customer/schedule')}
            >
              <Text style={styles.browseButtonText}>Browse All Zones</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {schedules.map((schedule) => {
              const isPast = new Date(schedule.date) < new Date();
              
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={[styles.scheduleCard, isPast && styles.scheduleCardPast]}
                  onPress={() => handleViewDetails(schedule.id)}
                >
                  <View style={styles.scheduleHeader}>
                    <View style={styles.scheduleHeaderLeft}>
                      <Text style={styles.scheduleDate}>
                        {formatScheduleDate(schedule.date)}
                      </Text>
                      <View style={styles.zoneArea}>
                        <View style={[
                          styles.zoneBadge, 
                          { backgroundColor: isPast ? '#9CA3AF' : Colors.primary }
                        ]}>
                          <Text style={styles.zoneBadgeText}>Zone {schedule.zone}</Text>
                        </View>
                        <Text style={styles.areaText}>{schedule.area}</Text>
                      </View>
                    </View>
                    
                    {isPast && (
                      <View style={styles.pastBadge}>
                        <Text style={styles.pastBadgeText}>Completed</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.scheduleBody}>
                    <View style={styles.timeSection}>
                      {schedule.timeRanges?.map((range, idx) => (
                        <View key={idx} style={styles.timeBadge}>
                          <Text style={styles.timeText}>
                            ⏰ {formatTimeRange(range)}
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
                        <Text style={styles.statValue}>{schedule.availableSlots || 0}</Text>
                        <Text style={styles.statLabel}>Available</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{schedule.totalSlots || 0}</Text>
                        <Text style={styles.statLabel}>Total Slots</Text>
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
        onPress={() => router.push('/customer/schedule')}
      >
        <Text style={styles.fabText}>🗓️</Text>
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
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radii.small,
    backgroundColor: Colors.bg.light,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: '#fff',
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
  browseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.card,
  },
  browseButtonText: {
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
  scheduleCardPast: {
    opacity: 0.7,
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
  pastBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  pastBadgeText: {
    color: '#6B7280',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  scheduleBody: {
    padding: Spacing.lg,
  },
  timeSection: {
    marginBottom: Spacing.md,
  },
  timeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontSize: FontSizes.small,
    color: '#92400E',
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
    justifyContent: 'space-around',
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
    fontSize: 28,
  },
});
