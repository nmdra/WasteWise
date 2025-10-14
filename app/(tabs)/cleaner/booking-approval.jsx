import { getAuth } from '../../../config/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AppHeader from '../../../components/app-header';
import { getUserProfile } from '../../../services/auth';
import {
  approveBooking,
  formatDateRange,
  getBookingById,
  isDateInRange,
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

export default function BookingApproval() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  const { id } = useLocalSearchParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [collectorName, setCollectorName] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid booking ID');
      router.back();
      return;
    }

    loadBooking();
    loadCollectorName();
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

  const loadCollectorName = async () => {
    try {
      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setCollectorName(result.user.displayName || result.user.firstName || 'Collector');
      }
    } catch (error) {
      console.error('Error loading collector name:', error);
    }
  };

  const getMarkedDates = () => {
    if (!booking || !booking.preferredDateRange) return {};

    const marked = {};
    const { start, end } = booking.preferredDateRange;

    // Mark available range
    const startDate = new Date(start);
    const endDate = new Date(end);
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      marked[dateStr] = {
        marked: true,
        dotColor: Colors.primary,
        customStyles: {
          container: {
            backgroundColor: '#E8F5E9',
          },
          text: {
            color: Colors.primary,
            fontWeight: '700',
          },
        },
      };
      current.setDate(current.getDate() + 1);
    }

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Colors.primary,
      };
    }

    return marked;
  };

  const handleDateSelect = (day) => {
    const selected = day.dateString;

    if (!isDateInRange(selected, booking.preferredDateRange)) {
      Alert.alert(
        'Date Outside Range',
        'This date is outside the customer\'s available range. Are you sure you want to select it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Anyway', onPress: () => setSelectedDate(selected) },
        ]
      );
    } else {
      setSelectedDate(selected);
    }
  };

  const handleApprove = async () => {
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Please select a visiting date');
      return;
    }

    Alert.alert(
      'Approve Booking',
      `Confirm visiting date: ${new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setApproving(true);

            try {
              const approvalData = {
                visitingDate: selectedDate,
                collectorId: user.uid,
                collectorName: collectorName,
                notes: notes.trim(),
              };

              const result = await approveBooking(id, approvalData);

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Booking approved! The customer will be notified.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to approve booking');
              }
            } catch (error) {
              console.error('Error approving booking:', error);
              Alert.alert('Error', 'Failed to approve booking');
            } finally {
              setApproving(false);
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
          <Text style={styles.loadingText}>Loading booking...</Text>
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

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Approve Booking Request</Text>
          <Text style={styles.headerSubtitle}>Select a visiting date from customer's availability</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{booking.customerName}</Text>
            </View>
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

        {/* Available Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Customer's Available Dates</Text>
          <View style={styles.dateRangeCard}>
            <Text style={styles.dateRangeText}>
              {formatDateRange(booking.preferredDateRange)}
            </Text>
            <Text style={styles.dateRangeSubtext}>
              Select any date from this range on the calendar below
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📆 Select Visiting Date</Text>
          {selectedDate && (
            <View style={styles.selectedDateBox}>
              <Text style={styles.selectedDateLabel}>Selected Date:</Text>
              <Text style={styles.selectedDateValue}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              {!isDateInRange(selectedDate, booking.preferredDateRange) && (
                <Text style={styles.warningText}>
                  ⚠️ This date is outside customer's requested range
                </Text>
              )}
            </View>
          )}

          <View style={styles.calendarCard}>
            <Calendar
              minDate={today}
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              markingType="custom"
              theme={{
                arrowColor: Colors.primary,
                todayTextColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: '#fff',
              }}
            />
          </View>

          <View style={styles.legendBox}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8F5E9' }]} />
              <Text style={styles.legendText}>Customer's available dates</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Your selected date</Text>
            </View>
          </View>
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Waste Types to Collect</Text>
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

        {/* Customer Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Customer's Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Collector Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Your Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes or instructions for the customer..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Approve Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.approveButton, (!selectedDate || approving) && styles.approveButtonDisabled]}
          onPress={handleApprove}
          disabled={!selectedDate || approving}
        >
          {approving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.approveButtonText}>
              ✅ Approve Booking
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  dateRangeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  dateRangeText: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: Spacing.xs,
  },
  dateRangeSubtext: {
    fontSize: FontSizes.small,
    color: '#1E40AF',
  },
  selectedDateBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectedDateLabel: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    marginBottom: 4,
  },
  selectedDateValue: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.primary,
  },
  warningText: {
    fontSize: FontSizes.small,
    color: '#F59E0B',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  legendBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.small,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  legendText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
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
  notesInput: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  approveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
});
