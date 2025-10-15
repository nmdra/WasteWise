/**
 * Payment Service Tests
 * 
 * Tests for payment processing, validation, and payment history
 */

import {
    detectCardType,
    formatCardNumber,
    processPayment,
    validateCardNumber,
    validateCVV,
    validateExpiryDate,
} from '../paymentService';

describe('Payment Service - Card Validation', () => {
  describe('detectCardType', () => {
    test('should detect Visa card', () => {
      expect(detectCardType('4242424242424242')).toBe('visa');
      expect(detectCardType('4111111111111111')).toBe('visa');
    });

    test('should detect Mastercard', () => {
      expect(detectCardType('5555555555554444')).toBe('mastercard');
      expect(detectCardType('5105105105105100')).toBe('mastercard');
    });

    test('should detect American Express', () => {
      expect(detectCardType('378282246310005')).toBe('amex');
      expect(detectCardType('371449635398431')).toBe('amex');
    });

    test('should detect Discover', () => {
      expect(detectCardType('6011111111111117')).toBe('discover');
      expect(detectCardType('6011000990139424')).toBe('discover');
    });

    test('should return unknown for invalid card', () => {
      expect(detectCardType('1234567890123456')).toBe('unknown');
      expect(detectCardType('9999999999999999')).toBe('unknown');
    });

    test('should handle card numbers with spaces', () => {
      expect(detectCardType('4242 4242 4242 4242')).toBe('visa');
      expect(detectCardType('5555 5555 5555 4444')).toBe('mastercard');
    });
  });

  describe('validateCardNumber', () => {
    test('should validate test card numbers', () => {
      expect(validateCardNumber('4242424242424242')).toBe(true);
      expect(validateCardNumber('5555555555554444')).toBe(true);
      expect(validateCardNumber('4000000000000002')).toBe(true);
    });

    test('should validate card numbers with spaces', () => {
      expect(validateCardNumber('4242 4242 4242 4242')).toBe(true);
    });

    test('should reject invalid card numbers', () => {
      expect(validateCardNumber('1234567890123456')).toBe(false);
      expect(validateCardNumber('9999999999999999')).toBe(false);
    });

    test('should reject cards with invalid length', () => {
      expect(validateCardNumber('42424242')).toBe(false);
      expect(validateCardNumber('42424242424242424242')).toBe(false);
    });

    test('should reject non-numeric cards', () => {
      expect(validateCardNumber('abcd1234efgh5678')).toBe(false);
      expect(validateCardNumber('4242-4242-4242-4242')).toBe(false);
    });
  });

  describe('validateExpiryDate', () => {
    test('should validate future expiry dates', () => {
      const futureYear = new Date().getFullYear() + 2;
      expect(validateExpiryDate('12', futureYear.toString())).toBe(true);
      expect(validateExpiryDate('06', (futureYear % 100).toString())).toBe(true);
    });

    test('should reject past expiry dates', () => {
      expect(validateExpiryDate('12', '2020')).toBe(false);
      expect(validateExpiryDate('01', '21')).toBe(false);
    });

    test('should reject invalid months', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(validateExpiryDate('00', futureYear.toString())).toBe(false);
      expect(validateExpiryDate('13', futureYear.toString())).toBe(false);
      expect(validateExpiryDate('99', futureYear.toString())).toBe(false);
    });

    test('should handle 2-digit and 4-digit years', () => {
      const futureYear = new Date().getFullYear() + 1;
      const twoDigitYear = (futureYear % 100).toString().padStart(2, '0');
      expect(validateExpiryDate('12', futureYear.toString())).toBe(true);
      expect(validateExpiryDate('12', twoDigitYear)).toBe(true);
    });
  });

  describe('validateCVV', () => {
    test('should validate 3-digit CVV for regular cards', () => {
      expect(validateCVV('123')).toBe(true);
      expect(validateCVV('999')).toBe(true);
    });

    test('should validate 4-digit CVV for Amex', () => {
      expect(validateCVV('1234', 'amex')).toBe(true);
      expect(validateCVV('9999', 'amex')).toBe(true);
    });

    test('should reject invalid CVV', () => {
      expect(validateCVV('12')).toBe(false);
      expect(validateCVV('12345')).toBe(false);
      expect(validateCVV('abc')).toBe(false);
      expect(validateCVV('')).toBe(false);
    });

    test('should reject wrong length CVV for card type', () => {
      expect(validateCVV('123', 'amex')).toBe(false);
      expect(validateCVV('1234', 'visa')).toBe(false);
    });
  });

  describe('formatCardNumber', () => {
    test('should format Visa/Mastercard with 4-digit groups', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
      expect(formatCardNumber('5555555555554444')).toBe('5555 5555 5555 4444');
    });

    test('should format Amex with 4-6-5 pattern', () => {
      expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    });

    test('should handle already formatted numbers', () => {
      expect(formatCardNumber('4242 4242 4242 4242')).toBe('4242 4242 4242 4242');
    });
  });
});

