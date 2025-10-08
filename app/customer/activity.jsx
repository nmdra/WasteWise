import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AppHeader from '../../components/app-header';
import ListItem from '../../components/customer/ListItem';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCustomer } from '../../services/mockCustomerApi';

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
      const data = await MockCustomer.getActivity();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activity:', error);
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
          <Text style={styles.title}>Activity History</Text>
          <Text style={styles.subtitle}>Your pickup and collection history</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Total Pickups: {activities.length}</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activities.reduce((sum, a) => sum + a.weightKg, 0).toFixed(1)} kg
              </Text>
              <Text style={styles.statLabel}>Total Weight</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activities.filter((a) => a.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Pickups</Text>
          {activities.map((activity) => (
            <View key={activity.pickupId} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: Colors.status[activity.status] }]}>
                  <Text style={styles.statusText}>{activity.status}</Text>
                </View>
              </View>

              <View style={styles.activityDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pickup ID:</Text>
                  <Text style={styles.detailValue}>{activity.pickupId}</Text>
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
                  <Text style={styles.detailValue}>{activity.weightKg} kg</Text>
                </View>

                {activity.photos && activity.photos.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Photos:</Text>
                    <Text style={styles.detailValue}>{activity.photos.length} attached</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
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
});
