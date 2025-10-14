import { getAuth } from '../../../config/firebase';
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
import AppHeader from '../../../components/app-header';
import { getUserProfile } from '../../../services/auth';
import {
  formatDateRange,
  subscribeToPendingBookingsByZone,
} from '../../../services/bookingService';
import { wasteTypeIcons } from '../../../services/scheduleService';

const Colors = {
  primary: '#16A34A',
  bg: { page: '#f8f9fa', card: '#fff' },
  text: { primary: '#333', secondary: '#666' },
  line: '#e0e0e0',
};

const FontSizes = {
  h1: 24,
  h2: 20,
  h3: 18,
  body: 16,
  small: 14,
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const Radii = {
  small: 8,
  card: 12,
  chip: 20,
};

export default function PendingBookings() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userZone, setUserZone] = useState('A');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadUserZone();
  }, []);

  useEffect(() => {
    if (!userZone) return;

    const unsubscribe = subscribeToPendingBookingsByZone(userZone, (data) => {
      setBookings(data);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [userZone]);

  const loadUserZone = async () => {
    try {
      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setUserZone(result.user.zone || 'A');
      }
    } catch (error) {
      console.error('Error loading user zone:', error);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserZone();
  };

  const handleBookingPress = (bookingId) => {
    router.push(`/cleaner/booking-approval?id=${bookingId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading booking requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Booking Requests</Text>
        <Text style={styles.headerSubtitle}>
          Zone {userZone} • {bookings.length} {bookings.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubtext}>
              No pending booking requests in your zone at the moment
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => handleBookingPress(booking.id)}
              >
                {/* Urgent Badge */}
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>⏳ AWAITING APPROVAL</Text>
                </View>

                {/* Customer Info */}
                <View style={styles.customerSection}>
                  <Text style={styles.customerName}>👤 {booking.customerName}</Text>
                  <Text style={styles.customerZone}>Zone {booking.customerZone}</Text>
                </View>

                {/* Request Date */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📅 Requested:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(booking.requestDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Available Dates */}
                <View style={styles.dateRangeBox}>
                  <Text style={styles.dateRangeLabel}>Customer's Available Dates:</Text>
                  <Text style={styles.dateRangeValue}>
                    {formatDateRange(booking.preferredDateRange)}
                  </Text>
                </View>

                {/* Address */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📍 Address:</Text>
                  <Text style={styles.infoValue}>{booking.customerAddress}</Text>
                </View>

                {/* Waste Types */}
                <View style={styles.wasteSection}>
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

                {/* Notes */}
                {booking.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>📝 Customer Notes:</Text>
                    <Text style={styles.notesText}>{booking.notes}</Text>
                  </View>
                )}

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleBookingPress(booking.id)}
                >
                  <Text style={styles.approveButtonText}>Review & Approve →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  listContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  bookingCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: Spacing.lg,
  },
  urgentBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  urgentText: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    color: '#F59E0B',
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  customerName: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  customerZone: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
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
  dateRangeBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  dateRangeLabel: {
    fontSize: FontSizes.small,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateRangeValue: {
    fontSize: FontSizes.h3,
    color: '#1E40AF',
    fontWeight: '700',
  },
  wasteSection: {
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
  notesBox: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.md,
  },
  notesLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  emptyContainer: {
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
  },
});
