import { useLocalSearchParams, useRouter } from 'expo-router';
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
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import {
  cancelBooking,
  formatDateRange,
  getBookingById,
  getStatusColor,
  getStatusIcon,
  isDateInRange,
} from '../../services/bookingService';
import { wasteTypeIcons } from '../../services/scheduleService';

export default function BookingDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid booking ID');
      router.back();
      return;
    }

    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const result = await getBookingById(id);
      
      if (result.success) {
        setBooking(result.booking);
      } else {
        Alert.alert('Error', result.error || 'Booking not found');
        router.back();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const result = await cancelBooking(id, 'Cancelled by customer');
            setCancelling(false);

            if (result.success) {
              Alert.alert('Success', 'Booking cancelled successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const canCancel = booking.status === 'pending';

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusColor + '15' }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(booking.status)}</Text>
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            {booking.status.toUpperCase()}
          </Text>
          <Text style={styles.statusSubtitle}>
            {booking.status === 'pending' && 'Waiting for collector approval'}
            {booking.status === 'approved' && 'Booking confirmed! Check visiting date below'}
            {booking.status === 'completed' && 'Collection completed successfully'}
            {booking.status === 'cancelled' && 'This booking has been cancelled'}
          </Text>
        </View>

        {/* Request Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Request Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Request Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(booking.requestDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booking ID:</Text>
              <Text style={styles.infoValue}>#{booking.id.slice(0, 8)}</Text>
            </View>
          </View>
        </View>

        {/* Visiting Date (if approved) */}
        {booking.status === 'approved' && booking.visitingDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Confirmed Visiting Date</Text>
            <View style={styles.visitingDateCard}>
              <Text style={styles.visitingDateText}>
                {new Date(booking.visitingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              {booking.approvedDate && (
                <Text style={styles.approvedDateText}>
                  Approved on{' '}
                  {new Date(booking.approvedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Your Available Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Your Available Dates</Text>
          <View style={styles.card}>
            <Text style={styles.dateRangeText}>
              {formatDateRange(booking.preferredDateRange)}
            </Text>
            {booking.visitingDate && (
              <View style={styles.dateValidationBox}>
                {isDateInRange(booking.visitingDate, booking.preferredDateRange) ? (
                  <Text style={styles.dateValidationTextSuccess}>
                    ✅ Selected date is within your availability
                  </Text>
                ) : (
                  <Text style={styles.dateValidationTextWarning}>
                    ⚠️ Selected date is outside your requested range
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Zone:</Text>
              <Text style={styles.infoValue}>Zone {booking.customerZone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{booking.customerAddress}</Text>
            </View>
          </View>
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Waste Types</Text>
          <View style={styles.card}>
            <View style={styles.wasteTypesGrid}>
              {booking.wasteTypes?.map((type) => (
                <View key={type} style={styles.wasteTypeCard}>
                  <Text style={styles.wasteTypeIcon}>{wasteTypeIcons[type]}</Text>
                  <Text style={styles.wasteTypeLabel}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Collector Information */}
        {booking.collectorName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Assigned Collector</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{booking.collectorName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Zone:</Text>
                <Text style={styles.infoValue}>Zone {booking.customerZone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Your Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Approval Notes */}
        {booking.approvalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Collector's Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{booking.approvalNotes}</Text>
            </View>
          </View>
        )}

        {/* Cancellation Info */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Cancellation Reason</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{booking.cancellationReason}</Text>
              {booking.cancelledDate && (
                <Text style={styles.cancelledDateText}>
                  Cancelled on{' '}
                  {new Date(booking.cancelledDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Important Information */}
        {booking.status === 'approved' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Important Reminders</Text>
            <Text style={styles.infoText}>
              • Be ready at your location on the confirmed visiting date{'\n'}
              • Ensure all waste is properly sorted and ready for collection{'\n'}
              • Contact support if you need to reschedule{'\n'}
              • The collector will arrive during their scheduled time range
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {canCancel && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
            onPress={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.cancelButtonText}>❌ Cancel Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: Spacing.lg,
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
  statusHeader: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  visitingDateCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  visitingDateText: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  approvedDateText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
  },
  dateRangeText: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  dateValidationBox: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radii.small,
  },
  dateValidationTextSuccess: {
    fontSize: FontSizes.small,
    color: '#16A34A',
    textAlign: 'center',
  },
  dateValidationTextWarning: {
    fontSize: FontSizes.small,
    color: '#F59E0B',
    textAlign: 'center',
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  wasteTypeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#E8F5E9',
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  wasteTypeIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  wasteTypeLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  notesText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  cancelledDateText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  infoBox: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: '#EFF6FF',
    borderRadius: Radii.card,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  infoTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.body,
    color: '#1E40AF',
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
});
