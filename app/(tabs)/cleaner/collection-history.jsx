import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../../constants/customerTheme';

const MOCK_HISTORY = [
  {
    id: 'ECO-B001',
    type: 'Recyclable Waste',
    time: '10:30 AM, Today',
    status: 'collected',
  },
  {
    id: 'ECO-B002',
    type: 'General Waste',
    time: '09:15 AM, Today',
    status: 'issue',
  },
  {
    id: 'ECO-B005',
    type: 'General Waste',
    time: '02:00 PM, Yesterday',
    status: 'pending',
  },
];

export default function CollectionHistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('date');

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

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => router.push({ pathname: '/(tabs)/cleaner/stop-details', params: { binId: item.id } })}
      >
        <View style={styles.avatar} />
        <View style={styles.historyInfo}>
          <Text style={styles.binId}>Bin ID: {item.id}</Text>
          <Text style={styles.wasteType}>{item.type}</Text>
          <Text style={styles.time}>Time: {item.time}</Text>
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
          data={MOCK_HISTORY}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
    backgroundColor: Colors.line,
    marginRight: Spacing.md,
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
});
