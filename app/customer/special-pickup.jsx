import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebase';
import { calculateSpecialBookingFee, formatCurrency, getWasteTypeInfo } from '../../constants/paymentConfig';

const WASTE_TYPES = [
  'hazardous',
  'electronic',
  'bulky',
  'organic',
  'plastic',
  'paper',
  'glass',
  'metal',
  'general',
];

export default function SpecialPickup() {
  const router = useRouter();
  const [selectedWasteTypes, setSelectedWasteTypes] = useState([]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const currentUser = auth.currentUser;

  const toggleWasteType = (wasteType) => {
    setSelectedWasteTypes(prev => {
      if (prev.includes(wasteType)) {
        return prev.filter(type => type !== wasteType);
      } else {
        return [...prev, wasteType];
      }
    });
  };

  const handleSubmit = () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to continue');
      return;
    }

    if (selectedWasteTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one waste type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of your waste');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please provide your pickup address');
      return;
    }

    const calculation = calculateSpecialBookingFee(selectedWasteTypes);

    if (calculation.total > 0) {
      // Navigate to payment screen
      router.push({
        pathname: '/customer/process-payment',
        params: {
          paymentType: 'special_booking',
          bookingData: JSON.stringify({
            bookingId: `booking_${Date.now()}`,
            wasteTypes: selectedWasteTypes,
            description: description.trim(),
            address: address.trim(),
          }),
        },
      });
    } else {
      // Free pickup - process directly
      Alert.alert(
        'Booking Confirmed',
        'Your special pickup has been scheduled! No payment required.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const calculation = calculateSpecialBookingFee(selectedWasteTypes);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Special Pickup</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.description}>
            Schedule a special pickup for items that require separate collection.
            Select your waste types and we'll handle the rest.
          </Text>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trash" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Select Waste Types</Text>
          </View>

          <View style={styles.wasteTypesGrid}>
            {WASTE_TYPES.map((wasteType) => {
              const wasteInfo = getWasteTypeInfo(wasteType);
              const isSelected = selectedWasteTypes.includes(wasteType);

              return (
                <TouchableOpacity
                  key={wasteType}
                  style={[
                    styles.wasteTypeItem,
                    isSelected && styles.wasteTypeItemSelected,
                  ]}
                  onPress={() => toggleWasteType(wasteType)}
                >
                  <Text style={styles.wasteTypeIcon}>{wasteInfo.icon}</Text>
                  <Text
                    style={[
                      styles.wasteTypeName,
                      isSelected && styles.wasteTypeNameSelected,
                    ]}
                  >
                    {wasteInfo.name}
                  </Text>
                  <Text
                    style={[
                      styles.wasteTypeFee,
                      isSelected && styles.wasteTypeFeeSelected,
                    ]}
                  >
                    {formatCurrency(wasteInfo.fee)}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkMark}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Description</Text>
          </View>

          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your waste items (e.g., old refrigerator, electronics, etc.)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Address Input */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Pickup Address</Text>
          </View>

          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your pickup address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Cost Breakdown */}
        {selectedWasteTypes.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calculator" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Cost Breakdown</Text>
            </View>

            {calculation.breakdown.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {getWasteTypeInfo(item.wasteType).icon} {item.wasteType}:
                </Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(item.fee)}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculation.subtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%):</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculation.tax)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculation.total)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (selectedWasteTypes.length === 0 || !description.trim() || !address.trim()) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedWasteTypes.length === 0 || !description.trim() || !address.trim()}
        >
          <Ionicons name="calendar" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {calculation.total > 0
              ? `Continue to Payment (${formatCurrency(calculation.total)})`
              : 'Schedule Free Pickup'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wasteTypeItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  wasteTypeItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  wasteTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  wasteTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  wasteTypeNameSelected: {
    color: '#2E7D32',
  },
  wasteTypeFee: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  wasteTypeFeeSelected: {
    color: '#2E7D32',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});