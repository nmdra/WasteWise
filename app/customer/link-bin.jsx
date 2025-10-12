import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { BIN_CATEGORIES, createBin } from '../../services/binService';

export default function CreateBinScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateBin = async () => {
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a bin category');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to create a bin');
      return;
    }

    setSaving(true);

    try {
      const result = await createBin({
        userId: user.uid,
        category: selectedCategory,
        description: description.trim(),
        location: location.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          `Bin QR code created successfully!\n\nBin ID: ${result.binCode}`,
          [
            {
              text: 'View QR Code',
              onPress: () => router.push(`/customer/qr?binId=${result.bin.id}`),
            },
            {
              text: 'Create Another',
              onPress: () => {
                setSelectedCategory(null);
                setDescription('');
                setLocation('');
              },
            },
            {
              text: 'View All Bins',
              onPress: () => router.push('/customer/bins'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create bin');
      }
    } catch (error) {
      console.error('Error creating bin:', error);
      Alert.alert('Error', 'Failed to create bin QR code');
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryCard = (categoryKey) => {
    const category = BIN_CATEGORIES[categoryKey];
    const isSelected = selectedCategory === categoryKey;

    return (
      <TouchableOpacity
        key={categoryKey}
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          { borderColor: category.color },
        ]}
        onPress={() => setSelectedCategory(categoryKey)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconBox, { backgroundColor: category.color }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Bin QR Code</Text>
        <Text style={styles.subtitle}>Select a category and create your bin QR code</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>💡</Text>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>How Bin QR Codes Work</Text>
            <Text style={styles.infoBannerText}>
              Each bin gets a unique QR code. Collectors scan it during pickup to log collections automatically.
            </Text>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Bin Category *</Text>
          <Text style={styles.sectionSubtitle}>Choose the type of waste for this bin</Text>

          {Object.keys(BIN_CATEGORIES).map(renderCategoryCard)}
        </View>

        {/* Description Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Add Description (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Add notes to help identify this bin (e.g., "Kitchen bin", "Front yard")
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Kitchen organic waste bin"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Location Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Add Location (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Specify where this bin is located (e.g., "Front porch", "Garage")
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Front porch near the gate"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (!selectedCategory || saving) && styles.createButtonDisabled]}
          onPress={handleCreateBin}
          disabled={!selectedCategory || saving}
        >
          <Text style={styles.createButtonText}>
            {saving ? 'Creating...' : 'Create Bin QR Code'}
          </Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>What happens next?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemIcon}>1️⃣</Text>
            <Text style={styles.infoItemText}>
              A unique ID will be generated for your bin
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemIcon}>2️⃣</Text>
            <Text style={styles.infoItemText}>
              You can view and print the QR code
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemIcon}>3️⃣</Text>
            <Text style={styles.infoItemText}>
              Attach it to your physical bin
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemIcon}>4️⃣</Text>
            <Text style={styles.infoItemText}>
              Collectors will scan it during pickup
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
  header: {
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  backButton: {
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoBannerIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  infoBannerText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  categoryCardSelected: {
    borderWidth: 3,
    backgroundColor: '#f0fdf4',
  },
  categoryIconBox: {
    width: 50,
    height: 50,
    borderRadius: Radii.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.state.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radii.card,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  createButtonDisabled: {
    backgroundColor: Colors.text.secondary,
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: FontSizes.body,
    color: '#fff',
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  infoSectionTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoItemIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  infoItemText: {
    flex: 1,
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
});
