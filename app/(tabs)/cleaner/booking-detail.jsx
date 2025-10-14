import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from '../../../config/firebase';
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
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import {
  formatDateRange,
  getBookingById,
  getStatusColor,
  getStatusIcon,
  updateBookingStatus,
} from '../../../services/bookingService';

export default function BookingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const auth = getAuth();
  const user = auth.currentUser;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) {
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }

    try {
      const bookingData = await getBookingById(id);
      if (bookingData) {
        setBooking(bookingData);
      } else {
        Alert.alert('Error', 'Booking not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await updateBookingStatus(id, 'completed');
              Alert.alert('Success', 'Booking marked as completed!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error completing booking:', error);
              Alert.alert('Error', error.message || 'Failed to complete booking');
            }
          },
        },
      ]
    );
  };

  const handleCancelBooking = async () => {
    Alert.prompt(
      'Cancel Booking',
      'Please provide a reason for cancellation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Please provide a cancellation reason');
              return;
            }
            try {
              await updateBookingStatus(id, 'cancelled', { cancellationReason: reason });
              Alert.alert('Success', 'Booking cancelled successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader userName={user?.displayName || 'Collector'} userRole="cleaner" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader userName={user?.displayName || 'Collector'} userRole="cleaner" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const statusIcon = getStatusIcon(booking.status);

  return (
    <View style={styles.container}>
      <AppHeader userName={user?.displayName || 'Collector'} userRole="cleaner" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusColor }]}>
          <Text style={styles.statusHeaderIcon}>{statusIcon}</Text>
          <Text style={styles.statusHeaderText}>{booking.status.toUpperCase()}</Text>
        </View>

        {/* Booking ID */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Booking ID</Text>
          <Text style={styles.sectionValue}>{booking.id}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Name:</Text>
            <Text style={styles.infoValue}>{booking.customerName || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📧 Email:</Text>
            <Text style={styles.infoValue}>{booking.customerEmail || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Address:</Text>
            <Text style={styles.infoValue}>{booking.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🗺️ Zone:</Text>
            <Text style={styles.infoValue}>{booking.zone}</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Preferred Dates:</Text>
            <Text style={styles.infoValue}>
              {formatDateRange(booking.preferredDateRange)}
            </Text>
          </View>
          {booking.visitingDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>✅ Visiting Date:</Text>
              <Text style={[styles.infoValue, styles.highlightedValue]}>
                {new Date(booking.visitingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🗑️ Waste Types:</Text>
            <Text style={styles.infoValue}>
              {booking.wasteTypes?.join(', ') || 'Not specified'}
            </Text>
          </View>
          {booking.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📝 Customer Notes:</Text>
              <Text style={styles.infoValue}>{booking.notes}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Request Date</Text>
              <Text style={styles.timelineValue}>
                {new Date(booking.requestDate).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
          </View>
          {booking.approvedDate && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.state.success }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Approved Date</Text>
                <Text style={styles.timelineValue}>
                  {new Date(booking.approvedDate).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          )}
          {booking.completedDate && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.state.info }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Completed Date</Text>
                <Text style={styles.timelineValue}>
                  {new Date(booking.completedDate).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          )}
          {booking.cancelledDate && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.state.error }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Cancelled Date</Text>
                <Text style={styles.timelineValue}>
                  {new Date(booking.cancelledDate).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Collector Information */}
        {booking.collectorId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Collector Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Name:</Text>
              <Text style={styles.infoValue}>{booking.collectorName || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🆔 ID:</Text>
              <Text style={styles.infoValue}>{booking.collectorId}</Text>
            </View>
            {booking.collectorNotes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📝 Notes:</Text>
                <Text style={styles.infoValue}>{booking.collectorNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Cancellation Info */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <View style={[styles.card, styles.cancelledCard]}>
            <Text style={styles.cardTitle}>Cancellation Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>❌ Reason:</Text>
              <Text style={styles.infoValue}>{booking.cancellationReason}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {booking.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => router.push(`/(tabs)/cleaner/booking-approval?id=${booking.id}`)}
            >
              <Text style={styles.actionButtonText}>✅ Review & Approve</Text>
            </TouchableOpacity>
          )}
          {booking.status === 'approved' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleMarkCompleted}
            >
              <Text style={styles.actionButtonText}>✔️ Mark as Completed</Text>
            </TouchableOpacity>
          )}
          {(booking.status === 'pending' || booking.status === 'approved') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelBooking}
            >
              <Text style={styles.actionButtonText}>❌ Cancel Booking</Text>
            </TouchableOpacity>
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
  errorText: {
    fontSize: FontSizes.h3,
    color: Colors.state.error,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statusHeaderIcon: {
    fontSize: 32,
  },
  statusHeaderText: {
    fontSize: FontSizes.h2,
    color: '#fff',
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  sectionValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cancelledCard: {
    backgroundColor: '#fff5f5',
    borderColor: Colors.state.error,
  },
  cardTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
    width: 150,
  },
  infoValue: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  highlightedValue: {
    fontWeight: '700',
    color: Colors.state.success,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  timelineValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  actionSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: Colors.state.success,
  },
  completeButton: {
    backgroundColor: Colors.state.info,
  },
  cancelButton: {
    backgroundColor: Colors.state.error,
  },
  actionButtonText: {
    fontSize: FontSizes.body,
    color: '#fff',
    fontWeight: '700',
  },
});
