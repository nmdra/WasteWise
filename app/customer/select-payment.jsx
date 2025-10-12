import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';

const SavedMethod = ({ card, isSelected, onSelect }) => (
  <TouchableOpacity onPress={onSelect} style={[styles.card, isSelected && styles.selectedCard]}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={{fontSize: 24, marginRight: 15}}>💳</Text>
      <View>
        <Text style={styles.cardText}>{card.type} **** {card.last4}</Text>
        <Text style={styles.expireText}>Expires {card.expires}</Text>
      </View>
    </View>
    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
  </TouchableOpacity>
);

export default function SelectPaymentMethodScreen() {
  const router = useRouter();
  const { billId, amount } = useLocalSearchParams();
  const [selectedMethodId, setSelectedMethodId] = useState(1);
  
  const savedMethods = [
    { id: 1, type: 'Visa', last4: '1234', expires: '12/26' },
    { id: 2, type: 'Mastercard', last4: '5678', expires: '08/25' },
    { id: 3, type: 'Apple Pay', last4: 'Wallet', expires: '--/--' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>Saved Methods</Text>
        {savedMethods.map(method => (
          <SavedMethod
            key={method.id}
            card={method}
            isSelected={selectedMethodId === method.id}
            onSelect={() => setSelectedMethodId(method.id)}
          />
        ))}

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Add New Card</Text>
        <TextInput style={styles.input} placeholder="Card Number" placeholderTextColor={Colors.text.muted} />
        <View style={styles.row}>
          <TextInput style={styles.inputHalf} placeholder="MM/YY" placeholderTextColor={Colors.text.muted} />
          <TextInput style={styles.inputHalf} placeholder="CVV" placeholderTextColor={Colors.text.muted} />
        </View>
        <TextInput style={styles.input} placeholder="Country" placeholderTextColor={Colors.text.muted} />
        <TextInput style={styles.input} placeholder="Zip Code" placeholderTextColor={Colors.text.muted} />
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => router.push({ pathname: '/customer/payment-details', params: { billId, amount } })}
        >
          <Text style={styles.saveButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.h3, fontWeight: 'bold', marginBottom: Spacing.lg, color: Colors.text.primary },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: Colors.bg.card, 
    borderWidth: 1, 
    borderColor: Colors.line, 
    borderRadius: Radii.card, 
    padding: Spacing.lg, 
    marginBottom: Spacing.md,
  },
  selectedCard: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.brand.lightGreen },
  cardText: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.text.primary },
  expireText: { fontSize: FontSizes.small, color: Colors.text.secondary },
  checkIcon: { fontSize: 20, color: Colors.primary, fontWeight: 'bold' },
  input: { 
    borderWidth: 1, 
    borderColor: Colors.line, 
    borderRadius: Radii.btn, 
    padding: Spacing.md, 
    fontSize: FontSizes.body, 
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bg.card,
    color: Colors.text.primary,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputHalf: { 
    width: '48%', 
    borderWidth: 1, 
    borderColor: Colors.line, 
    borderRadius: Radii.btn, 
    padding: Spacing.md, 
    fontSize: FontSizes.body, 
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bg.card,
    color: Colors.text.primary,
  },
  footer: { padding: Spacing.lg, backgroundColor: Colors.bg.card, borderTopWidth: 1, borderTopColor: Colors.line },
  saveButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radii.btn, alignItems: 'center' },
  saveButtonText: { color: Colors.text.white, fontSize: FontSizes.body, fontWeight: 'bold' },
});
