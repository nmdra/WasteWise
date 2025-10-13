import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';

const FormSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function PaymentDetailsScreen() {
  const router = useRouter();
  const { amount } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount Due</Text>
          <Text style={styles.amountValue}>$ {amount || '35.50'}</Text>
          <TextInput 
            style={styles.amountInput} 
            value={amount || '35.50'} 
            editable={false}
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        <FormSection title="Card Information">
          <TextInput 
            style={styles.input} 
            placeholder="Card Number" 
            defaultValue="**** **** **** 1234"
            placeholderTextColor={Colors.text.muted}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Card Holder Name" 
            defaultValue="John Doe"
            placeholderTextColor={Colors.text.muted}
          />
          <View style={styles.row}>
            <TextInput 
              style={styles.inputHalf} 
              placeholder="Expiry Date (MM/YY)"
              placeholderTextColor={Colors.text.muted}
            />
            <TextInput 
              style={styles.inputHalf} 
              placeholder="CVV"
              placeholderTextColor={Colors.text.muted}
            />
          </View>
        </FormSection>

        <FormSection title="Billing Address">
          <TextInput 
            style={styles.input} 
            placeholder="Address Line 1" 
            defaultValue="123 EcoLane"
            placeholderTextColor={Colors.text.muted}
          />
          <TextInput 
            style={styles.input} 
            placeholder="City" 
            defaultValue="Greenville"
            placeholderTextColor={Colors.text.muted}
          />
          <View style={styles.row}>
            <TextInput 
              style={styles.inputHalf} 
              placeholder="State" 
              defaultValue="CA"
              placeholderTextColor={Colors.text.muted}
            />
            <TextInput 
              style={styles.inputHalf} 
              placeholder="Zip Code" 
              defaultValue="90210"
              placeholderTextColor={Colors.text.muted}
            />
          </View>
        </FormSection>

        <TouchableOpacity 
          style={[styles.payButton, styles.payBtnOutline]}
          onPress={() => router.push('/customer/payment-success')}
        >
          <Text style={[styles.payButtonText, { color: Colors.primary }]}>Pay Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  amountBox: { 
    marginBottom: Spacing.xl, 
    backgroundColor: Colors.bg.card, 
    padding: Spacing.lg, 
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  amountLabel: { color: Colors.text.secondary, fontSize: FontSizes.small, marginBottom: Spacing.xs },
  amountValue: { fontSize: FontSizes.h1, fontWeight: 'bold', color: Colors.primary, marginBottom: Spacing.md },
  amountInput: { 
    borderWidth: 1, 
    borderColor: Colors.line, 
    borderRadius: Radii.btn, 
    padding: Spacing.md, 
    fontSize: FontSizes.body, 
    backgroundColor: Colors.bg.light,
    color: Colors.text.primary,
  },
  section: { 
    backgroundColor: Colors.bg.card, 
    padding: Spacing.lg, 
    borderRadius: Radii.card, 
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sectionTitle: { fontSize: FontSizes.h3, fontWeight: 'bold', marginBottom: Spacing.lg, color: Colors.text.primary },
  input: { 
    borderWidth: 1, 
    borderColor: Colors.line, 
    borderRadius: Radii.btn, 
    padding: Spacing.md, 
    fontSize: FontSizes.body, 
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bg.light,
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
    backgroundColor: Colors.bg.light,
    color: Colors.text.primary,
  },
  payButton: { 
    backgroundColor: Colors.primary, 
    padding: Spacing.lg, 
    borderRadius: Radii.btn, 
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  payButtonText: { color: Colors.text.white, fontSize: FontSizes.body, fontWeight: 'bold' },
});
