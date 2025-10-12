import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
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
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import {
  formatDateRange,
  getStatusColor,
  getStatusIcon,
  subscribeToCustomerBookings,
} from '../../services/bookingService';
import { wasteTypeIcons } from '../../services/scheduleService';

const FILTERS = ['all', 'pending', 'approved', 'completed'];

export default function MyBookings() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const unsubscribe = subscribeToCustomerBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === selectedFilter));
    }
  }, [bookings, selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    // Firestore subscription will automatically refresh
  };

  const handleBookingPress = (bookingId) => {
    router.push(`/customer/booking-details?id=${bookingId}`);
  };

  const handleCreateNew = () => {
    router.push('/customer/create-booking');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Booking Requests</Text>
        <Text style={styles.headerSubtitle}>Track your special pickup requests</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && ` (${bookings.filter((b) => b.status === filter).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'No booking requests yet'
                : `No ${selectedFilter} bookings`}
            </Text>
            <Text style={styles.emptySubtext}>
              Create a new booking request to get started
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
              <Text style={styles.createButtonText}>➕ New Booking Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => handleBookingPress(booking.id)}
              >
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(booking.status) }]}
                  >
                    {getStatusIcon(booking.status)} {booking.status.toUpperCase()}
                  </Text>
                </View>

                {/* Request Date */}
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Requested:</Text>
                  <Text style={styles.dateValue}>
                    {new Date(booking.requestDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Available Dates */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📅 Your Available Dates:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateRange(booking.preferredDateRange)}
                  </Text>
                </View>

                {/* Visiting Date (if approved) */}
                {booking.status === 'approved' && booking.visitingDate && (
                  <View style={styles.visitingDateBox}>
                    <Text style={styles.visitingDateLabel}>✅ Confirmed Visit:</Text>
                    <Text style={styles.visitingDateValue}>
                      {new Date(booking.visitingDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {/* Zone & Address */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📍 Location:</Text>
                  <Text style={styles.infoValue}>
                    Zone {booking.customerZone} • {booking.customerAddress}
                  </Text>
                </View>

                {/* Waste Types */}
                <View style={styles.wasteTypesRow}>
                  <Text style={styles.infoLabel}>🗑️ Waste Types:</Text>
                  <View style={styles.wasteTypesContainer}>
                    {booking.wasteTypes?.map((type) => (
                      <View key={type} style={styles.wasteTypeBadge}>
                        <Text style={styles.wasteTypeBadgeText}>
                          {wasteTypeIcons[type]} {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Collector Info (if approved) */}
                {booking.collectorName && (
                  <View style={styles.collectorBox}>
                    <Text style={styles.collectorText}>
                      👤 Collector: {booking.collectorName}
                    </Text>
                  </View>
                )}

                {/* View Details Link */}
                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTitle: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  filterContainer: {
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  filterScroll: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg.page,
    borderRadius: Radii.chip,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  bookingCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  dateLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  dateValue: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  visitingDateBox: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  visitingDateLabel: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  visitingDateValue: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.primary,
  },
  wasteTypesRow: {
    marginBottom: Spacing.md,
  },
  wasteTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  wasteTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  wasteTypeBadgeText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  collectorBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.sm,
    borderRadius: Radii.small,
    marginBottom: Spacing.md,
  },
  collectorText: {
    fontSize: FontSizes.body,
    color: '#2563EB',
    fontWeight: '600',
  },
  viewDetailsRow: {
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.card,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
  },
});
