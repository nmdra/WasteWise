import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
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
import { db } from '../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { formatScheduleDate, formatTimeRange, wasteTypeIcons } from '../../services/scheduleService';
import { getStopStats } from '../../services/stopsService';

export default function ScheduleDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Safe navigation helper
  const safeGoBack = () => {
    try {
      setTimeout(() => {
        try {
          router.back();
        } catch (err) {
          try {
            router.push('/customer/home');
          } catch (e) {
            console.warn('Navigation fallback failed', e);
          }
        }
      }, 50);
    } catch (err) {
      console.warn('safeGoBack error', err);
    }
  };

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid schedule ID');
      safeGoBack();
      return;
    }

    loadSchedule();
    loadStats();
  }, [id]);

  const loadSchedule = async () => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', id));
      if (scheduleDoc.exists()) {
        setSchedule({
          id: scheduleDoc.id,
          ...scheduleDoc.data(),
        });
      } else {
        Alert.alert('Error', 'Schedule not found');
        safeGoBack();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getStopStats(id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleBookPickup = () => {
    // Navigate to create booking with schedule info
    router.push(`/customer/create-booking?scheduleId=${id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Schedule not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={safeGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isPast = new Date(schedule.date) < new Date();
  const availableSlots = schedule.availableSlots || 0;
  const isFullyBooked = availableSlots <= 0;

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {/* Schedule Header */}
        <View style={[styles.scheduleHeader, isPast && styles.scheduleHeaderPast]}>
          <Text style={styles.scheduleDate}>{formatScheduleDate(schedule.date)}</Text>
          <View style={styles.zoneAreaRow}>
            <View style={[
              styles.zoneBadge,
              { backgroundColor: isPast ? '#9CA3AF' : Colors.primary }
            ]}>
              <Text style={styles.zoneBadgeText}>Zone {schedule.zone}</Text>
            </View>
            <Text style={styles.areaText}>{schedule.area}</Text>
          </View>

          {isPast && (
            <View style={styles.pastBanner}>
              <Text style={styles.pastBannerText}>⏰ This collection has already taken place</Text>
            </View>
          )}
        </View>

        {/* Collection Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Collection Times</Text>
          <View style={styles.card}>
            {schedule.timeRanges?.map((range, idx) => (
              <View key={idx} style={styles.timeItem}>
                <Text style={styles.timeItemText}>
                  Time Slot {idx + 1}: {formatTimeRange(range)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Accepted Waste Types</Text>
          <View style={styles.card}>
            <View style={styles.wasteTypesGrid}>
              {schedule.wasteTypes?.map((type) => (
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

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Availability</Text>
          <View style={styles.card}>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{availableSlots}</Text>
                <Text style={styles.statLabel}>Available Slots</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{schedule.totalSlots || 0}</Text>
                <Text style={styles.statLabel}>Total Slots</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#2563EB' }]}>
                  {stats.customerStops || 0}
                </Text>
                <Text style={styles.statLabel}>Booked</Text>
              </View>
            </View>

            {isFullyBooked && !isPast && (
              <View style={styles.fullyBookedBanner}>
                <Text style={styles.fullyBookedText}>🔴 Fully Booked</Text>
              </View>
            )}
          </View>
        </View>

        {/* Collection Statistics */}
        {(stats.total > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Collection Progress</Text>
            <View style={styles.card}>
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Total Stops</Text>
                  <Text style={styles.progressValue}>{stats.total || 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Completed</Text>
                  <Text style={[styles.progressValue, { color: '#16A34A' }]}>
                    {stats.collected || 0}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Pending</Text>
                  <Text style={[styles.progressValue, { color: '#F59E0B' }]}>
                    {stats.pending || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Collector Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Collector Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Collector:</Text>
              <Text style={styles.infoValue}>{schedule.collectorName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Zone Coverage:</Text>
              <Text style={styles.infoValue}>Zone {schedule.zone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Area:</Text>
              <Text style={styles.infoValue}>{schedule.area}</Text>
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        {schedule.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          </View>
        )}

        {/* Important Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Important Information</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              • Please ensure your waste is properly sorted before collection{'\n'}
              • Place bins at the collection point during the specified time{'\n'}
              • Heavy or hazardous waste may require special arrangements{'\n'}
              • Collection may be delayed due to weather or traffic conditions
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      {!isPast && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookButton, isFullyBooked && styles.bookButtonDisabled]}
            onPress={handleBookPickup}
            disabled={isFullyBooked}
          >
            <Text style={styles.bookButtonText}>
              {isFullyBooked ? '🔴 Fully Booked' : '📅 Request Special Pickup'}
            </Text>
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
  scheduleHeader: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  scheduleHeaderPast: {
    backgroundColor: '#F3F4F6',
  },
  scheduleDate: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  zoneAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  pastBanner: {
    backgroundColor: '#FEF2F2',
    padding: Spacing.md,
    borderRadius: Radii.small,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  pastBannerText: {
    color: '#DC2626',
    fontSize: FontSizes.body,
    fontWeight: '600',
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
  timeItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  timeItemText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.line,
  },
  statValue: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  fullyBookedBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  fullyBookedText: {
    color: '#DC2626',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
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
  notesText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  infoText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
});
