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
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AppHeader from '../../components/app-header';
import { getAuth } from '../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { calculateSpecialBookingFee, formatCurrency, getWasteTypeInfo } from '../../constants/paymentConfig';
import { getUserProfile } from '../../services/auth';
import { createBooking } from '../../services/bookingService';

const WASTE_TYPES = [
  'hazardous',
  'electronic', 
  'bulky',
  'organic',
  'plastic',
  'paper',
  'glass',
  'metal',
  'general',
];

export default function CreateBooking() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  const { scheduleId } = useLocalSearchParams();

  const today = new Date().toISOString().slice(0, 10);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedWasteTypes, setSelectedWasteTypes] = useState([]);
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        router.back();
        return;
      }

      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        setUserProfile(result.user);
        setAddress(result.user.address || '');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load your profile');
      setLoading(false);
    }
  };

  const toggleWasteType = (type) => {
    if (selectedWasteTypes.includes(type)) {
      setSelectedWasteTypes(selectedWasteTypes.filter((t) => t !== type));
    } else {
      setSelectedWasteTypes([...selectedWasteTypes, type]);
    }
  };

  const handleDateSelect = (day) => {
    const selectedDate = day.dateString;

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // Start new range
      setDateRange({ start: selectedDate, end: '' });
    } else if (selectedDate < dateRange.start) {
      // Selected date is before start, make it the new start
      setDateRange({ start: selectedDate, end: '' });
    } else {
      // Complete the range
      setDateRange({ ...dateRange, end: selectedDate });
    }
  };

  const getMarkedDates = () => {
    const marked = {};

    if (dateRange.start) {
      marked[dateRange.start] = {
        startingDay: true,
        color: Colors.primary,
        textColor: '#fff',
      };
    }

    if (dateRange.end) {
      marked[dateRange.end] = {
        endingDay: true,
        color: Colors.primary,
        textColor: '#fff',
      };

      // Mark dates in between
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const current = new Date(start);

      while (current < end) {
        current.setDate(current.getDate() + 1);
        const dateStr = current.toISOString().slice(0, 10);
        if (dateStr !== dateRange.end) {
          marked[dateStr] = {
            color: Colors.primary + '40',
            textColor: Colors.text.primary,
          };
        }
      }
    }

    return marked;
  };

  const validateForm = () => {
    if (!dateRange.start || !dateRange.end) {
      Alert.alert('Validation Error', 'Please select your available date range');
      return false;
    }

    if (selectedWasteTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one waste type');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter your pickup address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Calculate fees for selected waste types
    const calculation = calculateSpecialBookingFee(selectedWasteTypes);

    const bookingData = {
      customerId: user.uid,
      customerName: userProfile.displayName || userProfile.firstName || 'Customer',
      customerEmail: user.email || userProfile.email || 'N/A',
      customerZone: userProfile.zone || 'A',
      customerAddress: address,
      address: address,
      zone: userProfile.zone || 'A',
      preferredDateRange: dateRange,
      wasteTypes: selectedWasteTypes,
      notes: notes.trim(),
      scheduleId: scheduleId || null,
    };

    if (calculation.total > 0) {
      // Navigate to payment screen for paid bookings
      router.push({
        pathname: '/customer/process-payment',
        params: {
          paymentType: 'special_booking',
          bookingData: JSON.stringify(bookingData),
        },
      });
    } else {
      // Create booking directly for free waste types
      setSaving(true);
      
      try {
        const result = await createBooking(bookingData);

        if (result.success) {
          Alert.alert(
            'Success',
            'Your free booking request has been submitted. A collector will review and approve it soon.',
            [
              {
                text: 'View My Bookings',
                onPress: () => router.push('/customer/my-bookings'),
              },
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to create booking');
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        Alert.alert('Error', 'Failed to create booking request');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Request Special Pickup</Text>
          <Text style={styles.headerSubtitle}>
            Select your available dates and waste types for collection
          </Text>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Your Available Dates</Text>
          <Text style={styles.sectionSubtitle}>
            {dateRange.start && !dateRange.end && 'Tap another date to complete your range'}
            {dateRange.start && dateRange.end && `Selected: ${dateRange.start} to ${dateRange.end}`}
            {!dateRange.start && 'Tap a date to start selecting your date range'}
          </Text>

          <View style={styles.calendarCard}>
            <Calendar
              minDate={today}
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              markingType="period"
              theme={{
                arrowColor: Colors.primary,
                todayTextColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: '#fff',
              }}
            />
          </View>

          {dateRange.start && dateRange.end && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setDateRange({ start: '', end: '' })}
            >
              <Text style={styles.clearButtonText}>Clear Selection</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Waste Types</Text>
          <Text style={styles.sectionSubtitle}>Select all types you need to dispose</Text>

          <View style={styles.wasteTypesGrid}>
            {WASTE_TYPES.map((type) => {
              const wasteInfo = getWasteTypeInfo(type);
              const isSelected = selectedWasteTypes.includes(type);

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.wasteTypeChip,
                    isSelected && styles.wasteTypeChipSelected,
                  ]}
                  onPress={() => toggleWasteType(type)}
                >
                  <Text style={styles.wasteTypeIcon}>{wasteInfo.icon}</Text>
                  <Text
                    style={[
                      styles.wasteTypeLabel,
                      isSelected && styles.wasteTypeLabelSelected,
                    ]}
                  >
                    {wasteInfo.name}
                  </Text>
                  <Text style={styles.wasteTypeFee}>
                    {formatCurrency(wasteInfo.fee)}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pickup Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Address</Text>
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your pickup address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instructions or notes for the collector..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Important Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Important Information</Text>
          <Text style={styles.infoText}>
            • Your request will be reviewed by a collector in your zone{'\n'}
            • The collector will select a visiting date from your available range{'\n'}
            • You'll be notified once your request is approved{'\n'}
            • Make sure your waste is properly sorted and ready for collection
          </Text>
        </View>

        {/* Cost Breakdown */}
        {selectedWasteTypes.length > 0 && (
          <View style={styles.costSection}>
            <Text style={styles.sectionTitle}>💰 Cost Breakdown</Text>
            
            {(() => {
              const calculation = calculateSpecialBookingFee(selectedWasteTypes);
              
              return (
                <View style={styles.costCard}>
                  {calculation.breakdown.map((item, index) => {
                    const wasteInfo = getWasteTypeInfo(item.wasteType);
                    return (
                      <View key={index} style={styles.costRow}>
                        <Text style={styles.costLabel}>
                          {wasteInfo.icon} {wasteInfo.name}:
                        </Text>
                        <Text style={styles.costValue}>
                          {formatCurrency(item.fee)}
                        </Text>
                      </View>
                    );
                  })}
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Subtotal:</Text>
                    <Text style={styles.costValue}>
                      {formatCurrency(calculation.subtotal)}
                    </Text>
                  </View>
                  
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Tax (8%):</Text>
                    <Text style={styles.costValue}>
                      {formatCurrency(calculation.tax)}
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.costRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(calculation.total)}
                    </Text>
                  </View>
                  
                  {calculation.total === 0 && (
                    <View style={styles.freeNotice}>
                      <Text style={styles.freeNoticeText}>
                        🎉 This booking is free! No payment required.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {(() => {
                if (selectedWasteTypes.length > 0) {
                  const calculation = calculateSpecialBookingFee(selectedWasteTypes);
                  if (calculation.total > 0) {
                    return `Continue to Payment (${formatCurrency(calculation.total)})`;
                  } else {
                    return 'Submit Free Booking Request';
                  }
                }
                return 'Submit Booking Request';
              })()}
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
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  calendarCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  clearButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  wasteTypeChip: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.small,
    borderWidth: 2,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  wasteTypeChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  wasteTypeIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  wasteTypeLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  wasteTypeFee: {
    fontSize: FontSizes.small,
    color: Colors.text.muted,
    fontWeight: '500',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wasteTypeLabelSelected: {
    color: Colors.primary,
  },
  addressInput: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
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
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
  costSection: {
    padding: Spacing.lg,
  },
  costCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  costLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    flex: 1,
  },
  costValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: 8,
  },
  freeNotice: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  freeNoticeText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
