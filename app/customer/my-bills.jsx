import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';

// Mock data for the list of bills
const billsData = [
  { id: 1, amount: '35.50', dueDate: '2024-07-15', period: 'June 2024 Waste Collection', status: 'Due' },
  { id: 2, amount: '42.75', dueDate: '2024-06-30', period: 'May 2024 Waste Collection', status: 'Overdue' },
  { id: 3, amount: '32.00', dueDate: '2024-06-10', period: 'April 2024 Waste Collection', status: 'Paid' },
  { id: 4, amount: '38.20', dueDate: '2024-05-25', period: 'March 2024 Waste Collection', status: 'Paid' },
  { id: 5, amount: '37.10', dueDate: '2024-08-01', period: 'July 2024 Waste Collection', status: 'Due' },
];

// Reusable component for each bill card
const BillCard = ({ bill, onPay, onViewDetails }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Due': return styles.statusDue;
      case 'Overdue': return styles.statusOverdue;
      case 'Paid': return styles.statusPaid;
      default: return {};
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.amount}>${bill.amount}</Text>
        <Text style={styles.dueDate}>Due: {bill.dueDate}</Text>
      </View>
      <View style={[styles.statusBadge, getStatusStyle(bill.status)]}>
        <Text style={styles.statusText}>{bill.status}</Text>
      </View>
      <Text style={styles.billingPeriod}>{bill.period}</Text>
      <View style={styles.buttonContainer}>
        {bill.status !== 'Paid' && (
          <>
            <TouchableOpacity style={styles.button} onPress={onViewDetails}>
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.payBtn]} onPress={onPay}>
              <Text style={[styles.buttonText, { color: Colors.primary }]}>Pay Bill</Text>
            </TouchableOpacity>
          </>
        )}
        {bill.status === 'Paid' && (
          <TouchableOpacity style={[styles.button, {width: '48%'}]} onPress={onViewDetails}>
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function MyBillsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {billsData.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill}
            onViewDetails={() => router.push({ pathname: '/customer/bill-details', params: { billId: bill.id } })}
            onPay={() => router.push({ pathname: '/customer/payment-details', params: { billId: bill.id, amount: bill.amount } })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { flex: 1, backgroundColor: Colors.bg.page, padding: Spacing.lg },
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
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radii.chip, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  statusDue: { backgroundColor: '#e7f3ff' },
  statusOverdue: { backgroundColor: '#fdecea' },
  statusPaid: { backgroundColor: Colors.brand.lightGreen },
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