describe('Payment Service - Payment Processing', () => {
  describe('processPayment', () => {
    test('should successfully process valid payment', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'John Doe',
        amount: 100.00,
        currency: 'usd',
        description: 'Test Payment',
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent.status).toBe('succeeded');
      expect(result.paymentIntent.amount).toBe(10000); // Amount in cents
      expect(result.paymentIntent.payment_method.card.last4).toBe('4242');
    });

    test('should reject payment with invalid card number', async () => {
      const paymentData = {
        cardNumber: '1234567890123456',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'John Doe',
        amount: 100.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('card_declined');
      expect(result.error.message).toContain('invalid');
    });

    test('should reject payment with expired card', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2020',
        cvv: '123',
        cardholderName: 'John Doe',
        amount: 100.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('expired_card');
    });

    test('should reject payment with invalid CVV', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '12', // Too short
        cardholderName: 'John Doe',
        amount: 100.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('incorrect_cvc');
    });

    test('should reject payment with invalid cardholder name', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'A', // Too short
        amount: 100.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('invalid_name');
    });

    test('should handle declined test card', async () => {
      const paymentData = {
        cardNumber: '4000000000000002', // Test declined card
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'John Doe',
        amount: 100.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('card_declined');
    });

    test('should include correct payment intent details', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiryMonth: '06',
        expiryYear: '2026',
        cvv: '999',
        cardholderName: 'Jane Smith',
        amount: 250.50,
        currency: 'usd',
        description: 'Special Pickup Payment',
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.paymentIntent.currency).toBe('usd');
      expect(result.paymentIntent.description).toBe('Special Pickup Payment');
      expect(result.paymentIntent.payment_method.card.exp_month).toBe(6);
      expect(result.paymentIntent.payment_method.card.exp_year).toBe(2026);
    });

    test('should process payment with Mastercard', async () => {
      const paymentData = {
        cardNumber: '5555555555554444',
        expiryMonth: '03',
        expiryYear: '2027',
        cvv: '456',
        cardholderName: 'Bob Wilson',
        amount: 50.00,
      };

      const result = await processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.paymentIntent.payment_method.card.brand).toBe('mastercard');
      expect(result.paymentIntent.payment_method.card.last4).toBe('4444');
    });
  });
});

describe('Payment Service - Edge Cases', () => {
  test('should handle very small amounts', async () => {
    const paymentData = {
      cardNumber: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: 'John Doe',
      amount: 0.50, // 50 cents
    };

    const result = await processPayment(paymentData);

    expect(result.success).toBe(true);
    expect(result.paymentIntent.amount).toBe(50);
  });

  test('should handle large amounts', async () => {
    const paymentData = {
      cardNumber: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: 'John Doe',
      amount: 9999.99,
    };

    const result = await processPayment(paymentData);

    expect(result.success).toBe(true);
    expect(result.paymentIntent.amount).toBe(999999);
  });

  test('should handle card numbers with multiple spaces', async () => {
    const paymentData = {
      cardNumber: '4242  4242  4242  4242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: 'John Doe',
      amount: 100.00,
    };

    const result = await processPayment(paymentData);

    expect(result.success).toBe(true);
  });

  test('should handle names with special characters', async () => {
    const paymentData = {
      cardNumber: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: "O'Brien-Smith Jr.",
      amount: 100.00,
    };

    const result = await processPayment(paymentData);

    expect(result.success).toBe(true);
  });
});

describe('Payment Service - Performance', () => {
  test('should complete payment processing within reasonable time', async () => {
    const startTime = Date.now();
    
    const paymentData = {
      cardNumber: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: 'John Doe',
      amount: 100.00,
    };

    await processPayment(paymentData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Payment should complete within 3 seconds (includes 2s simulated delay)
    expect(duration).toBeLessThan(3000);
  });
});
