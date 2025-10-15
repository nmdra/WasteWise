import { addDoc, collection, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateMonthlyBill, calculateSpecialBookingFee } from '../constants/paymentConfig';

/**
 * Payment Service for WasteWise
 * Simulates payment processing without external APIs
 */

// Valid test card numbers
const VALID_TEST_CARDS = {
  '4242424242424242': { type: 'visa', brand: 'Visa' },
  '5555555555554444': { type: 'mastercard', brand: 'Mastercard' },
  '4000000000000002': { type: 'visa', brand: 'Visa' },
  '4000000000009995': { type: 'visa', brand: 'Visa' },
};

// Card type detection patterns
const CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
};

/**
 * Detect card type from card number
 * @param {string} cardNumber - Card number (with or without spaces)
 * @returns {string} - Card type
 */
export const detectCardType = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(cleanNumber)) {
      return type;
    }
  }
  
  return 'unknown';
};

/**
 * Validate card number using Luhn algorithm
 * @param {string} cardNumber - Card number
 * @returns {boolean} - Is valid
 */
export const validateCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Check if it's a valid test card
  if (VALID_TEST_CARDS[cleanNumber]) {
    return true;
  }
  
  // Basic length and numeric validation
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cleanNumber.charAt(i), 10);
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate expiry date
 * @param {string} expiryMonth - MM format
 * @param {string} expiryYear - YY or YYYY format
 * @returns {boolean} - Is valid
 */
export const validateExpiryDate = (expiryMonth, expiryYear) => {
  const month = parseInt(expiryMonth, 10);
  let year = parseInt(expiryYear, 10);
  
  if (year < 100) {
    year += 2000;
  }
  
  if (month < 1 || month > 12) {
    return false;
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
};

/**
 * Validate CVV
 * @param {string} cvv - CVV code
 * @param {string} cardType - Card type
 * @returns {boolean} - Is valid
 */
export const validateCVV = (cvv, cardType = '') => {
  if (!cvv) return false;
  
  const cvvLength = cardType === 'amex' ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === cvvLength;
};

/**
 * Format card number with spaces
 * @param {string} cardNumber - Raw card number
 * @returns {string} - Formatted card number
 */
export const formatCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  const cardType = detectCardType(cardNumber);
  
  if (cardType === 'amex') {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  } else {
    return cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
  }
};

/**
 * Process payment
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - Payment result
 */
export const processPayment = async (paymentData) => {
  const {
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    cardholderName,
    amount,
    currency = 'usd',
    description = 'WasteWise Payment',
  } = paymentData;

  console.log('🔄 Processing payment:', { amount, currency, description });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Validate card details
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  
  if (!validateCardNumber(cleanCardNumber)) {
    return {
      success: false,
      error: {
        code: 'card_declined',
        message: 'Your card number is invalid.',
        type: 'card_error',
      },
    };
  }

  if (!validateExpiryDate(expiryMonth, expiryYear)) {
    return {
      success: false,
      error: {
        code: 'expired_card',
        message: 'Your card has expired.',
        type: 'card_error',
      },
    };
  }

  const cardType = detectCardType(cleanCardNumber);
  if (!validateCVV(cvv, cardType)) {
    return {
      success: false,
      error: {
        code: 'incorrect_cvc',
        message: 'Your card security code is invalid.',
        type: 'card_error',
      },
    };
  }

  if (!cardholderName || cardholderName.trim().length < 2) {
    return {
      success: false,
      error: {
        code: 'invalid_name',
        message: 'Please enter a valid cardholder name.',
        type: 'validation_error',
      },
    };
  }

  // Check for specific test scenarios
  if (cleanCardNumber === '4000000000000002') {
    return {
      success: false,
      error: {
        code: 'card_declined',
        message: 'Your card was declined.',
        type: 'card_error',
      },
    };
  }

  // Successful payment
  const cardInfo = VALID_TEST_CARDS[cleanCardNumber] || { type: cardType, brand: cardType };
  
  return {
    success: true,
    paymentIntent: {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      payment_method: {
        card: {
          brand: cardInfo.brand.toLowerCase(),
          last4: cleanCardNumber.slice(-4),
          exp_month: parseInt(expiryMonth, 10),
          exp_year: parseInt(expiryYear, 10),
        },
      },
    },
  };
};

