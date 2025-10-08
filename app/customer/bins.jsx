import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCustomer } from '../../services/mockCustomerApi';
import AppHeader from '../../components/app-header';
import ListItem from '../../components/customer/ListItem';
import Button from '../../components/customer/Button';

export default function MyBins() {
  const router = useRouter();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBins();
  }, []);

  const loadBins = async () => {
    try {
      const data = await MockCustomer.getBins();
      setBins(data);
    } catch (error) {
      console.error('Error loading bins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBins();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return Colors.status.completed;
      case 'inactive':
        return Colors.status.cancelled;
      default:
        return Colors.text.muted;
    }
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
          <Text style={styles.title}>My Bins</Text>
          <Text style={styles.subtitle}>Manage your registered waste bins</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/customer/scan')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionTitle}>Link New Bin</Text>
            <Text style={styles.actionDesc}>Scan QR code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/customer/qr')}
          >
            <Text style={styles.actionIcon}>🏷️</Text>
            <Text style={styles.actionTitle}>My QR Code</Text>
            <Text style={styles.actionDesc}>Show & print</Text>
          </TouchableOpacity>
        </View>

        {/* Bins List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Bins ({bins.length})</Text>
          
          {bins.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗑️</Text>
              <Text style={styles.emptyTitle}>No bins registered</Text>
              <Text style={styles.emptyText}>
                Link your first bin by scanning its QR code
              </Text>
              <Button
                title="Link Bin"
                onPress={() => router.push('/customer/scan')}
                variant="primary"
              />
            </View>
          ) : (
            bins.map((bin) => (
              <View key={bin.binId} style={styles.binCard}>
                <View style={styles.binHeader}>
                  <View style={styles.binTitleRow}>
                    <Text style={styles.binId}>🗑️ Bin {bin.binId}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(bin.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{bin.status}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.binInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tag ID:</Text>
                    <Text style={styles.infoValue}>{bin.tagId}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Types:</Text>
                    <View style={styles.typeChips}>
                      {bin.types.map((type, index) => (
                        <View key={index} style={styles.typeChip}>
                          <Text style={styles.typeText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Collected:</Text>
                    <Text style={styles.infoValue}>{formatDate(bin.lastCollected)}</Text>
                  </View>

                  {bin.notes && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Notes:</Text>
                      <Text style={styles.infoValue}>{bin.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.binActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>📊 History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>💡</Text>
            <Text style={styles.infoCardTitle}>Bin QR Codes</Text>
            <Text style={styles.infoCardText}>
              Each bin should have a QR code sticker. Make sure it's visible and not damaged.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>📱</Text>
            <Text style={styles.infoCardTitle}>Quick Verification</Text>
            <Text style={styles.infoCardText}>
              During pickup, cleaners scan your bin's QR code to log the collection automatically.
            </Text>
          </View>
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
    paddingBottom: Spacing.md,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  actionDesc: {
    fontSize: FontSizes.small,
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
  emptyState: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.xl,
    borderRadius: Radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  binCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  binHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  binTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  binId: {
    fontSize: FontSizes.h3,
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
  binInfo: {
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  typeChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  typeChip: {
    backgroundColor: Colors.brand.lightGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  typeText: {
    fontSize: FontSizes.tiny,
    fontWeight: '600',
    color: Colors.brand.green,
  },
  binActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.line,
  },
  actionButtonText: {
    fontSize: FontSizes.small,
    color: Colors.brand.green,
    fontWeight: '600',
  },
  infoCards: {
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
  },
  infoCardIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  infoCardTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  infoCardText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
