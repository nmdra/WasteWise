import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, Alert } from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';
import { collectionService } from '../../../services/collectionService';
import { auth } from '../../../config/firebase';



export default function CollectionHistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('date');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found');
        setCollections([]);
        return;
      }

      console.log('📊 Loading collections for cleaner:', currentUser.uid);
      
      // Fetch collections made by this cleaner (where userId = current user)
      const userCollections = await collectionService.getCollectionsByUser(currentUser.uid);
      
      console.log('📋 Found collections:', userCollections.length);

      // Transform data for display
      const formattedCollections = userCollections.map(collection => ({
        id: collection.id,
        binId: collection.binId,
        binDocId: collection.binDocId,
        type: collection.wasteTypes?.join(', ') || 'General Waste',
        time: formatTime(collection.collectedAt || collection.createdAt),
        status: collection.status || 'collected',
        weight: collection.weight,
        location: collection.location,
        ownerName: collection.ownerName,
        notes: collection.notes,
        collectedAt: collection.collectedAt,
        scannedAt: collection.scannedAt
      }));

      setCollections(formattedCollections);
      console.log('✅ Collections loaded successfully:', formattedCollections.length, 'records');
      
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collection history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollections();
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const collectionDate = new Date(date);
    const diffInDays = Math.floor((now - collectionDate) / (1000 * 60 * 60 * 24));
    
    const timeStr = collectionDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (diffInDays === 0) {
      return `${timeStr}, Today`;
    } else if (diffInDays === 1) {
      return `${timeStr}, Yesterday`;
    } else {
      return `${timeStr}, ${diffInDays} days ago`;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'collected':
        return { bg: Colors.brand.lightGreen, text: Colors.brand.green };
      case 'issue':
        return { bg: '#FDECEA', text: '#F44336' };
      case 'pending':
        return { bg: '#FFF4E5', text: '#FF9800' };
      default:
        return { bg: Colors.bg.light, text: Colors.text.muted };
    }
  };

  // Filter collections based on search
  const filteredCollections = collections.filter(item => 
    item.binId.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    item.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => router.push({ 
          pathname: '/(tabs)/cleaner/collection-details', 
          params: { 
            collectionId: item.id,
            binId: item.binDocId || item.binId
          } 
        })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.type.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.binId}>Bin ID: {item.binId}</Text>
          <Text style={styles.wasteType}>{item.type}</Text>
          <Text style={styles.time}>Time: {item.time}</Text>
          {item.ownerName && (
            <Text style={styles.owner}>Customer: {item.ownerName}</Text>
          )}
          {item.weight && (
            <Text style={styles.weight}>{item.weight} kg</Text>
          )}
        </View>
        <View style={styles.historyRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.viewDetails}>View Details ›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>📭 No collections yet</Text>
      <Text style={styles.emptySubtext}>
        Your collection history will appear here after you scan and collect bins.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Bin ID..."
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['date', 'location', 'wasteType'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1).replace('Type', ' Type')}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Map View</Text>
          </TouchableOpacity>
        </ScrollView>

        <FlatList
          data={filteredCollections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.brand.green]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchInput: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    marginBottom: Spacing.lg,
  },
  filters: {
    marginBottom: Spacing.lg,
    flexGrow: 0,
  },
  filterBtn: {
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.line,
    marginRight: Spacing.sm,
  },
  filterBtnActive: {
    backgroundColor: Colors.brand.green,
    borderColor: Colors.brand.green,
  },
  filterText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.white,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  historyCard: {
    backgroundColor: Colors.bg.light,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.green,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  historyInfo: {
    flex: 1,
  },
  binId: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  wasteType: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  time: {
    fontSize: FontSizes.tiny,
    color: Colors.text.muted,
    marginTop: 2,
  },
  owner: {
    fontSize: FontSizes.tiny,
    color: Colors.brand.green,
    marginTop: 2,
    fontWeight: '500',
  },
  weight: {
    fontSize: FontSizes.tiny,
    color: Colors.text.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.card,
    marginBottom: 4,
  },
  statusText: {
    fontSize: FontSizes.tiny,
  },
  viewDetails: {
    fontSize: FontSizes.small,
    color: Colors.state.info,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
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