export const paymentService = {
  /**
   * Create a payment intent for monthly bill
   * @param {Object} billData - Bill information
   * @returns {Promise<Object>} - Payment intent details
   */
  async createMonthlyBillPayment(billData) {
    try {
      const { months = 1, customerId, customerEmail, additionalServices = [] } = billData;
      
      const calculation = calculateMonthlyBill(months, additionalServices);

      console.log('🔄 Creating monthly bill payment');

      // Store payment record in Firebase
      const paymentRecord = {
        type: 'monthly_bill',
        customerId,
        customerEmail,
        amount: calculation.total,
        currency: calculation.currency || 'USD',
        months,
        calculation,
        status: 'pending',
        isTestPayment: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const paymentRef = await addDoc(collection(db, 'payments'), paymentRecord);

      return {
        success: true,
        paymentId: paymentRef.id,
        calculation,
        isTestPayment: true,
      };
    } catch (error) {
      console.error('Error creating monthly bill payment:', error);
      throw error;
    }
  },

  /**
   * Create a payment intent for special booking
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} - Payment intent details
   */
  async createSpecialBookingPayment(bookingData) {
    try {
      const { bookingId, wasteTypes, customerId, customerEmail, customerName } = bookingData;
      
      const calculation = calculateSpecialBookingFee(wasteTypes);
      
      if (calculation.total <= 0) {
        throw new Error('No payment required for this booking');
      }

      console.log('🔄 Creating special booking payment');

      // Store payment record in Firebase
      const paymentRecord = {
        type: 'special_booking',
        bookingId,
        customerId,
        customerEmail,
        customerName,
        wasteTypes,
        amount: calculation.total,
        currency: calculation.currency || 'USD',
        calculation,
        status: 'pending',
        isTestPayment: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const paymentRef = await addDoc(collection(db, 'payments'), paymentRecord);

      return {
        success: true,
        paymentId: paymentRef.id,
        calculation,
        isTestPayment: true,
      };
    } catch (error) {
      console.error('Error creating special booking payment:', error);
      throw error;
    }
  },

  /**
   * Process payment with card details
   * @param {string} paymentId - Payment document ID
   * @param {Object} cardDetails - Card information
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentId, cardDetails) {
    try {
      // Get payment record
      const paymentDoc = await doc(db, 'payments', paymentId);
      
      // Process payment
      const result = await processPayment({
        ...cardDetails,
        amount: cardDetails.amount || 0,
        description: `WasteWise Payment - ${paymentId}`,
      });

      if (result.success) {
        // Update payment record
        await updateDoc(paymentDoc, {
          status: 'completed',
          paymentMethod: `${result.paymentIntent.payment_method.card.brand} •••• ${result.paymentIntent.payment_method.card.last4}`,
          paymentIntentId: result.paymentIntent.id,
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log('✅ Payment completed successfully');
      } else {
        // Update payment record with failure
        await updateDoc(paymentDoc, {
          status: 'failed',
          error: result.error,
          updatedAt: Timestamp.now(),
        });

        console.log('❌ Payment failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  /**
   * Update payment status
   * @param {string} paymentId - Payment document ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to store
   */
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      
      const updateData = {
        status,
        updatedAt: Timestamp.now(),
        ...additionalData,
      };

      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(paymentRef, updateData);

      console.log(`Payment ${paymentId} status updated to: ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * Get customer payment history
   * @param {string} customerId - Customer user ID
   * @returns {Promise<Array>} - Payment records
   */
  async getCustomerPayments(customerId) {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const payments = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        });
      });

      return payments;
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      throw error;
    }
  },

  /**
   * Get pending payments for a customer
   * @param {string} customerId - Customer user ID
   * @returns {Promise<Array>} - Pending payment records
   */
  async getPendingPayments(customerId) {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('customerId', '==', customerId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const payments = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return payments;
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  },

  /**
   * Get customer's current month payment status
   * @param {string} customerId - Customer user ID
   * @returns {Promise<Object>} - Current month payment info
   */
  async getCurrentMonthPaymentStatus(customerId) {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('customerId', '==', customerId),
        where('type', '==', 'monthly_bill'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        where('createdAt', '<=', Timestamp.fromDate(endOfMonth))
      );

      const querySnapshot = await getDocs(q);
      const payments = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        });
      });

      const completedPayment = payments.find(p => p.status === 'completed');
      const pendingPayment = payments.find(p => p.status === 'pending');

      return {
        isPaid: !!completedPayment,
        hasPending: !!pendingPayment,
        completedPayment,
        pendingPayment,
        payments,
      };
    } catch (error) {
      console.error('Error checking current month payment status:', error);
      throw error;
    }
  },

  /**
   * Calculate and get customer's outstanding balance
   * @param {string} customerId - Customer user ID
   * @returns {Promise<Object>} - Outstanding balance info
   */
  async getOutstandingBalance(customerId) {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('customerId', '==', customerId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      let totalOutstanding = 0;
      const outstandingPayments = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const payment = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
        
        totalOutstanding += payment.amount || 0;
        outstandingPayments.push(payment);
      });

      return {
        totalOutstanding,
        paymentsCount: outstandingPayments.length,
        payments: outstandingPayments,
      };
    } catch (error) {
      console.error('Error calculating outstanding balance:', error);
      throw error;
    }
  },
};

export default paymentService;