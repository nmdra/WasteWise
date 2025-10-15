import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { detectCardType, formatCardNumber, validateCardNumber, validateExpiryDate, validateCVV } from '../services/paymentService';

const CardInput = ({ onCardChange, style, disabled = false }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardType, setCardType] = useState('unknown');

  // Simple validation and parent update
  useEffect(() => {
    const type = detectCardType(cardNumber);
    setCardType(type);

    if (onCardChange) {
      const cardValid = validateCardNumber(cardNumber);
      const expiryValid = validateExpiryDate(
        expiryDate.substring(0, 2),
        expiryDate.substring(3, 5)
      );
      const cvvValid = validateCVV(cvv, type);
      const nameValid = cardholderName.trim().length >= 2;
      const allValid = cardValid && expiryValid && cvvValid && nameValid;

      console.log('Card validation status:', {
        cardNumber: cardNumber,
        cardValid,
        expiryValid,
        cvvValid,
        nameValid,
        allValid
      });

      onCardChange({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryMonth: expiryDate.substring(0, 2),
        expiryYear: expiryDate.substring(3, 5),
        cvv,
        cardholderName,
        cardType: type,
        isValid: allValid,
      });
    }
  }, [cardNumber, expiryDate, cvv, cardholderName, onCardChange]);

  const handleCardNumberChange = (text) => {
    const numericText = text.replace(/\D/g, '');
    if (numericText.length <= 16) {
      const formatted = formatCardNumber(numericText);
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (text) => {
    let numericText = text.replace(/\D/g, '');
    if (numericText.length >= 2) {
      numericText = numericText.substring(0, 2) + '/' + numericText.substring(2, 4);
    }
    if (numericText.length <= 5) {
      setExpiryDate(numericText);
    }
  };

  const handleCvvChange = (text) => {
    const numericText = text.replace(/\D/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    if (numericText.length <= maxLength) {
      setCvv(numericText);
    }
  };

  const getCardIcon = () => {
    const iconMapping = {
      visa: { name: 'card', color: '#1A73E8' },
      mastercard: { name: 'card', color: '#EB001B' },
      amex: { name: 'card', color: '#006FCF' },
      discover: { name: 'card', color: '#FF6000' },
      unknown: { name: 'card-outline', color: '#666' },
    };
    
    const config = iconMapping[cardType] || iconMapping.unknown;
    return <Ionicons name={config.name} size={24} color={config.color} />;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Card Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Card Number</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.cardNumberInput]}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={19}
            editable={!disabled}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View style={styles.cardIcon}>
            {getCardIcon()}
          </View>
        </View>
      </View>

      {/* Expiry and CVV Row */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Expiry Date</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={handleExpiryChange}
              placeholder="MM/YY"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={5}
              editable={!disabled}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>CVV</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={handleCvvChange}
              placeholder={cardType === 'amex' ? '1234' : '123'}
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={cardType === 'amex' ? 4 : 3}
              secureTextEntry
              editable={!disabled}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      {/* Cardholder Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cardholder Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="John Doe"
            placeholderTextColor="#999"
            autoCapitalize="words"
            editable={!disabled}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Test Card Notice */}
      <View style={styles.testCardNotice}>
        <Ionicons name="information-circle" size={16} color="#4CAF50" />
        <Text style={styles.testCardText}>
          Use test card: 4242 4242 4242 4242
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  cardNumberInput: {
    letterSpacing: 1,
  },
  cardIcon: {
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  testCardNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  testCardText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default CardInput;