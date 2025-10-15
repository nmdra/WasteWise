import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { mockPaymentService } from '../../services/mockPaymentService';
import { formatCurrency, calculateMonthlyBill } from '../../constants/paymentConfig';

export default function Payments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonthStatus, setCurrentMonthStatus] = useState(null);
  const [outstandingBalance, setOutstandingBalance] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(1);

  const currentUser = auth.currentUser;

  const loadPaymentData = async () => {
    if (!currentUser) return;

    try {
      const [monthStatus, balance, payments] = await Promise.all([
        mockPaymentService.getCurrentMonthPaymentStatus(currentUser.uid),
        mockPaymentService.getOutstandingBalance(currentUser.uid),
        mockPaymentService.getCustomerPayments(currentUser.uid),
      ]);

      setCurrentMonthStatus(monthStatus);
      setOutstandingBalance(balance);
      setRecentPayments(payments.slice(0, 5)); // Show only recent 5
    } catch (error) {
      console.error('Error loading payment data:', error);
      Alert.alert('Error', 'Failed to load payment information');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
  };

  const handlePayMonthlyBill = async () => {
    try {
      const calculation = calculateMonthlyBill(selectedMonths);
      
      router.push({
        pathname: '/customer/process-payment',
        params: {
          paymentType: 'monthly_bill',
          billData: JSON.stringify({
            months: selectedMonths,
            additionalServices: [],
          }),
        },
      });
    } catch (error) {
      console.error('Error initiating monthly bill payment:', error);
      Alert.alert('Error', 'Failed to start payment process');
    }
  };

  const handleViewPaymentHistory = () => {
    router.push('/customer/payment-history');
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      loadPaymentData().finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading payment information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const monthlyCalculation = calculateMonthlyBill(selectedMonths);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payments</Text>
          <TouchableOpacity onPress={handleViewPaymentHistory}>
            <Ionicons name="list" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Current Month Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Current Month</Text>
          </View>

          {currentMonthStatus?.isPaid ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>Paid</Text>
                <Text style={styles.statusSubtitle}>
                  Your monthly bill is up to date
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Ionicons name="alert-circle" size={32} color="#FF9800" />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>Payment Due</Text>
                <Text style={styles.statusSubtitle}>
                  Monthly service payment required
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Outstanding Balance */}
        {outstandingBalance && outstandingBalance.totalOutstanding > 0 && (
          <View style={[styles.card, styles.balanceCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={24} color="#F44336" />
              <Text style={styles.cardTitle}>Outstanding Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {formatCurrency(outstandingBalance.totalOutstanding)}
            </Text>
            <Text style={styles.balanceCount}>
              {outstandingBalance.paymentsCount} pending payment{outstandingBalance.paymentsCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Monthly Bill Payment */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Pay Monthly Bill</Text>
          </View>

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <Text style={styles.monthLabel}>Select months to pay:</Text>
            <View style={styles.monthOptions}>
              {[1, 3, 6, 12].map((months) => (
                <TouchableOpacity
                  key={months}
                  style={[
                    styles.monthOption,
                    selectedMonths === months && styles.monthOptionSelected,
                  ]}
                  onPress={() => setSelectedMonths(months)}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      selectedMonths === months && styles.monthOptionTextSelected,
                    ]}
                  >
                    {months} {months === 1 ? 'Month' : 'Months'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Fee:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(monthlyCalculation.baseAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%):</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(monthlyCalculation.tax)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(monthlyCalculation.total)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.payButton} onPress={handlePayMonthlyBill}>
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.payButtonText}>
              Pay {formatCurrency(monthlyCalculation.total)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Recent Payments</Text>
            </View>

            {recentPayments.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentItem}
                onPress={() =>
                  router.push({
                    pathname: '/customer/payment-details',
                    params: { paymentId: payment.id },
                  })
                }
              >
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={getPaymentStatusIcon(payment.status)}
                    size={24}
                    color={getPaymentStatusColor(payment.status)}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    {payment.type === 'monthly_bill' ? 'Monthly Service' : 'Special Pickup'}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {payment.createdAt?.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentPrice}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.paymentStatus,
                      { color: getPaymentStatusColor(payment.status) },
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewPaymentHistory}
            >
              <Text style={styles.viewAllText}>View All Payments</Text>
              <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
  balanceCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  monthSelector: {
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  monthOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  monthOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  monthOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  monthOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
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
  payButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
});