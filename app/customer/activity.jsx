import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { collectionService } from '../../services/collectionService';
import { auth } from '../../config/firebase';

export default function Activity() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found');
        setActivities([]);
        return;
      }

      console.log('📊 Loading activity for customer:', currentUser.uid);
      
      // Fetch collections for this customer (where ownerId = current user)
      const collections = await collectionService.getCollectionsByOwner(currentUser.uid);
      
      console.log('📋 Found collections:', collections.length);

      // Transform collection data to activity format
      const activityData = collections.map(collection => ({
        id: collection.id,
        pickupId: collection.stopId || `pickup_${collection.id}`,
        date: collection.collectedAt || collection.createdAt,
        status: collection.status || 'completed',
        types: collection.wasteTypes || ['general'],
        weightKg: collection.weight || 0,
        location: collection.location || 'Not specified',
        notes: collection.notes || '',
        binId: collection.binId,
        cleanerName: `Cleaner ${collection.userId?.slice(0, 8)}` || 'Cleaner',
        collectedAt: collection.collectedAt,
        scannedAt: collection.scannedAt
      }));

      setActivities(activityData);
      console.log('✅ Activity loaded successfully:', activityData.length, 'records');
      
    } catch (error) {
      console.error('❌ Error loading activity:', error);
      Alert.alert('Error', 'Failed to load activity history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'collected':
      case 'completed':
        return Colors.brand.green;
      case 'pending':
        return Colors.brand.orange;
      case 'cancelled':
        return Colors.brand.red;
      default:
        return Colors.text.secondary;
    }
  };

  const generateReport = () => {
    if (activities.length === 0) {
      Alert.alert('No Data', 'No collection data available to generate report.');
      return;
    }

    const totalWeight = activities.reduce((sum, a) => sum + (a.weightKg || 0), 0);
    const wasteTypes = new Set(activities.flatMap(a => a.types));
    const completedCollections = activities.filter(a => a.status === 'collected' || a.status === 'completed').length;

    const reportData = {
      totalCollections: activities.length,
      completedCollections,
      totalWeight: totalWeight.toFixed(1),
      wasteTypes: Array.from(wasteTypes),
      dateRange: activities.length > 0 ? {
        from: formatDate(activities[activities.length - 1].date),
        to: formatDate(activities[0].date)
      } : null
    };

    Alert.alert(
      'Collection Report 📊',
      `Total Collections: ${reportData.totalCollections}\nCompleted: ${reportData.completedCollections}\nTotal Weight: ${reportData.totalWeight} kg\nWaste Types: ${reportData.wasteTypes.join(', ')}\n\nPDF download coming soon!`,
      [{ text: 'OK' }]
    );
  };

  const downloadPDF = () => {
    Alert.alert(
      'Download PDF 📄',
      'PDF download functionality will be implemented soon. This will include:\n\n• Detailed collection history\n• Weight analytics\n• Waste type breakdown\n• Environmental impact summary',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.green]} />
        }
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View>
              <Text style={styles.title}>Activity History</Text>
              <Text style={styles.subtitle}>Your pickup and collection history</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn} onPress={generateReport}>
                <Text style={styles.actionBtnText}>📊 Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={downloadPDF}>
                <Text style={styles.actionBtnText}>📄 PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Total Collections: {activities.length}</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activities.reduce((sum, a) => sum + (a.weightKg || 0), 0).toFixed(1)} kg
              </Text>
              <Text style={styles.statLabel}>Total Weight</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activities.filter((a) => a.status === 'collected' || a.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Set(activities.flatMap(a => a.types)).size}
              </Text>
              <Text style={styles.statLabel}>Waste Types</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Collections</Text>
          
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>📭 No collections yet</Text>
              <Text style={styles.emptySubtext}>Your collection history will appear here once cleaners pick up your waste.</Text>
            </View>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
                    <Text style={styles.statusText}>{activity.status}</Text>
                  </View>
                </View>

                <View style={styles.activityDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Collection ID:</Text>
                    <Text style={styles.detailValue}>{activity.id.slice(-8)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bin ID:</Text>
                    <Text style={styles.detailValue}>{activity.binId}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Waste Types:</Text>
                    <View style={styles.wasteTypes}>
                      {activity.types.map((type, index) => (
                        <View key={index} style={styles.wasteChip}>
                          <Text style={styles.wasteText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight:</Text>
                    <Text style={styles.detailValue}>
                      {activity.weightKg > 0 ? `${activity.weightKg} kg` : 'Not recorded'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{activity.location}</Text>
                  </View>

                  {activity.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.detailValue}>{activity.notes}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Collected by:</Text>
                    <Text style={styles.detailValue}>{activity.cleanerName}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
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
    color: Colors.text.muted,
    fontSize: FontSizes.body,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    backgroundColor: Colors.brand.green,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.btn,
  },
  actionBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.brand.green,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.line,
    marginHorizontal: Spacing.lg,
  },
  activityCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  activityDate: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
  },
  statusText: {
    fontSize: FontSizes.tiny,
    fontWeight: '700',
    color: Colors.text.white,
    textTransform: 'uppercase',
  },
  activityDetails: {
    padding: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wasteTypes: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  wasteChip: {
    backgroundColor: Colors.brand.lightGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  wasteText: {
    fontSize: FontSizes.tiny,
    fontWeight: '600',
    color: Colors.brand.green,
  },
  emptyState: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
