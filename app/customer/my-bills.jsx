import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    Alert,
} from 'react-native';
import { getAuth } from '../../config/firebase';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { paymentService } from '../../services/mockPaymentService';

// Reusable component for each bill card
const BillCard = ({ bill, onPay, onViewDetails }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return styles.statusPaid;
      case 'Due': return styles.statusDue;
      case 'Failed': return styles.statusFailed;
      case 'Overdue': return styles.statusOverdue;
      default: return {};
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.amount}>${bill.amount}</Text>
        <Text style={styles.dueDate}>Due: {bill.dueDate}</Text>
      </View>
      <Text style={[styles.statusBadge, getStatusStyle(bill.status)]}>
        {bill.status}
      </Text>
      <Text style={styles.billingPeriod}>{bill.period}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onViewDetails}>
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
        {bill.status !== 'Paid' && (
          <TouchableOpacity style={[styles.button, styles.payBtn]} onPress={onPay}>
            <Text style={[styles.buttonText, { color: Colors.primary }]}>Pay Bill</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function MyBillsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  const loadBills = async () => {
    try {
      if (!user) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      console.log('Loading bills for user:', user.uid);
      
      // Get all customer payments
      const payments = await paymentService.getCustomerPayments(user.uid);
      
      // Get outstanding balance
      const balanceInfo = await paymentService.getOutstandingBalance(user.uid);
      setOutstandingBalance(balanceInfo.totalOutstanding);

      // Transform payments into bill format
      const billsData = payments.map(payment => ({
        id: payment.id,
        amount: payment.amount?.toFixed(2) || '0.00',
        dueDate: payment.createdAt ? formatDate(payment.createdAt) : 'Not set',
        period: getPeriodLabel(payment),
        status: getStatusLabel(payment.status),
        paymentData: payment,
      }));

      setBills(billsData);
      console.log('Loaded', billsData.length, 'bills');
    } catch (error) {
      console.error('Error loading bills:', error);
      Alert.alert('Error', 'Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPeriodLabel = (payment) => {
    if (payment.type === 'monthly_bill') {
      if (payment.months === 1) {
        return payment.createdAt ? 
          new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
          'Current Month';
      }
      return `${payment.months} Months Service`;
    } else if (payment.type === 'special_booking') {
      return 'Special Pickup';
    }
    return 'Service Payment';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Paid';
      case 'pending': return 'Due';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  useEffect(() => {
    loadBills();
  }, []);

  // Refresh bills when screen comes into focus (e.g., after payment)
  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [])
  );

  const handlePayBill = (bill) => {
    if (bill.status === 'Paid') return;
    
    router.push({
      pathname: '/customer/payment-details',
      params: { 
        billId: bill.id, 
        amount: bill.amount,
        type: bill.paymentData?.type || 'bill'
      }
    });
  };

  const handleViewDetails = (bill) => {
    router.push({
      pathname: '/customer/bill-details',
      params: { billId: bill.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader userName="Customer" userRole="customer" />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading your bills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      
      {/* Outstanding Balance Summary */}
      {outstandingBalance > 0 && (
        <View style={styles.balanceSummary}>
          <Text style={styles.balanceTitle}>Outstanding Balance</Text>
          <Text style={styles.balanceAmount}>${outstandingBalance.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.payAllButton}
            onPress={() => router.push('/customer/payments')}
          >
            <Text style={styles.payAllText}>Pay All Bills</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {bills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Bills Found</Text>
            <Text style={styles.emptyText}>
              You don't have any billing history yet.
            </Text>
          </View>
        ) : (
          bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onViewDetails={() => handleViewDetails(bill)}
              onPay={() => handlePayBill(bill)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { flex: 1, backgroundColor: Colors.bg.page, padding: Spacing.lg },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
  },
  balanceSummary: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: FontSizes.small,
    color: Colors.text.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.text.white,
    marginBottom: Spacing.md,
  },
  payAllButton: {
    backgroundColor: Colors.text.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.btn,
  },
  payAllText: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  card: { 
    backgroundColor: Colors.bg.card, 
    borderRadius: Radii.card, 
    padding: Spacing.lg, 
    marginBottom: Spacing.lg, 
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  amount: { fontSize: FontSizes.h2, fontWeight: 'bold', color: Colors.text.primary },
  dueDate: { fontSize: FontSizes.small, color: Colors.text.secondary },
  statusBadge: { 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 4, 
    borderRadius: Radii.chip, 
    alignSelf: 'flex-start', 
    marginBottom: Spacing.sm 
  },
  statusDue: { backgroundColor: '#e7f3ff' },
  statusOverdue: { backgroundColor: '#fdecea' },
  statusPaid: { backgroundColor: Colors.brand.lightGreen },
  statusFailed: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: FontSizes.small, fontWeight: '500', color: Colors.text.primary },
  billingPeriod: { fontSize: FontSizes.body, color: Colors.text.secondary, marginBottom: Spacing.lg },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-start', gap: Spacing.sm },
  button: { 
    backgroundColor: Colors.bg.card, 
    paddingVertical: Spacing.md, 
    paddingHorizontal: Spacing.lg, 
    borderRadius: Radii.btn,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  payBtn: {
    backgroundColor: Colors.bg.card,
    borderColor: Colors.primary,
  },
  buttonText: { color: Colors.text.primary, fontWeight: '600', fontSize: FontSizes.body },
});
