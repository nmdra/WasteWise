import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/app-header';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { formatCurrency } from '../../constants/paymentConfig';

const ActionButton = ({ title, icon, onPress, secondary }) => (
  <TouchableOpacity style={[styles.button, secondary ? styles.buttonOutline : styles.button]} onPress={onPress}>
    <Ionicons name={icon} size={20} color={secondary ? Colors.primary : Colors.text.white} />
    <Text style={[styles.buttonText, secondary ? styles.buttonTextOutline : null]}>{title}</Text>
  </TouchableOpacity>
);

export default function PaymentSuccessfulScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { paymentId, amount, type, cardLast4, bookingCreated } = params;

  const getSuccessMessage = () => {
    if (type === 'monthly_bill') {
      return 'Your monthly bill payment has been processed successfully.';
    } else if (type === 'special_booking') {
      if (bookingCreated === 'true') {
        return 'Your special pickup payment has been processed and your booking has been created successfully.';
      }
      return 'Your special pickup booking payment has been confirmed.';
    }
    return 'Your payment has been processed successfully.';
  };

  const getNavigationTitle = () => {
    if (type === 'monthly_bill') {
      return 'View Bills';
    } else if (type === 'special_booking') {
      return 'My Bookings';
    }
    return 'Back to Home';
  };

  const getNavigationPath = () => {
    if (type === 'monthly_bill') {
      return '/customer/payments';
    } else if (type === 'special_booking') {
      return '/customer/my-bookings';
    }
    return '/customer/home';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader userName="Customer" userRole="customer" />
      <View style={styles.container}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.mainText}>Payment Confirmed Successfully!</Text>
        <Text style={styles.subText}>{getSuccessMessage()}</Text>

        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{paymentId || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {cardLast4 ? `**** **** **** ${cardLast4}` : 'Test Card'}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={[styles.detailLabel, {fontWeight: 'bold'}]}>Total Paid:</Text>
            <Text style={[styles.detailValue, {fontWeight: 'bold', fontSize: FontSizes.h3, color: Colors.primary}]}>
              {amount ? formatCurrency(parseFloat(amount)) : '$0.00'}
            </Text>
          </View>
        </View>

        <ActionButton 
          title="Download Receipt" 
          icon="download" 
          onPress={() => {
            // Mock download functionality
            alert('Receipt downloaded successfully!');
          }} 
        />
        <ActionButton 
          title="Share Receipt" 
          icon="share" 
          onPress={() => {
            // Mock share functionality
            alert('Receipt shared successfully!');
          }} 
        />
        <ActionButton 
          title={getNavigationTitle()} 
          icon="document-text" 
          secondary 
          onPress={() => router.push(getNavigationPath())} 
        />
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.push('/customer/home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg.page },
  container: { flex: 1, alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.bg.page },
  checkCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 3, 
    borderColor: Colors.primary, 
    backgroundColor: Colors.brand.lightGreen,
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: Spacing.xxl, 
    marginBottom: Spacing.lg,
  },
  checkMark: { fontSize: 40, color: Colors.primary, fontWeight: 'bold' },
  mainText: { fontSize: FontSizes.h2, fontWeight: 'bold', color: Colors.text.primary, marginBottom: Spacing.xs },
  subText: { fontSize: FontSizes.body, color: Colors.text.secondary, marginBottom: Spacing.xl },
  detailsBox: { 
    backgroundColor: Colors.bg.card, 
    width: '100%', 
    borderRadius: Radii.card, 
    padding: Spacing.lg, 
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  detailsTitle: { fontSize: FontSizes.h3, fontWeight: 'bold', marginBottom: Spacing.lg, color: Colors.text.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  detailLabel: { color: Colors.text.secondary, fontSize: FontSizes.body },
  detailValue: { color: Colors.text.primary, fontSize: FontSizes.body, fontWeight: '500' },
  totalRow: { paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.line, marginTop: Spacing.sm },
  button: { 
    flexDirection: 'row', 
    backgroundColor: Colors.primary, 
    width: '100%', 
    padding: Spacing.lg, 
    borderRadius: Radii.btn, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: Spacing.md,
  },
  buttonOutline: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonIcon: { 
    color: Colors.text.white, 
    marginRight: Spacing.sm, 
    fontSize: FontSizes.body 
  },
  buttonIconOutline: { 
    color: Colors.primary, 
    marginRight: Spacing.sm, 
    fontSize: FontSizes.body 
  },
  buttonText: { 
    color: Colors.text.white, 
    fontSize: FontSizes.body, 
    fontWeight: 'bold',
    marginLeft: Spacing.sm 
  },
  buttonTextOutline: { 
    color: Colors.primary, 
    fontSize: FontSizes.body, 
    fontWeight: 'bold',
    marginLeft: Spacing.sm 
  },
  buttonTextSecondary: { color: Colors.text.primary },
  homeButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  homeButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    textDecorationLine: 'underline',
  },
});
