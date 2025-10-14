import { useRouter } from 'expo-router';
import { getAuth } from '../../../config/firebase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import {
  approveBooking,
  formatDateRange,
  getBookingsByZone,
  getStatusColor,
  getStatusIcon,
  subscribeToBookingsByZone,
  updateBookingStatus,
} from '../../../services/bookingService';
import { getUserProfile } from '../../../services/userService';

const TAB_FILTERS = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'approved', label: 'Approved', icon: '✅' },
  { key: 'completed', label: 'Completed', icon: '✔️' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
];

export default function BookingManagement() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [userZone, setUserZone] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadUserZone();
  }, [user]);

  useEffect(() => {
    if (userZone) {
      loadBookings();
    }
  }, [userZone]);

  useEffect(() => {
    filterBookings();
    calculateStats();
  }, [bookings, activeTab]);

  const loadUserZone = async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.zone) {
        setUserZone(profile.zone);
      } else {
        Alert.alert('Error', 'Your zone is not set. Please update your profile.');
      }
    } catch (error) {
      console.error('Error loading user zone:', error);
      Alert.alert('Error', 'Failed to load your zone information.');
    }
  };

  const loadBookings = async () => {
    if (!userZone) return;

    try {
      setLoading(true);
      
      // Subscribe to real-time updates for bookings in this zone
      const unsubscribe = subscribeToBookingsByZone(userZone, (updatedBookings) => {
        setBookings(updatedBookings);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter((booking) => booking.status === activeTab);
      setFilteredBookings(filtered);
    }
  };

  const calculateStats = () => {
    const newStats = {
      pending: bookings.filter((b) => b.status === 'pending').length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    };
    setStats(newStats);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleBookingPress = (booking) => {
    if (booking.status === 'pending') {
      // Navigate to approval screen
      router.push(`/(tabs)/cleaner/booking-approval?id=${booking.id}`);
    } else {
      // Navigate to booking details
      router.push(`/(tabs)/cleaner/booking-detail?id=${booking.id}`);
    }
  };

  const handleQuickApprove = async (booking) => {
    Alert.alert(
      'Quick Approve',
      `Approve this booking with the first available date (${booking.preferredDateRange.start})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveBooking(booking.id, {
                visitingDate: booking.preferredDateRange.start,
                collectorId: user.uid,
                collectorName: user.displayName || 'Collector',
                notes: 'Quick approved',
              });
              Alert.alert('Success', 'Booking approved successfully!');
            } catch (error) {
              console.error('Error approving booking:', error);
              Alert.alert('Error', error.message || 'Failed to approve booking.');
            }
          },
        },
      ]
    );
  };

  const handleMarkCompleted = async (bookingId) => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await updateBookingStatus(bookingId, 'completed');
              Alert.alert('Success', 'Booking marked as completed!');
            } catch (error) {
              console.error('Error completing booking:', error);
              Alert.alert('Error', error.message || 'Failed to complete booking.');
            }
          },
        },
      ]
    );
  };

  const renderBookingCard = ({ item: booking }) => {
    const statusColor = getStatusColor(booking.status);
    const statusIcon = getStatusIcon(booking.status);

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleBookingPress(booking)}
        activeOpacity={0.7}
      >
        <View style={styles.bookingHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIcon}>{statusIcon}</Text>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
          {booking.status === 'pending' && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>ACTION NEEDED</Text>
            </View>
          )}
        </View>

        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Customer:</Text>
          <Text style={styles.bookingValue}>{booking.customerName || 'Unknown'}</Text>
        </View>

        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>📍 Address:</Text>
          <Text style={styles.bookingValue}>{booking.address}</Text>
        </View>

        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>📅 Preferred Dates:</Text>
          <Text style={styles.bookingValue}>
            {formatDateRange(booking.preferredDateRange)}
          </Text>
        </View>

        {booking.visitingDate && (
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingLabel}>✅ Visiting Date:</Text>
            <Text style={[styles.bookingValue, styles.visitingDate]}>
              {new Date(booking.visitingDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>🗑️ Waste Types:</Text>
          <Text style={styles.bookingValue}>
            {booking.wasteTypes?.join(', ') || 'Not specified'}
          </Text>
        </View>

        {booking.notes && (
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingLabel}>📝 Notes:</Text>
            <Text style={styles.bookingNotes}>{booking.notes}</Text>
          </View>
        )}

        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>📆 Requested:</Text>
          <Text style={styles.bookingValue}>
            {new Date(booking.requestDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleQuickApprove(booking)}
              >
                <Text style={styles.actionButtonText}>✅ Quick Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => router.push(`/(tabs)/cleaner/booking-approval?id=${booking.id}`)}
              >
                <Text style={styles.actionButtonText}>📋 Review Details</Text>
              </TouchableOpacity>
            </>
          )}
          {booking.status === 'approved' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleMarkCompleted(booking.id)}
            >
              <Text style={styles.actionButtonText}>✔️ Mark Completed</Text>
            </TouchableOpacity>
          )}
          {(booking.status === 'completed' || booking.status === 'cancelled') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => router.push(`/(tabs)/cleaner/booking-detail?id=${booking.id}`)}
            >
              <Text style={styles.actionButtonText}>👁️ View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader userName={user?.displayName || 'Collector'} userRole="cleaner" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader userName={user?.displayName || 'Collector'} userRole="cleaner" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking Management</Text>
        <Text style={styles.subtitle}>Zone {userZone} • {bookings.length} total bookings</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.state.success }]}>
            {stats.approved}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.state.info }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.state.error }]}>
            {stats.cancelled}
          </Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Tab Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {TAB_FILTERS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
            >
              {tab.label}
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{stats[tab.key]}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? 'No pending booking requests at the moment.'
              : `No ${activeTab} bookings found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
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
  header: {
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  backButton: {
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  statCard: {
    flex: 1,
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
    marginTop: Spacing.xs,
  },
  tabScroll: {
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bg.light,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.lg,
  },
  bookingCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
    gap: Spacing.xs,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: Colors.state.error,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
  },
  urgentText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '700',
  },
  bookingInfo: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  bookingLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
    width: 130,
  },
  bookingValue: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  visitingDate: {
    fontWeight: '700',
    color: Colors.state.success,
  },
  bookingNotes: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: Colors.state.success,
  },
  reviewButton: {
    backgroundColor: Colors.primary,
  },
  completeButton: {
    backgroundColor: Colors.state.info,
  },
  viewButton: {
    backgroundColor: Colors.text.secondary,
  },
  actionButtonText: {
    fontSize: FontSizes.body,
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
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
  },
});
