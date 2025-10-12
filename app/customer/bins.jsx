import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import {
  BIN_CATEGORIES,
  getUserBins,
  getUserBinStats,
  subscribeToUserBins,
  toggleBinStatus,
} from '../../services/binService';

export default function BinsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    if (user) {
      loadBins();
      loadStats();
    }
  }, [user]);

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
      const binStats = await getUserBinStats(user.uid);
      setStats(binStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBins();
    loadStats();
  };

  const handleToggleStatus = async (binId, currentStatus) => {
    try {
      await toggleBinStatus(binId, !currentStatus);
      Alert.alert(
        'Success',
        `Bin ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error toggling bin status:', error);
      Alert.alert('Error', 'Failed to update bin status');
    }
  };

  const handleBinPress = (bin) => {
    router.push(`/customer/qr?binId=${bin.id}`);
  };

  const filteredBins = bins.filter((bin) => {
    if (filter === 'all') return true;
    if (filter === 'active') return bin.isActive;
    if (filter === 'inactive') return !bin.isActive;
    return true;
  });

  const renderBinCard = ({ item: bin }) => {
    const categoryInfo = BIN_CATEGORIES[bin.category] || BIN_CATEGORIES.general;

    return (
      <TouchableOpacity
        style={[
          styles.binCard,
          !bin.isActive && styles.binCardInactive,
        ]}
        onPress={() => handleBinPress(bin)}
        activeOpacity={0.7}
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
            style={styles.actionButton}
            onPress={() => handleBinPress(bin)}
          >
            <Text style={styles.actionButtonText}>View QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.toggleButton,
              !bin.isActive && styles.activateButton,
            ]}
            onPress={() => handleToggleStatus(bin.id, bin.isActive)}
          >
            <Text style={styles.actionButtonText}>
              {bin.isActive ? 'Deactivate' : 'Activate'}
            </Text>
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
        <Text style={styles.title}>My Bins</Text>
        <Text style={styles.subtitle}>Manage your waste bin QR codes</Text>
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
  },
  binInfo: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs,
  },
  binInfoLabel: {
    fontSize: FontSizes.body,
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
});
