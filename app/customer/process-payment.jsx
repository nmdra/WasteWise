import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '../../config/firebase';
import { paymentService } from '../../services/paymentService';
import { formatCurrency, calculateMonthlyBill, calculateSpecialBookingFee } from '../../constants/paymentConfig';
import CardInput from '../../components/CardInput';
import { createBooking } from '../../services/bookingService';

export default function ProcessPayment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [cardDetails, setCardDetails] = useState({});
  const [processing, setProcessing] = useState(false);

  const currentUser = auth.currentUser;
  const paymentType = params.paymentType;
  const billData = params.billData ? JSON.parse(params.billData) : null;
  const bookingData = params.bookingData ? JSON.parse(params.bookingData) : null;

  // Memoized callback to prevent CardInput re-renders
  const handleCardChange = useCallback((cardData) => {
    console.log('Received card data:', cardData);
    setCardDetails(cardData);
  }, []);

  const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const initializePayment = async () => {
    if (!currentUser) {
      showAlert('Error', 'Please log in to continue');
      return;
    }

    try {
      setLoading(true);

      let response;
      let calc;

      if (paymentType === 'monthly_bill' && billData) {
        calc = calculateMonthlyBill(billData.months || 1, billData.additionalServices || []);
        response = await paymentService.createMonthlyBillPayment({
          ...billData,
          customerId: currentUser.uid,
          customerEmail: currentUser.email,
        });
      } else if (paymentType === 'special_booking' && bookingData) {
        calc = calculateSpecialBookingFee(bookingData.wasteTypes || []);
        response = await paymentService.createSpecialBookingPayment({
          ...bookingData,
          customerId: currentUser.uid,
          customerEmail: currentUser.email,
          customerName: currentUser.displayName || currentUser.email,
        });
      } else {
        throw new Error('Invalid payment data');
      }

      if (response.success) {
        setPaymentData(response);
        setCalculation(calc);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      showAlert('Error', error.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData || !currentUser || !cardDetails.isValid) {
      showAlert('Error', 'Please fill in all card details correctly');
      return;
    }

    try {
      setProcessing(true);

      console.log('🔄 Processing payment with card details:', {
        cardType: cardDetails.cardType,
        last4: cardDetails.cardNumber.slice(-4),
        amount: calculation.total,
      });

      // Process payment with service
      const result = await paymentService.processPayment(paymentData.paymentId, {
        ...cardDetails,
        amount: calculation.total,
      });

      if (result.success) {
        // Show success message
        showAlert(
          'Payment Successful!',
          `Your payment of ${formatCurrency(calculation.total)} has been processed successfully.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                // For special booking payments, create the booking after successful payment
                if (paymentType === 'special_booking' && bookingData) {
                  try {
                    // Use the bookingId from the payment response
                    const bookingDataWithId = {
                      ...bookingData,
                      bookingId: paymentData.bookingId || `booking_${Date.now()}`,
                    };
                    
                    const bookingResult = await createBooking(bookingDataWithId);
                    if (bookingResult.success) {
                      router.push({
                        pathname: '/customer/payment-success',
                        params: {
                          paymentId: paymentData.paymentId,
                          amount: calculation.total,
                          type: paymentType,
                          bookingCreated: 'true',
                        },
                      });
                    } else {
                      // Payment succeeded but booking failed
                      showAlert('Warning', 'Payment was successful but there was an issue creating your booking. Please contact support.');
                      router.replace('/customer/payments');
                    }
                  } catch (error) {
                    console.error('Error creating booking after payment:', error);
                    showAlert('Warning', 'Payment was successful but there was an issue creating your booking. Please contact support.');
                    router.replace('/customer/payments');
                  }
                } else if (paymentType === 'monthly_bill') {
                  router.replace('/customer/payments');
                } else {
                  router.push({
                    pathname: '/customer/payment-success',
                    params: {
                      paymentId: paymentData.paymentId,
                      amount: calculation.total,
                      type: paymentType,
                    },
                  });
                }
              },
            },
          ]
        );
      } else {
        // Show error message
        showAlert('Payment Failed', result.error.message || 'Payment could not be processed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showAlert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const getPaymentTitle = () => {
    if (paymentType === 'monthly_bill') {
      return 'Monthly Service Payment';
    } else if (paymentType === 'special_booking') {
      return 'Special Pickup Payment';
    }
    return 'Payment';
  };

  const getPaymentDescription = () => {
    if (paymentType === 'monthly_bill' && billData) {
      const months = billData.months || 1;
      return `Payment for ${months} month${months > 1 ? 's' : ''} of WasteWise service`;
    } else if (paymentType === 'special_booking' && bookingData) {
      return `Special pickup service for: ${bookingData.wasteTypes?.join(', ') || 'selected waste types'}`;
    }
    return 'WasteWise service payment';
  };

  useEffect(() => {
    initializePayment();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!calculation || !paymentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to initialize payment</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getPaymentTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>

          <Text style={styles.description}>{getPaymentDescription()}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(calculation.subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(calculation.tax)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculation.total)}</Text>
          </View>

          {/* Breakdown for special bookings */}
          {paymentType === 'special_booking' && bookingData?.wasteTypes && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Fee Breakdown:</Text>
              {calculation.breakdown?.map((item, index) => (
                <View key={index} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{item.wasteType}:</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(item.fee)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Card Input */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <CardInput
            onCardChange={handleCardChange}
            disabled={processing}
          />
          
          {/* Debug Info - Remove this in production */}
          <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Debug: isValid = {cardDetails.isValid ? 'true' : 'false'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Card Number: {cardDetails.cardNumber || 'empty'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              CVV: {cardDetails.cvv || 'empty'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Name: {cardDetails.cardholderName || 'empty'}
            </Text>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!cardDetails.isValid || processing) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!cardDetails.isValid || processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.payButtonText}>
                Pay {formatCurrency(calculation.total)}
              </Text>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: '600',
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
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  breakdownContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  securityCard: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    fontSize: 14,
    color: '#2e7d32',
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});