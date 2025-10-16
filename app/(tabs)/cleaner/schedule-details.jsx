import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    TextInput
} from 'react-native';
import AppHeader from '../../../components/app-header';
import { db } from '../../../config/firebase';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { wasteTypeIcons, deleteSchedule } from '../../../services/scheduleService';
import {
    getStopStats,
    markStopAsCollected,
    markStopAsSkipped,
    subscribeToStopsBySchedule,
} from '../../../services/stopsService';
import { updateBinStatus } from '../../../services/binService.optimized';

export default function ScheduleDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [schedule, setSchedule] = useState(null);
  const [stops, setStops] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, main, customer, pending, collected
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showStopDetailsModal, setShowStopDetailsModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);

  // Safe navigation helper
  const safeGoBack = () => {
    try {
      setTimeout(() => {
        try {
          router.back();
        } catch (err) {
          try {
            router.push('/');
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
    const unsubscribe = subscribeToStopsBySchedule(id, (stopsData) => {
      setStops(stopsData);
      loadStats();
    });

    return () => unsubscribe();
  }, [id]);

  const loadSchedule = async () => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', id));
      if (scheduleDoc.exists()) {
        setSchedule({
          id: scheduleDoc.id,
          ...scheduleDoc.data(),
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await getStopStats(id);
    setStats(statsData);
  };
  // Cross-platform prompt helper: uses Alert.prompt on iOS, falls back to window.prompt on web/Android
  const promptInput = (title, message, placeholder = '') => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        // eslint-disable-next-line no-undef
        Alert.prompt(title, message, (text) => resolve(text));
      } else if (typeof window !== 'undefined' && window.prompt) {
        const result = window.prompt(`${title}\n${message}`, placeholder);
        resolve(result);
      } else {
        // Fallback: simple alert then resolve with empty
        Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve('') }]);
      }
    });
  };

  const handleMarkCollected = async (stopId) => {
    const notes = await promptInput('Mark as Collected', 'Add any notes (optional)');
    
    // Get the stop data to check for bins
    const stop = stops.find(s => s.id === stopId);
    
    // Mark stop as collected
    const result = await markStopAsCollected(id, stopId, notes || '');
    
    if (result.success) {
      // Deactivate all bins associated with this stop
      if (stop && stop.bins && Array.isArray(stop.bins)) {
        console.log(`🔒 Deactivating ${stop.bins.length} bin(s) from stop...`);
        
        const deactivatePromises = stop.bins.map(async (bin) => {
          if (bin.binId) {
            try {
              await updateBinStatus(bin.binId, false);
              console.log(`✅ Deactivated bin: ${bin.binCode || bin.binId}`);
            } catch (error) {
              console.warn(`⚠️ Failed to deactivate bin ${bin.binId}:`, error);
            }
          }
        });
        
        await Promise.all(deactivatePromises);
        console.log('✅ All bins deactivated');
      }
      
      Alert.alert('Success', 'Stop marked as collected and bins deactivated');
    } else {
      Alert.alert('Error', 'Failed to mark as collected');
    }
  };

  const handleMarkSkipped = async (stopId) => {
    const reason = await promptInput('Skip Stop', 'Why are you skipping this stop?');
    const result = await markStopAsSkipped(id, stopId, reason || 'No reason provided');
    if (result.success) {
      Alert.alert('Success', 'Stop skipped');
    } else {
      Alert.alert('Error', 'Failed to skip stop');
    }
  };

  const handleEditSchedule = () => {
    setEditingSchedule({
      area: schedule.area || '',
      zone: schedule.zone || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule.area || !editingSchedule.zone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const scheduleRef = doc(db, 'schedules', id);
      await updateDoc(scheduleRef, {
        area: editingSchedule.area,
        zone: editingSchedule.zone,
        updatedAt: new Date(),
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Schedule updated successfully');
      loadSchedule(); // Reload schedule data
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = () => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? All stops will also be deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSchedule(id);
            if (result.success) {
              Alert.alert('Success', 'Schedule deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } else {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const handleViewStopDetails = (stop) => {
    setSelectedStop(stop);
    setShowStopDetailsModal(true);
  };

  const getFilteredStops = () => {
    switch (filter) {
      case 'main':
        return stops.filter(s => s.type === 'main');
      case 'customer':
        return stops.filter(s => s.type === 'customer');
      case 'pending':
        return stops.filter(s => s.status === 'pending');
      case 'collected':
        return stops.filter(s => s.status === 'collected');
      default:
        return stops;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Schedule not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredStops = getFilteredStops();

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {/* Schedule Info */}
        <View style={styles.scheduleInfo}>
          <View style={styles.scheduleHeaderRow}>
            <View style={styles.scheduleHeaderLeft}>
              <Text style={styles.scheduleDate}>{formatDate(schedule.date)}</Text>
              <View style={styles.zoneAreaRow}>
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneBadgeText}>Zone {schedule.zone}</Text>
                </View>
                <Text style={styles.areaText}>{schedule.area}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditSchedule}
              >
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteSchedule}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeSection}>
            {schedule.timeRanges?.map((range, idx) => (
              <View key={idx} style={styles.timeBadge}>
                <Text style={styles.timeText}>
                  ⏰ {range.start} - {range.end}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.wasteTypes}>
            {schedule.wasteTypes?.map((type) => (
              <View key={type} style={styles.wasteTypeBadge}>
                <Text style={styles.wasteTypeText}>
                  {wasteTypeIcons[type]} {type}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Stops</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>
              {stats.mainStops || 0}
            </Text>
            <Text style={styles.statLabel}>Main</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>
              {stats.customerStops || 0}
            </Text>
            <Text style={styles.statLabel}>Customer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>
              {stats.collected || 0}
            </Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.pending || 0}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'main', 'customer', 'pending', 'collected'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stops List */}
        <View style={styles.stopsList}>
          <Text style={styles.stopsTitle}>
            📍 Stops ({filteredStops.length})
          </Text>

          {filteredStops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stops match this filter</Text>
            </View>
          ) : (
            filteredStops.map((stop, index) => (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.stopCard,
                  stop.status === 'collected' && styles.stopCardCollected,
                  stop.status === 'skipped' && styles.stopCardSkipped,
                ]}
                onPress={() => handleViewStopDetails(stop)}
                activeOpacity={0.7}
              >
                <View style={styles.stopHeader}>
                  <View style={styles.stopHeaderLeft}>
                    <Text style={styles.stopNumber}>#{index + 1}</Text>
                    <View
                      style={[
                        styles.stopTypeBadge,
                        stop.type === 'main'
                          ? { backgroundColor: '#16A34A' }
                          : { backgroundColor: '#2563EB' },
                      ]}
                    >
                      <Text style={styles.stopTypeBadgeText}>
                        {stop.type === 'main' ? '📍 Main' : '👤 Customer'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      stop.status === 'collected' && { backgroundColor: '#16A34A' },
                      stop.status === 'pending' && { backgroundColor: '#F59E0B' },
                      stop.status === 'skipped' && { backgroundColor: '#DC2626' },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {stop.status === 'collected' ? '✅' : stop.status === 'skipped' ? '⏭️' : '⏳'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.stopAddress}>{stop.address}</Text>

                {/* Show user info for customer stops */}
                {stop.type === 'customer' && (
                  <View style={styles.customerInfo}>
                    {stop.userName && (
                      <Text style={styles.customerText}>👤 {stop.userName}</Text>
                    )}
                    {stop.userEmail && (
                      <Text style={styles.customerEmail}>📧 {stop.userEmail}</Text>
                    )}
                  </View>
                )}

                {/* Show waste types and categories */}
                {stop.wasteTypes && stop.wasteTypes.length > 0 && (
                  <View style={styles.wasteTypesRow}>
                    {stop.wasteTypes.map((type, idx) => (
                      <View key={idx} style={styles.miniWasteTypeBadge}>
                        <Text style={styles.miniWasteTypeText}>
                          {wasteTypeIcons[type] || '🗑️'} {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Show bins information */}
                {stop.bins && stop.bins.length > 0 && (
                  <View style={styles.binsSection}>
                    <Text style={styles.binsSectionTitle}>
                      🗑️ Bins ({stop.bins.length})
                    </Text>
                    {stop.bins.map((bin, binIdx) => (
                      <View key={binIdx} style={styles.binCard}>
                        <View style={styles.binHeader}>
                          <Text style={styles.binCode}>{bin.binCode}</Text>
                          <View style={styles.binCategoryBadge}>
                            <Text style={styles.binCategoryText}>
                              {wasteTypeIcons[bin.wasteType] || '🗑️'} {bin.binCategory}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.binId}>ID: {bin.binId}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {stop.notes && (
                  <Text style={styles.stopNotes}>📝 {stop.notes}</Text>
                )}

                {stop.collectedAt && (
                  <Text style={styles.collectedTime}>
                    Collected: {stop.collectedAt.toLocaleTimeString()}
                  </Text>
                )}

                {stop.status === 'pending' && (
                  <View style={styles.stopActions}>
                    <TouchableOpacity
                      style={styles.collectButton}
                      onPress={() => handleMarkCollected(stop.id)}
                    >
                      <Text style={styles.collectButtonText}>✅ Mark Collected</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={() => handleMarkSkipped(stop.id)}
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* View Details Indicator */}
                <View style={styles.viewDetailsIndicator}>
                  <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Schedule Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Schedule</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Zone</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter zone (e.g., A, B, C)"
                placeholderTextColor={Colors.text.secondary}
                value={editingSchedule?.zone || ''}
                onChangeText={(text) => setEditingSchedule({ ...editingSchedule, zone: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Area</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter area name"
                placeholderTextColor={Colors.text.secondary}
                value={editingSchedule?.area || ''}
                onChangeText={(text) => setEditingSchedule({ ...editingSchedule, area: text })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stop Details Modal */}
      <Modal
        visible={showStopDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStopDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.stopDetailsModal]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stop Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowStopDetailsModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedStop && (
                <>
                  {/* Stop Type and Status */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <View
                        style={[
                          styles.stopTypeBadge,
                          selectedStop.type === 'main'
                            ? { backgroundColor: '#16A34A' }
                            : { backgroundColor: '#2563EB' },
                        ]}
                      >
                        <Text style={styles.stopTypeBadgeText}>
                          {selectedStop.type === 'main' ? '📍 Main Stop' : '👤 Customer Stop'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <View
                        style={[
                          styles.statusDetailBadge,
                          selectedStop.status === 'collected' && { backgroundColor: '#16A34A' },
                          selectedStop.status === 'pending' && { backgroundColor: '#F59E0B' },
                          selectedStop.status === 'skipped' && { backgroundColor: '#DC2626' },
                        ]}
                      >
                        <Text style={styles.statusDetailText}>
                          {selectedStop.status === 'collected'
                            ? '✅ Collected'
                            : selectedStop.status === 'skipped'
                            ? '⏭️ Skipped'
                            : '⏳ Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>📍 Address</Text>
                    <Text style={styles.addressText}>
                      {selectedStop.address || 'No address provided'}
                    </Text>
                  </View>

                  {/* Zone */}
                  {selectedStop.zone && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>🗺️ Zone</Text>
                      <Text style={styles.detailValue}>Zone {selectedStop.zone}</Text>
                    </View>
                  )}

                  {/* Customer Information */}
                  {selectedStop.type === 'customer' && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>👤 Customer Information</Text>
                      
                      {selectedStop.userName && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Name:</Text>
                          <Text style={styles.infoValue}>{selectedStop.userName}</Text>
                        </View>
                      )}
                      
                      {selectedStop.userEmail && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Email:</Text>
                          <Text style={styles.infoValue}>{selectedStop.userEmail}</Text>
                        </View>
                      )}
                      
                      {selectedStop.userId && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>User ID:</Text>
                          <Text style={[styles.infoValue, { fontFamily: 'monospace', fontSize: FontSizes.small }]}>
                            {selectedStop.userId}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Waste Types */}
                  {selectedStop.wasteTypes && selectedStop.wasteTypes.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>♻️ Waste Types</Text>
                      <View style={styles.wasteTypesRow}>
                        {selectedStop.wasteTypes.map((type, idx) => (
                          <View key={idx} style={styles.detailWasteTypeBadge}>
                            <Text style={styles.detailWasteTypeText}>
                              {wasteTypeIcons[type] || '🗑️'} {type}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Categories */}
                  {selectedStop.categories && selectedStop.categories.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📦 Categories</Text>
                      <View style={styles.wasteTypesRow}>
                        {selectedStop.categories.map((category, idx) => (
                          <View key={idx} style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{category}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Bins */}
                  {selectedStop.bins && selectedStop.bins.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        🗑️ Bins ({selectedStop.bins.length})
                      </Text>
                      {selectedStop.bins.map((bin, binIdx) => (
                        <View key={binIdx} style={styles.detailBinCard}>
                          <View style={styles.binDetailHeader}>
                            <Text style={styles.binDetailCode}>{bin.binCode}</Text>
                            <View style={styles.binDetailCategoryBadge}>
                              <Text style={styles.binDetailCategoryText}>
                                {wasteTypeIcons[bin.wasteType] || '🗑️'} {bin.binCategory}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.binInfoRow}>
                            <Text style={styles.binInfoLabel}>Bin ID:</Text>
                            <Text style={styles.binInfoValue}>{bin.binId}</Text>
                          </View>
                          <View style={styles.binInfoRow}>
                            <Text style={styles.binInfoLabel}>Waste Type:</Text>
                            <Text style={styles.binInfoValue}>{bin.wasteType}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Collection Time */}
                  {selectedStop.collectedAt && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>⏰ Collection Time</Text>
                      <Text style={styles.detailValue}>
                        {selectedStop.collectedAt.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.detailValue}>
                        {selectedStop.collectedAt.toLocaleTimeString('en-US')}
                      </Text>
                    </View>
                  )}

                  {/* Notes */}
                  {selectedStop.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📝 Notes</Text>
                      <Text style={styles.notesText}>{selectedStop.notes}</Text>
                    </View>
                  )}

                  {/* Timestamps */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>🕐 Timestamps</Text>
                    
                    {selectedStop.createdAt && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Created:</Text>
                        <Text style={styles.timestampValue}>
                          {selectedStop.createdAt.toLocaleString('en-US')}
                        </Text>
                      </View>
                    )}
                    
                    {selectedStop.updatedAt && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Updated:</Text>
                        <Text style={styles.timestampValue}>
                          {selectedStop.updatedAt.toLocaleString('en-US')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  {selectedStop.status === 'pending' && (
                    <View style={styles.detailActionsSection}>
                      <TouchableOpacity
                        style={styles.detailCollectButton}
                        onPress={() => {
                          setShowStopDetailsModal(false);
                          handleMarkCollected(selectedStop.id);
                        }}
                      >
                        <Text style={styles.detailCollectButtonText}>
                          ✅ Mark as Collected
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailSkipButton}
                        onPress={() => {
                          setShowStopDetailsModal(false);
                          handleMarkSkipped(selectedStop.id);
                        }}
                      >
                        <Text style={styles.detailSkipButtonText}>⏭️ Skip Stop</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
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
  scheduleInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  scheduleHeaderLeft: {
    flex: 1,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
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
    backgroundColor: Colors.primary,
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
  timeSection: {
    marginBottom: Spacing.md,
  },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wasteTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  wasteTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  wasteTypeText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.bg.card,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.small,
  },
  statValue: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  filterBar: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    backgroundColor: '#F3F4F6',
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  stopsList: {
    padding: Spacing.lg,
  },
  stopsTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  stopCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: Colors.line,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stopCardCollected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  stopCardSkipped: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumber: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  stopTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  stopTypeBadgeText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 18,
  },
  stopAddress: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.sm,
    borderRadius: Radii.small,
    marginBottom: Spacing.sm,
  },
  customerText: {
    fontSize: FontSizes.small,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: FontSizes.small,
    color: '#1E40AF',
  },
  wasteTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  miniWasteTypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  miniWasteTypeText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  binsSection: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.sm,
  },
  binsSectionTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  binCard: {
    backgroundColor: '#fff',
    padding: Spacing.sm,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.xs,
  },
  binHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  binCode: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  binCategoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  binCategoryText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  binId: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
  },
  stopNotes: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  collectedTime: {
    fontSize: FontSizes.small,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  stopActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  collectButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  collectButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  viewDetailsIndicator: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.light,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.bg.light,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confirmButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: '#fff',
  },
  // Stop Details Modal styles
  stopDetailsModal: {
    maxHeight: '90%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  detailSection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  statusDetailBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
  },
  statusDetailText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  addressText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  detailValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  detailWasteTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailWasteTypeText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontSize: FontSizes.body,
    color: '#92400E',
    fontWeight: '600',
  },
  detailBinCard: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  binDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  binDetailCode: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  binDetailCategoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.chip,
  },
  binDetailCategoryText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  binInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  binInfoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  binInfoValue: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  notesText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: Radii.small,
  },
  timestampValue: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  detailActionsSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  detailCollectButton: {
    backgroundColor: '#16A34A',
    padding: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  detailCollectButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  detailSkipButton: {
    backgroundColor: '#F3F4F6',
    padding: Spacing.md,
    borderRadius: Radii.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  detailSkipButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
