import { useLocalSearchParams, useRouter } from 'expo-router';
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

const DetailRow = ({ label, value, valueStyle }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
);

const AccordionRow = ({ title }) => (
  <TouchableOpacity style={styles.accordionRow}>
    <Text style={styles.accordionTitle}>{title}</Text>
    <Text style={styles.accordionIcon}>⌄</Text>
  </TouchableOpacity>
);

export default function BillDetailsScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          <DetailRow label="Bill Number" value="EC-2024-03-001" />
          <DetailRow label="Service Period" value="March 01, 2024 - March 31, 2024" />
          <DetailRow label="Amount Due" value="$35.50" valueStyle={{fontWeight: 'bold', color: Colors.primary}} />
          <DetailRow label="Due Date" value="April 15, 2024" />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={styles.chargesBox}>
          <AccordionRow title="Waste Collection Fee" />
          <AccordionRow title="Recycling Surcharge" />
          <AccordionRow title="Environmental Tax" />
          <AccordionRow title="Service Charge" />
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, styles.payBtnOutline]}
          onPress={() => router.push({ pathname: '/customer/payment-details', params: { billId, amount: '35.50' } })}
        >
          <Text style={[styles.payButtonText, { color: Colors.primary }]}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { flex: 1, backgroundColor: Colors.bg.page, padding: Spacing.lg },
  summaryBox: { 
    backgroundColor: Colors.bg.card, 
    borderRadius: Radii.card, 
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  summaryTitle: { fontSize: FontSizes.h2, fontWeight: 'bold', marginBottom: Spacing.lg, color: Colors.text.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  detailLabel: { fontSize: FontSizes.body, color: Colors.text.secondary },
  detailValue: { fontSize: FontSizes.body, color: Colors.text.primary, textAlign: 'right' },
  pendingBadge: { backgroundColor: Colors.bg.light, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radii.chip },
  pendingText: { color: Colors.text.secondary, fontWeight: '500', fontSize: FontSizes.small },
  chargesBox: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  accordionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: Spacing.lg, 
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, 
    borderBottomColor: Colors.line,
  },
  accordionTitle: { fontSize: FontSizes.body, color: Colors.text.primary },
  accordionIcon: { fontSize: 20, color: Colors.text.secondary },
  footer: { padding: Spacing.lg, backgroundColor: Colors.bg.card, borderTopWidth: 1, borderTopColor: Colors.line },
  payButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radii.btn, alignItems: 'center' },
  payButtonText: { color: Colors.text.white, fontSize: FontSizes.body, fontWeight: 'bold' },
});
