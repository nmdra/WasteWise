import { useRouter } from 'expo-router';
import { getAuth } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/app-header';
import ListItem from '../../components/customer/ListItem';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { getUserProfile } from '../../services/auth';
import { MockCustomer } from '../../services/mockCustomerApi';
import { formatScheduleDate, formatTimeRange, getNextSchedule, wasteTypeIcons } from '../../services/scheduleService';

export default function CustomerHome() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', role: 'customer', zone: 'A' });
  const [nextSchedule, setNextSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const loadData = async () => {
    try {
      const homeData = await MockCustomer.getHome();
      setData(homeData);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      if (!user) return;
      
      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setUserInfo({
          name: result.user.displayName || result.user.firstName || 'Customer',
          role: result.user.role || 'customer',
          zone: result.user.zone || 'A',
        });
      } else {
        // Fallback to default
        setUserInfo({
          name: 'Customer',
          role: 'customer',
          zone: 'A',
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setUserInfo({
        name: 'Customer',
        role: 'customer',
        zone: 'A',
      });
    }
  };

  const loadNextSchedule = async () => {
    try {
      setScheduleLoading(true);
      // Wait for user info to load first
      if (!userInfo.zone) {
        await loadUserInfo();
      }
      
      const userZone = userInfo.zone || 'A';
      const schedule = await getNextSchedule(userZone);
      setNextSchedule(schedule);
    } catch (error) {
      console.error('Error loading next schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUserInfo();
    loadNextSchedule();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    loadNextSchedule();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader userName={userInfo.name} userRole={userInfo.role} />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.green]} />
        }
      >
        {/* Alerts */}
        {data?.alerts?.length > 0 && (
          <View style={styles.alertsSection}>
            {data.alerts.map((alert, index) => (
              <View key={index} style={[styles.alert, alert.type === 'reminder' && styles.alertReminder]}>
                <Text style={styles.alertIcon}>{alert.type === 'reminder' ? '🔔' : 'ℹ️'}</Text>
                <Text style={styles.alertText}>{alert.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Collection Schedule - NEW SECTION */}
        {nextSchedule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Next Collection Schedule</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleDate}>
                    {formatScheduleDate(nextSchedule.date)}
                  </Text>
                  <Text style={styles.scheduleArea}>
                    {nextSchedule.area} • Zone {nextSchedule.zone}
                  </Text>
                  <View style={styles.timeRangesContainer}>
                    {nextSchedule.timeRanges?.map((range, idx) => (
                      <View key={idx} style={styles.timeRangeBadge}>
                        <Text style={styles.timeRangeText}>
                          ⏰ {formatTimeRange(range)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.wasteTypesContainer}>
                    {nextSchedule.wasteTypes?.map((type) => (
                      <Text key={type} style={styles.wasteTypeTag}>
                        {wasteTypeIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewScheduleButton}
                onPress={() => router.push('/customer/schedule')}
              >
                <Text style={styles.viewScheduleText}>View All Schedules →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Next Pickup Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Pickup</Text>
          <View style={styles.pickupCard}>
            <View style={styles.pickupHeader}>
              <View>
                <Text style={styles.pickupDate}>{formatDate(data?.nextPickup?.date)}</Text>
                <Text style={styles.pickupTypes}>
                  {data?.nextPickup?.wasteTypes?.join(' • ')}
                </Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>ETA {data?.nextPickup?.etaMinutes} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/map')}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionLabel}>Track Truck</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/schedule')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/bins')}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionLabel}>My Bins</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/my-bills')}
            >
              <Text style={styles.actionIcon}>💵</Text>
              <Text style={styles.actionLabel}>Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/create-booking')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Special Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/customer/my-bookings')}
            >
              <Text style={styles.actionIcon}>📑</Text>
              <Text style={styles.actionLabel}>My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Pickup */}
        {data?.lastPickup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Pickup</Text>
            <View style={styles.lastPickupCard}>
              <View style={styles.row}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{formatDate(data.lastPickup.date)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{data.lastPickup.weightKg} kg</Text>
              </View>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => router.push('/customer/activity')}
              >
                <Text style={styles.linkText}>View Details →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/customer/activity')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {data?.recent?.slice(0, 3).map((item) => (
            <ListItem
              key={item.id}
              leftIcon="✓"
              title={formatDate(item.date)}
              subtitle={`${item.weightKg} kg • ${item.types?.join(', ')}`}
              rightText={item.status}
              badge={item.status === 'completed' ? 'Completed' : item.status}
              badgeColor={Colors.status.completed}
              onPress={() => router.push('/customer/activity')}
            />
          ))}
        </View>

        {/* More Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Services</Text>
          <ListItem
            leftIcon="�"
            title="My Profile"
            subtitle="Manage your account and preferences"
            rightIcon="→"
            onPress={() => router.push('/customer/profile')}
          />
          <ListItem
            leftIcon="�💰"
            title="Payments & Invoices"
            subtitle="View and pay your bills"
            rightIcon="→"
            onPress={() => router.push('/customer/payments')}
          />
          <ListItem
            leftIcon="🎓"
            title="Waste Sorting Guide"
            subtitle="Learn how to sort waste properly"
            rightIcon="→"
            onPress={() => router.push('/customer/education')}
          />
          <ListItem
            leftIcon="💳"
            title="My Wallet"
            subtitle="Rebates and credits"
            rightIcon="→"
            onPress={() => router.push('/customer/wallet')}
          />
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.muted,
    fontSize: FontSizes.body,
  },
  alertsSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.small,
    borderLeftWidth: 4,
    borderLeftColor: Colors.state.info,
    marginBottom: Spacing.sm,
  },
  alertReminder: {
    borderLeftColor: Colors.state.warning,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  alertText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSizes.small,
  },
  section: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  seeAll: {
    color: Colors.brand.green,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  pickupCard: {
    backgroundColor: Colors.brand.green,
    padding: Spacing.lg,
    borderRadius: Radii.card,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pickupDate: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.white,
  },
  pickupTypes: {
    fontSize: FontSizes.small,
    color: Colors.text.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  etaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
  },
  etaText: {
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: FontSizes.small,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
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
  lastPickupCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  value: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  linkButton: {
    marginTop: Spacing.sm,
  },
  linkText: {
    color: Colors.brand.green,
    fontWeight: '600',
    fontSize: FontSizes.small,
  },
  scheduleCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  scheduleHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  scheduleDate: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  scheduleArea: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  timeRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeRangeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
  },
  timeRangeText: {
    fontSize: FontSizes.small,
    color: '#92400E',
    fontWeight: '600',
  },
  wasteTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  wasteTypeTag: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.small,
  },
  viewScheduleButton: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  viewScheduleText: {
    color: Colors.brand.green,
    fontWeight: '700',
    fontSize: FontSizes.body,
  },
});
