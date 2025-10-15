import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import AppHeader from '../../../components/app-header';
import { db, getAuth } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { getPendingBookingsByZone } from '../../../services/bookingService';
import { collectionService } from '../../../services/collectionService';
import { getStopStats } from '../../../services/stopsService';
import { getUserProfile } from '../../../services/userService';

export default function CleanerHome() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', role: 'cleaner' });
  const [pendingBookings, setPendingBookings] = useState([]);
  const [userZone, setUserZone] = useState(null);
  const [collectionStats, setCollectionStats] = useState(null);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    await Promise.all([
      loadSchedules(),
      loadUserInfo(),
      loadUserZoneAndBookings(),
      loadCollectionStats(),
      loadTodayStats(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const loadTodayStats = async () => {
    try {
      if (!user) return;
      
      const today = new Date().toISOString().slice(0, 10);
      
      // Get today's collections count
      const collectionsQuery = query(
        collection(db, 'collections'),
        where('userId', '==', user.uid),
        where('status', '==', 'collected'),
        where('collectedAt', '>=', new Date(today))
      );
      
      const snapshot = await getDocs(collectionsQuery);
      
      // Get today's schedule stops count
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('collectorId', '==', user.uid),
        where('date', '==', today),
        where('status', '==', 'active')
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      let totalStops = 0;
      
      for (const scheduleDoc of schedulesSnapshot.docs) {
        const stopStats = await getStopStats(scheduleDoc.id);
        totalStops += stopStats.total;
      }
      
      setTodayStats({
        completed: snapshot.size,
        total: totalStops,
      });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const loadCollectionStats = async () => {
    try {
      if (!user) return;
      
      console.log('📊 Loading collection stats for cleaner:', user.uid);
      const stats = await collectionService.getCollectionStats(user.uid);
      setCollectionStats(stats);
      console.log('✅ Collection stats loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading collection stats:', error);
    }
  };

  const loadUserInfo = async () => {
    setUserInfo({
      name: user?.displayName || 'Collector',
      role: 'cleaner',
    });
  };

  const loadUserZoneAndBookings = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.zone) {
        setUserZone(profile.zone);
        // Load pending bookings for this zone
        const bookings = await getPendingBookingsByZone(profile.zone);
        setPendingBookings(bookings);
      }
    } catch (error) {
      console.error('Error loading user zone and bookings:', error);
    }
  };

  const loadSchedules = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().slice(0, 10);
      
      // Get all upcoming schedules (today and future)
      const upcomingQuery = query(
        collection(db, 'schedules'),
        where('collectorId', '==', user.uid),
        where('date', '>=', todayString),
        where('status', '==', 'active'),
        orderBy('date', 'asc'),
        limit(5)
      );

      const snapshot = await getDocs(upcomingQuery);
      
      const schedules = [];
      let todayScheduleFound = null;
      
      for (const doc of snapshot.docs) {
        const scheduleData = {
          id: doc.id,
          ...doc.data(),
        };
        
        // Convert Firestore Timestamp to Date if needed
        if (scheduleData.date && scheduleData.date.toDate) {
          scheduleData.date = scheduleData.date.toDate().toISOString().slice(0, 10);
        }
        
        // Load stats for this schedule
        const stopStats = await getStopStats(doc.id);
        scheduleData.stats = stopStats;
        
        schedules.push(scheduleData);
        
        // Check if this is today's schedule
        if (scheduleData.date === todayString) {
          todayScheduleFound = scheduleData;
          setStats(stopStats);
        }
      }
      
      setUpcomingSchedules(schedules);
      setTodaySchedule(todayScheduleFound);
      
      console.log('✅ Loaded', schedules.length, 'upcoming schedules');
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader userName={userInfo.name} userRole={userInfo.role} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.teal} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const todayProgressPct = todayStats.total > 0 
    ? Math.round((todayStats.completed / todayStats.total) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <AppHeader userName={userInfo.name} userRole={userInfo.role} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.brand.teal]}
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Today's Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <TouchableOpacity 
            style={[styles.quickStatCard, { backgroundColor: '#E8F5E9' }]}
            onPress={() => todaySchedule && router.push(`/(tabs)/cleaner/schedule-details?id=${todaySchedule.id}`)}
          >
            <Text style={styles.quickStatIcon}>✅</Text>
            <Text style={[styles.quickStatValue, { color: '#2E7D32' }]}>
              {todayStats.completed}
            </Text>
            <Text style={styles.quickStatLabel}>Collected Today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickStatCard, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/(tabs)/cleaner/booking-management')}
          >
            <Text style={styles.quickStatIcon}>📦</Text>
            <Text style={[styles.quickStatValue, { color: '#E65100' }]}>
              {pendingBookings.length}
            </Text>
            <Text style={styles.quickStatLabel}>Pending Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickStatCard, { backgroundColor: '#E3F2FD' }]}
            onPress={() => router.push('/(tabs)/cleaner/my-schedules')}
          >
            <Text style={styles.quickStatIcon}>📅</Text>
            <Text style={[styles.quickStatValue, { color: '#1565C0' }]}>
              {upcomingSchedules.length}
            </Text>
            <Text style={styles.quickStatLabel}>Upcoming Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickStatCard, { backgroundColor: '#F3E5F5' }]}
            onPress={() => router.push('/(tabs)/cleaner/collection-history')}
          >
            <Text style={styles.quickStatIcon}>📊</Text>
            <Text style={[styles.quickStatValue, { color: '#6A1B9A' }]}>
              {collectionStats?.total || 0}
            </Text>
            <Text style={styles.quickStatLabel}>Total Collections</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule Section */}
        {todaySchedule ? (
          <View style={styles.todayScheduleCard}>
            <View style={styles.todayScheduleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayScheduleTitle}>Today's Route 🚛</Text>
                <Text style={styles.todayScheduleSubtitle}>
                  Zone {todaySchedule.zone} • {todaySchedule.area}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewDetailsBtn}
                onPress={() => router.push(`/(tabs)/cleaner/schedule-details?id=${todaySchedule.id}`)}
              >
                <Text style={styles.viewDetailsBtnText}>View →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.todayProgressSection}>
              <View style={styles.todayProgressBar}>
                <View style={[styles.todayProgressFill, { width: `${todayProgressPct}%` }]} />
              </View>
              <View style={styles.todayProgressStats}>
                <View style={styles.todayProgressStat}>
                  <Text style={styles.todayProgressStatValue}>{todayStats.completed}</Text>
                  <Text style={styles.todayProgressStatLabel}>Completed</Text>
                </View>
                <View style={styles.todayProgressStat}>
                  <Text style={[styles.todayProgressStatValue, { color: Colors.state.warning }]}>
                    {todayStats.total - todayStats.completed}
                  </Text>
                  <Text style={styles.todayProgressStatLabel}>Remaining</Text>
                </View>
                <View style={styles.todayProgressStat}>
                  <Text style={[styles.todayProgressStatValue, { color: Colors.brand.teal }]}>
                    {todayProgressPct}%
                  </Text>
                  <Text style={styles.todayProgressStatLabel}>Progress</Text>
                </View>
              </View>
            </View>

            <View style={styles.scheduleInfoRow}>
              <View style={styles.scheduleInfoItem}>
                <Text style={styles.scheduleInfoIcon}>⏰</Text>
                <Text style={styles.scheduleInfoText}>
                  {todaySchedule.timeRanges?.map(r => `${r.start}-${r.end}`).join(', ') || 'All day'}
                </Text>
              </View>
              <View style={styles.scheduleInfoItem}>
                <Text style={styles.scheduleInfoIcon}>🗑️</Text>
                <Text style={styles.scheduleInfoText}>
                  {todaySchedule.wasteTypes?.join(', ') || 'All types'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noScheduleCard}>
            <Text style={styles.noScheduleIcon}>📅</Text>
            <Text style={styles.noScheduleTitle}>No Route Scheduled for Today</Text>
            <Text style={styles.noScheduleText}>
              Create a new collection schedule or check your upcoming routes
            </Text>
            <View style={styles.noScheduleActions}>
              <TouchableOpacity
                style={styles.createScheduleBtn}
                onPress={() => router.push('/(tabs)/cleaner/manage-schedule')}
              >
                <Text style={styles.createScheduleBtnText}>+ Create Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewSchedulesBtn}
                onPress={() => router.push('/(tabs)/cleaner/my-schedules')}
              >
                <Text style={styles.viewSchedulesBtnText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upcoming Schedules */}
        {upcomingSchedules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Routes</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cleaner/my-schedules')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {upcomingSchedules.slice(0, 3).map((schedule) => {
              const scheduleDate = new Date(schedule.date);
              const isToday = scheduleDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
              const daysDiff = Math.ceil((scheduleDate - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={styles.upcomingScheduleCard}
                  onPress={() => router.push(`/(tabs)/cleaner/schedule-details?id=${schedule.id}`)}
                >
                  <View style={styles.upcomingScheduleLeft}>
                    <View style={[styles.upcomingScheduleDateBadge, isToday && { backgroundColor: Colors.brand.green }]}>
                      <Text style={styles.upcomingScheduleDay}>
                        {scheduleDate.toLocaleDateString('en-US', { day: 'numeric' })}
                      </Text>
                      <Text style={styles.upcomingScheduleMonth}>
                        {scheduleDate.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingScheduleTitle}>
                        {schedule.area || `Zone ${schedule.zone}`}
                      </Text>
                      <Text style={styles.upcomingScheduleDetails}>
                        Zone {schedule.zone} • {schedule.stats?.total || 0} stops
                      </Text>
                      <Text style={styles.upcomingScheduleTime}>
                        {isToday ? '🔴 Today' : `📅 In ${daysDiff} days`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.upcomingScheduleArrow}>→</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pending Bookings Section */}
        {userZone && pendingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Pickups</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cleaner/booking-management')}>
                <Text style={styles.seeAllText}>Manage →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bookingsCard}>
              <View style={styles.bookingsHeader}>
                <Text style={styles.bookingsZone}>📍 Zone {userZone}</Text>
                <View style={styles.pendingCountBadge}>
                  <Text style={styles.pendingCountText}>{pendingBookings.length} Pending</Text>
                </View>
              </View>

              {pendingBookings.slice(0, 2).map((booking, index) => {
                const urgentDays = 2;
                const reqDate = new Date(booking.requestDate);
                const diffDays = Math.ceil((new Date() - reqDate) / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays <= urgentDays;

                return (
                  <View key={index} style={styles.bookingItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingCustomer}>{booking.customerName || 'Customer'}</Text>
                      <Text style={styles.bookingDate}>
                        Requested {diffDays} days ago
                      </Text>
                    </View>
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>Urgent</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.manageBookingsBtn}
                onPress={() => router.push('/(tabs)/cleaner/booking-management')}
              >
                <Text style={styles.manageBookingsBtnText}>Manage All Bookings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Collection Stats */}
        {collectionStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Performance</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cleaner/collection-history')}>
                <Text style={styles.seeAllText}>History →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.performanceCard}>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{collectionStats.total}</Text>
                  <Text style={styles.performanceLabel}>Total Collections</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{collectionStats.totalWeight.toFixed(1)} kg</Text>
                  <Text style={styles.performanceLabel}>Waste Collected</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {Object.keys(collectionStats.byWasteType).length}
                  </Text>
                  <Text style={styles.performanceLabel}>Waste Types</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/cleaner/manage-schedule')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Create Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/cleaner/my-schedules')}
            >
              <Text style={styles.actionIcon}>�</Text>
              <Text style={styles.actionLabel}>All Schedules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/cleaner/booking-management')}
            >
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionLabel}>Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/cleaner/collection-history')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  scroll: {
    flex: 1,
  },
  
  // Welcome Section
  welcomeSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  quickStatCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  quickStatValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Today's Schedule Card
  todayScheduleCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: Colors.brand.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  todayScheduleTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  todayScheduleSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  viewDetailsBtn: {
    backgroundColor: Colors.brand.lightTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.btn,
  },
  viewDetailsBtnText: {
    color: Colors.brand.teal,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },

  // Today Progress
  todayProgressSection: {
    marginVertical: Spacing.md,
  },
  todayProgressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  todayProgressFill: {
    height: '100%',
    backgroundColor: Colors.brand.green,
    borderRadius: 6,
  },
  todayProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayProgressStat: {
    alignItems: 'center',
  },
  todayProgressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brand.green,
  },
  todayProgressStatLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 4,
  },

  scheduleInfoRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  scheduleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleInfoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  scheduleInfoText: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    flex: 1,
  },

  // No Schedule Card
  noScheduleCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
    borderStyle: 'dashed',
  },
  noScheduleIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  noScheduleTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  noScheduleText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  noScheduleActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  createScheduleBtn: {
    backgroundColor: Colors.brand.teal,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
  },
  createScheduleBtnText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  viewSchedulesBtn: {
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  viewSchedulesBtnText: {
    color: Colors.text.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },

  // Section
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: FontSizes.body,
    color: Colors.brand.teal,
    fontWeight: '600',
  },

  // Upcoming Schedule Card
  upcomingScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.card,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  upcomingScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upcomingScheduleDateBadge: {
    width: 56,
    height: 56,
    backgroundColor: Colors.brand.teal,
    borderRadius: Radii.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  upcomingScheduleDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  upcomingScheduleMonth: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '600',
  },
  upcomingScheduleTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  upcomingScheduleDetails: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  upcomingScheduleTime: {
    fontSize: FontSizes.small,
    color: Colors.brand.teal,
    marginTop: 4,
    fontWeight: '600',
  },
  upcomingScheduleArrow: {
    fontSize: 24,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },

  // Bookings Card
  bookingsCard: {
    backgroundColor: '#FFF3E0',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bookingsZone: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  pendingCountBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  pendingCountText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: Spacing.md,
    borderRadius: Radii.btn,
    marginBottom: Spacing.sm,
  },
  bookingCustomer: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bookingDate: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: '#FF5252',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  urgentBadgeText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  manageBookingsBtn: {
    backgroundColor: '#FF9800',
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  manageBookingsBtnText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },

  // Performance Card
  performanceCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brand.teal,
  },
  performanceLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
});

