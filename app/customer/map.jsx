import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Spacing } from '../../constants/customerTheme';
import { getAuth, onAuthStateChanged } from '../../config/firebase';
import { getSchedulesForUser } from '../../services/scheduleService';

export default function CustomerMap() {
  console.log('🚀 CustomerMap component mounted');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Auth state changed - user:', user ? 'authenticated' : 'null');
      if (user) {
        console.log('✅ User authenticated, userId:', user.uid);
        setUserId(user.uid);
      } else {
        console.log('❌ User not authenticated');
        setUserId(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // Fetch schedules where user has stops
  const loadSchedules = useCallback(async () => {
    console.log('📡 loadSchedules called');

    if (!userId) {
      console.log('❌ No userId available, skipping load');
      setLoading(false);
      return;
    }

    console.log('🔍 Loading schedules for user:', userId);
    try {
      console.log('⏳ Calling getSchedulesForUser...');
      const userSchedules = await getSchedulesForUser(userId);
      console.log('✅ getSchedulesForUser returned:', userSchedules.length, 'schedules');

      // Log details of each schedule
      userSchedules.forEach((schedule, index) => {
        console.log(`📋 Schedule ${index + 1}:`, {
          id: schedule.scheduleId,
          date: schedule.date,
          collector: schedule.collectorName,
          zone: schedule.zone,
          stops: schedule.stops?.length || 0,
          wasteTypes: schedule.wasteTypes
        });
      });

      setSchedules(userSchedules);
      console.log('💾 Schedules state updated');
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
      console.error('❌ Error details:', error.message);
      Alert.alert('Error', 'Failed to load schedules. Please try again.');
    } finally {
      console.log('🏁 loadSchedules completed, setting loading to false');
      setLoading(false);
    }
  }, [userId]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log('🔄 handleRefresh called');

    if (!userId) {
      console.log('❌ No userId for refresh');
      return;
    }

    console.log('⏳ Starting refresh...');
    setRefreshing(true);
    try {
      await loadSchedules();
      console.log('✅ Refresh completed successfully');
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      console.log('🏁 Refresh finished, setting refreshing to false');
      setRefreshing(false);
    }
  }, [userId, loadSchedules]);

  // Load schedules when userId becomes available
  useEffect(() => {
    if (userId && !authLoading) {
      console.log('⚡ useEffect triggered - loading schedules for authenticated user');
      loadSchedules();
    } else if (!authLoading && !userId) {
      console.log('⚡ useEffect triggered - no user authenticated, setting loading to false');
      setLoading(false);
    }
  }, [userId, authLoading, loadSchedules]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Not scheduled';

    const today = new Date();
    const scheduleDate = new Date(date);
    const diffTime = scheduleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

    return scheduleDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: scheduleDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // Format time ranges
  const formatTimeRanges = (timeRanges) => {
    if (!timeRanges || timeRanges.length === 0) return 'Not specified';
    return timeRanges.map(range => `${range.start} - ${range.end}`).join(', ');
  };

  // Get status color based on schedule date
  const getStatusColor = (date) => {
    if (!date) return Colors.text.secondary;

    const today = new Date();
    const scheduleDate = new Date(date);
    const diffDays = Math.ceil((scheduleDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '#EF4444'; // Red - overdue
    if (diffDays <= 2) return '#10B981'; // Green - soon
    return '#3B82F6'; // Blue - scheduled
  };

  // Get status text
  const getStatusText = (date) => {
    if (!date) return 'Unknown';

    const today = new Date();
    const scheduleDate = new Date(date);
    const diffDays = Math.ceil((scheduleDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return 'Scheduled';
  };

  // Auth loading state
  if (authLoading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContainer}>
          <Ionicons name="person-circle-outline" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  // Not authenticated state
  if (!userId) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContainer}>
          <Ionicons name="log-in-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyTitle}>Authentication Required</Text>
          <Text style={styles.emptyText}>
            Please log in to view your pickup schedules.
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContainer}>
          <Ionicons name="calendar" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your schedules...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (schedules.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Scheduled Pickups</Text>
          <Text style={styles.emptyText}>
            You don't have any scheduled waste collection pickups yet.{'\n'}
            Activate your bins to get assigned to collection schedules.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pickup Schedules</Text>
          <Text style={styles.headerSubtitle}>
            {schedules.length} scheduled pickup{schedules.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRefreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={refreshing ? Colors.text.secondary : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {schedules.map((schedule) => {
          const statusColor = getStatusColor(schedule.date);
          const statusText = getStatusText(schedule.date);
          const stopsCount = schedule.stops ? schedule.stops.length : 0;

          return (
            <View key={schedule.scheduleId} style={styles.scheduleCard}>
              {/* Header with status indicator */}
              <View style={styles.cardHeader}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                  </Text>
                </View>
                <Text style={styles.scheduleId}>ID: {schedule.scheduleId}</Text>
              </View>

              {/* Main content */}
              <View style={styles.cardContent}>
                {/* Date and Time */}
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{formatDate(schedule.date)}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Time:</Text>
                    <Text style={styles.value}>{formatTimeRanges(schedule.timeRanges)}</Text>
                  </View>
                </View>

                {/* Collector and Zone */}
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Ionicons name="person-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Collector:</Text>
                    <Text style={styles.value}>{schedule.collectorName || 'Not assigned'}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Zone:</Text>
                    <Text style={styles.value}>{schedule.zone || 'Not specified'}</Text>
                  </View>

                  {schedule.area && (
                    <View style={styles.row}>
                      <Ionicons name="map-outline" size={20} color={Colors.text.secondary} />
                      <Text style={styles.label}>Area:</Text>
                      <Text style={styles.value}>{schedule.area}</Text>
                    </View>
                  )}
                </View>

                {/* Capacity and Waste Types */}
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Ionicons name="people-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Slots:</Text>
                    <Text style={styles.value}>
                      {schedule.availableSlots || 0} available / {schedule.totalSlots || 0} total
                    </Text>
                  </View>

                  {schedule.wasteTypes && schedule.wasteTypes.length > 0 && (
                    <View style={styles.row}>
                      <Ionicons name="trash-outline" size={20} color={Colors.text.secondary} />
                      <Text style={styles.label}>Collecting:</Text>
                      <Text style={styles.value}>{schedule.wasteTypes.join(', ')}</Text>
                    </View>
                  )}
                </View>

                {/* Your Stops */}
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Ionicons name="list-outline" size={20} color={Colors.text.secondary} />
                    <Text style={styles.label}>Your Bins:</Text>
                    <Text style={styles.value}>{stopsCount} scheduled</Text>
                  </View>

                  {schedule.stops && schedule.stops.length > 0 && (
                    <View style={styles.stopsList}>
                      {schedule.stops.map((stop, index) => (
                        <View key={stop.stopId || index} style={styles.stopItem}>
                          <Ionicons name="trash-bin" size={16} color={Colors.text.secondary} />
                          <Text style={styles.stopText}>
                            {stop.binCode || `Bin ${index + 1}`} • {stop.binCategory || 'Unknown'}
                          </Text>
                          {stop.wasteType && (
                            <Text style={styles.stopBadge}>{stop.wasteType}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Notes */}
                {schedule.notes && (
                  <View style={styles.notesSection}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.notesText}>{schedule.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pull down to refresh or tap the refresh button
          </Text>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: Spacing.xl,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerRefreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  scheduleCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  scheduleId: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontFamily: 'monospace',
  },
  cardContent: {
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    minWidth: 60,
  },
  value: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  stopsList: {
    marginTop: Spacing.sm,
    paddingLeft: 28, // Align with icon
    gap: Spacing.xs,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    flex: 1,
  },
  stopBadge: {
    fontSize: 11,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  notesText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    flex: 1,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
});
