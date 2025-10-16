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
    Alert,
    ActivityIndicator,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { paymentService } from '../../services/mockPaymentService';
import { getAuth } from '../../config/firebase';

const FormSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function PaymentDetailsScreen() {
  const router = useRouter();
  const { billId, amount, type } = useLocalSearchParams();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [cardholderName, setCardholderName] = useState('John Doe');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('26');
  const [cvv, setCvv] = useState('123');

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to make a payment');
      return;
    }

    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setProcessing(true);

    try {
      // Process the payment
      const paymentResult = await paymentService.processPayment(billId, {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryMonth,
        expiryYear,
        cvv,
        cardholderName,
        amount: parseFloat(amount),
      });

      if (paymentResult.success) {
        // Payment successful - navigate to success screen
        router.push({
          pathname: '/customer/payment-success',
          params: {
            paymentId: billId,
            amount: amount,
            type: type || 'bill',
            cardLast4: cardNumber.slice(-4),
          }
        });
      } else {
        // Payment failed
        Alert.alert('Payment Failed', paymentResult.error?.message || 'Payment could not be processed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred while processing your payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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
            value={cardNumber}
            onChangeText={(text) => setCardNumber(text.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
            keyboardType="numeric"
            maxLength={19}
            placeholderTextColor={Colors.text.muted}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Card Holder Name" 
            value={cardholderName}
            onChangeText={setCardholderName}
            autoCapitalize="words"
            placeholderTextColor={Colors.text.muted}
          />
          <View style={styles.row}>
            <TextInput 
              style={styles.inputHalf} 
              placeholder="Expiry Month (MM)"
              value={expiryMonth}
              onChangeText={setExpiryMonth}
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor={Colors.text.muted}
            />
            <TextInput 
              style={styles.inputHalf} 
              placeholder="Expiry Year (YY)"
              value={expiryYear}
              onChangeText={setExpiryYear}
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor={Colors.text.muted}
            />
          </View>
          <TextInput 
            style={styles.input} 
            placeholder="CVV"
            value={cvv}
            onChangeText={setCvv}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholderTextColor={Colors.text.muted}
          />
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
          style={[styles.payButton, styles.payBtnOutline, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={[styles.payButtonText, { color: Colors.primary }]}>Pay Now</Text>
          )}
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
  payButtonDisabled: {
    opacity: 0.6,
  },
});
