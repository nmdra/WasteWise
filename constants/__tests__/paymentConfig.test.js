/**
 * Payment Configuration Tests
 * 
 * Tests for payment calculations and waste type configurations
 */

import {
  SPECIAL_PICKUP_FEES,
  WASTE_TYPE_INFO,
  getWasteTypeInfo,
  calculateSpecialBookingFee,
  calculateMonthlyBill,
} from '../../constants/paymentConfig';

describe('Payment Config - Constants', () => {
  describe('SPECIAL_PICKUP_FEES', () => {
    test('should have fees for all waste types', () => {
      const wasteTypes = [
        'hazardous', 'electronic', 'bulky', 'organic',
        'plastic', 'paper', 'glass', 'metal', 'general'
      ];

      wasteTypes.forEach(type => {
        expect(SPECIAL_PICKUP_FEES[type]).toBeDefined();
        expect(typeof SPECIAL_PICKUP_FEES[type]).toBe('number');
        expect(SPECIAL_PICKUP_FEES[type]).toBeGreaterThan(0);
      });
    });

    test('should have consistent fee structure', () => {
      // Hazardous waste should be most expensive
      expect(SPECIAL_PICKUP_FEES.hazardous).toBeGreaterThan(SPECIAL_PICKUP_FEES.general);
      
      // Electronic should be more than general
      expect(SPECIAL_PICKUP_FEES.electronic).toBeGreaterThan(SPECIAL_PICKUP_FEES.general);
      
      // General should be least expensive
      const allFees = Object.values(SPECIAL_PICKUP_FEES);
      expect(SPECIAL_PICKUP_FEES.general).toBeLessThanOrEqual(Math.min(...allFees));
    });
  });

  describe('WASTE_TYPE_INFO', () => {
    test('should have info for all waste types', () => {
      const wasteTypes = [
        'hazardous', 'electronic', 'bulky', 'organic',
        'plastic', 'paper', 'glass', 'metal', 'general'
      ];

      wasteTypes.forEach(type => {
        const info = WASTE_TYPE_INFO[type];
        expect(info).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.icon).toBeDefined();
        expect(info.fee).toBeDefined();
        expect(typeof info.fee).toBe('number');
      });
    });

    test('should have consistent fee data with SPECIAL_PICKUP_FEES', () => {
      Object.keys(SPECIAL_PICKUP_FEES).forEach(type => {
        expect(WASTE_TYPE_INFO[type].fee).toBe(SPECIAL_PICKUP_FEES[type]);
      });
    });
  });
});

describe('Payment Config - getWasteTypeInfo', () => {
  test('should return correct info for valid waste types', () => {
    const hazardousInfo = getWasteTypeInfo('hazardous');
    expect(hazardousInfo).toBeDefined();
    expect(hazardousInfo.name).toBe('Hazardous');
    expect(hazardousInfo.fee).toBe(45);
  });

  test('should return info for all waste types', () => {
    const wasteTypes = [
      'hazardous', 'electronic', 'bulky', 'organic',
      'plastic', 'paper', 'glass', 'metal', 'general'
    ];

    wasteTypes.forEach(type => {
      const info = getWasteTypeInfo(type);
      expect(info).toBeDefined();
      expect(info.name).toBeTruthy();
      expect(info.icon).toBeTruthy();
      expect(info.fee).toBeGreaterThan(0);
    });
  });

  test('should return default for invalid waste type', () => {
    const invalidInfo = getWasteTypeInfo('invalid-type');
    expect(invalidInfo).toBeDefined();
    expect(invalidInfo.name).toBe('Unknown');
    expect(invalidInfo.icon).toBe('♻️');
    expect(invalidInfo.fee).toBe(0);
  });

  test('should handle null and undefined', () => {
    expect(getWasteTypeInfo(null)).toEqual({
      name: 'Unknown',
      icon: '♻️',
      fee: 0,
    });
    
    expect(getWasteTypeInfo(undefined)).toEqual({
      name: 'Unknown',
      icon: '♻️',
      fee: 0,
    });
  });
});

