import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/app-header';
import Button from '../../components/customer/Button';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { MockCustomer } from '../../services/mockCustomerApi';

export default function Locations() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await MockCustomer.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLocations();
  };

  const handleSetPrimary = (locationId) => {
    Alert.alert(
      'Set Primary Location',
      'Set this as your primary pickup location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Primary',
          onPress: () => {
            // Update primary location
            const updatedLocations = locations.map((loc) => ({
              ...loc,
              isPrimary: loc.id === locationId,
            }));
            setLocations(updatedLocations);
            Alert.alert('Success', 'Primary location updated!');
          },
        },
      ]
    );
  };

  const handleEditLocation = (location) => {
    Alert.alert(
      'Edit Location',
      `Edit ${location.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => console.log('Edit:', location.id) },
      ]
    );
  };

  const handleDeleteLocation = (location) => {
    if (location.isPrimary) {
      Alert.alert('Cannot Delete', 'You cannot delete your primary location. Set another location as primary first.');
      return;
    }

    Alert.alert(
      'Delete Location',
      `Delete ${location.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const filtered = locations.filter((loc) => loc.id !== location.id);
            setLocations(filtered);
            Alert.alert('Success', 'Location deleted!');
          },
        },
      ]
    );
  };

  const handleAddLocation = () => {
    Alert.alert(
      'Add Location',
      'This feature will open a map to select a new pickup location.',
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
          <Text style={styles.title}>My Locations</Text>
          <Text style={styles.subtitle}>Manage your pickup addresses</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Locations ({locations.length})</Text>

          {locations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>No locations added</Text>
              <Text style={styles.emptyText}>Add your first pickup location</Text>
              <Button
                title="Add Location"
                onPress={handleAddLocation}
                variant="primary"
                icon="➕"
              />
            </View>
          ) : (
            <>
              {locations.map((location) => (
                <View key={location.id} style={styles.locationCard}>
                  <View style={styles.locationHeader}>
                    <View style={styles.locationTitleRow}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>{location.label}</Text>
                        {location.isPrimary && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryText}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.locationDetails}>
                    <Text style={styles.addressText}>{location.address}</Text>
                    {location.coords && (
                      <Text style={styles.coordsText}>
                        {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.locationActions}>
                    {!location.isPrimary && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetPrimary(location.id)}
                      >
                        <Text style={styles.actionButtonText}>⭐ Set Primary</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditLocation(location)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteLocation(location)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Button
                title="Add New Location"
                onPress={handleAddLocation}
                variant="ghost"
                icon="➕"
                fullWidth
              />
            </>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoTitle}>About Locations</Text>
          <Text style={styles.infoText}>
            Add multiple pickup locations (home, office, etc.). Your primary location is used for regular scheduled pickups.
          </Text>
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
  locationCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  locationHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.green,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
  },
  primaryText: {
    fontSize: FontSizes.tiny,
    fontWeight: '700',
    color: Colors.text.white,
  },
  locationDetails: {
    padding: Spacing.lg,
  },
  addressText: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  coordsText: {
    fontSize: FontSizes.small,
    color: Colors.text.muted,
  },
  locationActions: {
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
  deleteButton: {
    borderRightWidth: 0,
  },
  deleteButtonText: {
    color: Colors.state.error,
  },
  infoCard: {
    backgroundColor: Colors.brand.lightGreen,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
