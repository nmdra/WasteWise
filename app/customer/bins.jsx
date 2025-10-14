import { useRouter } from 'expo-router';
import { getAuth } from '../../config/firebase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { BIN_CATEGORIES } from '../../constants/wasteTypes';
import {
  getUserBins,
  calculateBinStats,
  subscribeToUserBins,
  toggleBinStatus,
  deleteBinCompletely,
  getUserActiveBins,
  addBinToSchedules,
} from '../../services/binService.optimized';

export default function BinsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [togglingBinId, setTogglingBinId] = useState(null); // Track which bin is being toggled
  const [navigatingBinId, setNavigatingBinId] = useState(null); // Track which bin is navigating to QR
  const [confirmDialog, setConfirmDialog] = useState(null); // For web-compatible confirmation

  useEffect(() => {
    if (user) {
      loadBins();
    }
  }, [user]);

  // Recalculate stats whenever bins change
  useEffect(() => {
    if (bins.length > 0) {
      const binStats = calculateBinStats(bins);
      setStats(binStats);
    }
  }, [bins]);

  const loadBins = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToUserBins(user.uid, (updatedBins) => {
        setBins(updatedBins);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading bins:', error);
      Alert.alert('Error', 'Failed to load bins');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Calculate stats from existing bins data
      const binStats = calculateBinStats(bins);
      setStats(binStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const activeBins = await getUserActiveBins(user.uid);
      
      if (activeBins.length > 0) {
        let totalAdded = 0;
        for (const bin of activeBins) {
          const result = await addBinToSchedules(bin.id);
          if (result.success && result.count > 0) {
            totalAdded += result.count;
          }
        }
        
        if (totalAdded > 0) {
          Alert.alert('Schedules Updated!', `Added ${totalAdded} stops to schedules`);
        }
      }
      
      await loadBins();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (binId, currentStatus, binData) => {
    console.log('🔄 Toggle status clicked:', { binId, currentStatus, binData });
    
    // Prevent multiple clicks
    if (togglingBinId) {
      console.log('⚠️ Already processing another bin, ignoring click');
      return;
    }
    
    const action = !currentStatus ? 'activate' : 'deactivate';
    const actionTitle = !currentStatus ? 'Activate Bin' : 'Deactivate Bin';
    const actionMessage = !currentStatus 
      ? 'Activating this bin will automatically add you to all future collection schedules in your zone for this waste type.'
      : 'Deactivating this bin will remove you from future collection schedules.';

    console.log('📢 Showing confirmation dialog...');
    console.log('📋 Dialog config:', { actionTitle, action, binId });
    
    // Web-compatible confirmation dialog
    setConfirmDialog({
      title: actionTitle,
      message: actionMessage,
      action: action,
      binId: binId,
      currentStatus: currentStatus,
      onConfirm: async () => {
        console.log('✅ User confirmed:', action);
        console.log('🎯 About to call toggleBinStatus with:', { binId, newStatus: !currentStatus });
        setConfirmDialog(null);
        setTogglingBinId(binId);
        
        try {
          console.log('🚀 Calling toggleBinStatus...', binId, !currentStatus);
          const result = await toggleBinStatus(binId, !currentStatus);
          console.log('📊 Result:', result);
          
          if (result.success) {
            let message = result.message;
            if (result.count !== undefined) {
              message += `\n\n📅 ${result.count > 0 ? `Added to ${result.count} future schedule(s)` : 'No matching schedules found yet'}`;
            }
            
            alert('Success! 🎉\n' + message);
            await loadBins();
          } else {
            alert('Error: ' + (result.error || 'Failed to update bin status'));
          }
        } catch (error) {
          console.error('❌ Error toggling bin status:', error);
          alert('Error: ' + (error.message || 'Failed to update bin status'));
        } finally {
          console.log('🏁 Finished processing, resetting state');
          setTogglingBinId(null);
        }
      },
      onCancel: () => {
        console.log('❌ User cancelled');
        setConfirmDialog(null);
        setTogglingBinId(null);
      }
    });
  };

  const handleBinPress = (bin) => {
    setNavigatingBinId(bin.id);
    // Small delay to show the loading state before navigation
    setTimeout(() => {
      router.push(`/customer/qr?binId=${bin.id}`);
      setNavigatingBinId(null);
    }, 100);
  };

  const filteredBins = bins.filter((bin) => {
    if (filter === 'all') return true;
    if (filter === 'active') return bin.isActive;
    if (filter === 'inactive') return !bin.isActive;
    return true;
  });

  const renderBinCard = ({ item: bin }) => {
    const categoryInfo = BIN_CATEGORIES[bin.category] || BIN_CATEGORIES.general;
    const isToggling = togglingBinId === bin.id;
    const isNavigating = navigatingBinId === bin.id;
    const isAnyActionRunning = isToggling || isNavigating;

    return (
      <TouchableOpacity
        style={[
          styles.binCard,
          !bin.isActive && styles.binCardInactive,
        ]}
        onPress={() => handleBinPress(bin)}
        activeOpacity={0.7}
        disabled={isAnyActionRunning}
      >
        <View style={styles.binHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
            <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
          </View>
          <View style={styles.binHeaderInfo}>
            <Text style={styles.binCategory}>{categoryInfo.label}</Text>
            <Text style={styles.binCode}>{bin.binId}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: bin.isActive ? Colors.state.success : Colors.state.error },
          ]}>
            <Text style={styles.statusText}>
              {bin.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {bin.description && (
          <Text style={styles.binDescription}>{bin.description}</Text>
        )}

        {bin.location && (
          <View style={styles.binInfo}>
            <Text style={styles.binInfoLabel}>📍 Location:</Text>
            <Text style={styles.binInfoValue}>{bin.location}</Text>
          </View>
        )}

        <View style={styles.binInfo}>
          <Text style={styles.binInfoLabel}>📊 Scans:</Text>
          <Text style={styles.binInfoValue}>{bin.scanCount || 0} times</Text>
        </View>

        {bin.lastScanned && (
          <View style={styles.binInfo}>
            <Text style={styles.binInfoLabel}>⏱️ Last Scanned:</Text>
            <Text style={styles.binInfoValue}>
              {new Date(bin.lastScanned).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.binActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isNavigating && styles.buttonDisabled,
            ]}
            onPress={() => handleBinPress(bin)}
            disabled={isAnyActionRunning}
          >
            {isNavigating ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.actionButtonText, styles.buttonTextWithSpinner]}>
                  Opening...
                </Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>View QR Code</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.toggleButton,
              !bin.isActive && styles.activateButton,
              isToggling && styles.buttonDisabled,
            ]}
            onPress={() => handleToggleStatus(bin.id, bin.isActive, bin)}
            disabled={isAnyActionRunning}
          >
            {isToggling ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.actionButtonText, styles.buttonTextWithSpinner]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>
                {bin.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your bins...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Bins</Text>
          <Text style={styles.subtitle}>Manage your waste bin QR codes</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRefresh}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color={refreshing ? Colors.text.secondary : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Bins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.state.success }]}>
              {stats.active}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.state.error }]}>
              {stats.inactive}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {stats.totalScans}
            </Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({bins.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active ({bins.filter(b => b.isActive).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'inactive' && styles.filterTabActive]}
          onPress={() => setFilter('inactive')}
        >
          <Text style={[styles.filterText, filter === 'inactive' && styles.filterTextActive]}>
            Inactive ({bins.filter(b => !b.isActive).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bins List */}
      {filteredBins.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗑️</Text>
          <Text style={styles.emptyTitle}>No bins yet</Text>
          <Text style={styles.emptyText}>
            Create QR codes for your bins to start tracking your waste collection
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/customer/link-bin')}
          >
            <Text style={styles.createButtonText}>Create Bin QR Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBins}
          renderItem={renderBinCard}
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

      {/* Floating Action Button */}
      {bins.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/customer/link-bin')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Web-Compatible Confirmation Modal */}
      {confirmDialog && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => confirmDialog.onCancel()}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{confirmDialog.title}</Text>
              <Text style={styles.modalMessage}>{confirmDialog.message}</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={confirmDialog.onCancel}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmDialog.onConfirm}
                >
                  <Text style={styles.modalButtonTextConfirm}>
                    {confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bg.light,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: Spacing.lg,
  },
  binCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  binCardInactive: {
    opacity: 0.6,
    backgroundColor: Colors.bg.light,
  },
  binHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: Radii.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  binHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  binCategory: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  binCode: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '700',
  },
  binDescription: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: FontSizes.body,
  headerLeft: {
    flexDirection: 'column',
  },
  headerRefresh: {
    padding: 8,
    borderRadius: 8,
  },
    color: Colors.text.secondary,
    width: 120,
  },
  binInfoValue: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  binActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.small,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: Colors.state.error,
  },
  activateButton: {
    backgroundColor: Colors.state.success,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonTextWithSpinner: {
    marginLeft: 4,
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
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
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
    bottom: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modalButtonTextConfirm: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: '#fff',
  },
});