describe('Payment Config - calculateSpecialBookingFee', () => {
  test('should calculate fee for single waste type', () => {
    const result = calculateSpecialBookingFee(['hazardous']);
    
    expect(result.subtotal).toBe(45);
    expect(result.tax).toBe(3.6); // 8% of 45
    expect(result.total).toBe(48.6);
    expect(result.currency).toBe('USD');
  });

  test('should calculate fee for multiple waste types', () => {
    const result = calculateSpecialBookingFee(['hazardous', 'electronic', 'general']);
    
    const expectedSubtotal = 45 + 25 + 5; // 75
    const expectedTax = 75 * 0.08; // 6
    const expectedTotal = 81;
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.total).toBe(expectedTotal);
  });

  test('should return zero for empty array', () => {
    const result = calculateSpecialBookingFee([]);
    
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  test('should handle duplicate waste types', () => {
    const result = calculateSpecialBookingFee(['general', 'general', 'general']);
    
    const expectedSubtotal = 5 * 3; // 15
    const expectedTax = 15 * 0.08; // 1.2
    const expectedTotal = 16.2;
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.total).toBe(expectedTotal);
  });

  test('should include breakdown for each waste type', () => {
    const result = calculateSpecialBookingFee(['hazardous', 'electronic']);
    
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.length).toBe(2);
    
    const hazardousBreakdown = result.breakdown.find(b => b.type === 'hazardous');
    expect(hazardousBreakdown.fee).toBe(45);
    
    const electronicBreakdown = result.breakdown.find(b => b.type === 'electronic');
    expect(electronicBreakdown.fee).toBe(25);
  });

  test('should handle invalid waste types gracefully', () => {
    const result = calculateSpecialBookingFee(['invalid', 'hazardous']);
    
    // Should only count hazardous
    expect(result.subtotal).toBe(45);
    expect(result.breakdown.length).toBe(1);
  });

  test('should calculate correct tax rate', () => {
    const result = calculateSpecialBookingFee(['general']);
    
    expect(result.taxRate).toBe(0.08); // 8%
    expect(result.tax).toBe(result.subtotal * 0.08);
  });

  test('should handle all waste types combined', () => {
    const allTypes = [
      'hazardous', 'electronic', 'bulky', 'organic',
      'plastic', 'paper', 'glass', 'metal', 'general'
    ];
    
    const result = calculateSpecialBookingFee(allTypes);
    
    const expectedSubtotal = 45 + 25 + 35 + 15 + 10 + 8 + 12 + 18 + 5; // 173
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.breakdown.length).toBe(9);
    expect(result.total).toBeGreaterThan(result.subtotal);
  });
});

describe('Payment Config - calculateMonthlyBill', () => {
  test('should calculate bill for single month', () => {
    const result = calculateMonthlyBill(1);
    
    expect(result.subtotal).toBe(300);
    expect(result.tax).toBe(24); // 8% of 300
    expect(result.total).toBe(324);
    expect(result.currency).toBe('USD');
  });

  test('should calculate bill for multiple months', () => {
    const result = calculateMonthlyBill(3);
    
    const expectedSubtotal = 300 * 3; // 900
    const expectedTax = 900 * 0.08; // 72
    const expectedTotal = 972;
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.total).toBe(expectedTotal);
  });

  test('should include service fee breakdown', () => {
    const result = calculateMonthlyBill(1);
    
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.serviceFee).toBe(300);
    expect(result.breakdown.additionalServices).toBe(0);
  });

  test('should handle additional services', () => {
    const additionalServices = [
      { name: 'Extra Bin', fee: 50 },
      { name: 'Composting Service', fee: 30 },
    ];
    
    const result = calculateMonthlyBill(1, additionalServices);
    
    const expectedSubtotal = 300 + 50 + 30; // 380
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.breakdown.additionalServices).toBe(80);
  });

  test('should calculate correctly for 12 months', () => {
    const result = calculateMonthlyBill(12);
    
    const expectedSubtotal = 300 * 12; // 3600
    const expectedTax = 3600 * 0.08; // 288
    const expectedTotal = 3888;
    
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.total).toBe(expectedTotal);
  });

  test('should handle zero months', () => {
    const result = calculateMonthlyBill(0);
    
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  test('should handle negative months gracefully', () => {
    const result = calculateMonthlyBill(-1);
    
    // Should treat as 0
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('Payment Config - Tax Calculations', () => {
  test('should apply consistent 8% tax rate', () => {
    const testAmounts = [100, 250, 500, 1000];
    
    testAmounts.forEach(amount => {
      const expectedTax = amount * 0.08;
      // Test with special booking that equals the test amount
      const wasteTypes = [];
      let currentTotal = 0;
      
      // Find combination that matches test amount
      while (currentTotal < amount) {
        wasteTypes.push('general'); // $5 each
        currentTotal += 5;
      }
      
      const result = calculateSpecialBookingFee(wasteTypes);
      expect(result.tax).toBeCloseTo(result.subtotal * 0.08, 2);
    });
  });

  test('should round tax amounts correctly', () => {
    // Test amount that creates fractional tax
    const result = calculateSpecialBookingFee(['paper']); // $8
    
    expect(result.tax).toBe(0.64); // 8 * 0.08
    expect(Number.isFinite(result.tax)).toBe(true);
  });
});

describe('Payment Config - Currency Handling', () => {
  test('should always use USD currency', () => {
    const specialResult = calculateSpecialBookingFee(['general']);
    const monthlyResult = calculateMonthlyBill(1);
    
    expect(specialResult.currency).toBe('USD');
    expect(monthlyResult.currency).toBe('USD');
  });
});

describe('Payment Config - Edge Cases', () => {
  test('should handle very large waste type arrays', () => {
    const largeArray = Array(100).fill('general');
    const result = calculateSpecialBookingFee(largeArray);
    
    expect(result.subtotal).toBe(500); // 100 * $5
    expect(result.total).toBeGreaterThan(result.subtotal);
  });

  test('should handle mixed valid and invalid waste types', () => {
    const mixedTypes = ['hazardous', 'invalid', 'general', null, undefined, 'electronic'];
    const result = calculateSpecialBookingFee(mixedTypes);
    
    // Should only count valid types: hazardous, general, electronic
    expect(result.breakdown.length).toBe(3);
  });
});
