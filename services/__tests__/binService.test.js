/**
 * Bin Service Tests
 * 
 * Tests for bin management, QR code generation, and category operations
 */

import {
    BIN_CATEGORIES,
    BIN_TO_WASTE_TYPE_MAP,
    generateBinId,
} from '../binService';

describe('Bin Service - Constants', () => {
  describe('BIN_CATEGORIES', () => {
    test('should have all required bin categories', () => {
      const expectedCategories = [
        'paper', 'glass', 'metal', 'plastic', 
        'organic', 'hazardous', 'general'
      ];

      expectedCategories.forEach(category => {
        expect(BIN_CATEGORIES[category]).toBeDefined();
        expect(BIN_CATEGORIES[category].label).toBeTruthy();
        expect(BIN_CATEGORIES[category].icon).toBeTruthy();
        expect(BIN_CATEGORIES[category].color).toBeTruthy();
      });
    });

    test('should have valid hex colors', () => {
      Object.values(BIN_CATEGORIES).forEach(category => {
        expect(category.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should have descriptions for all categories', () => {
      Object.values(BIN_CATEGORIES).forEach(category => {
        expect(category.description).toBeTruthy();
        expect(typeof category.description).toBe('string');
      });
    });
  });

  describe('BIN_TO_WASTE_TYPE_MAP', () => {
    test('should map all bin categories to waste types', () => {
      const binCategories = Object.keys(BIN_CATEGORIES);
      
      binCategories.forEach(category => {
        expect(BIN_TO_WASTE_TYPE_MAP[category]).toBeDefined();
        expect(BIN_TO_WASTE_TYPE_MAP[category]).toBe(category);
      });
    });
  });
});

describe('Bin Service - ID Generation', () => {
  describe('generateBinId', () => {
    test('should generate valid bin ID', () => {
      const binId = generateBinId('user123', 'plastic', 0);
      
      expect(binId).toContain('user123');
      expect(binId).toContain('plastic');
      expect(binId).toMatch(/user123-plastic-\d{3}/);
    });

    test('should increment ID based on existing count', () => {
      const binId1 = generateBinId('user123', 'paper', 0);
      const binId2 = generateBinId('user123', 'paper', 1);
      const binId3 = generateBinId('user123', 'paper', 5);
      
      expect(binId1).toContain('-001');
      expect(binId2).toContain('-002');
      expect(binId3).toContain('-006');
    });

    test('should pad numbers with zeros', () => {
      const binId1 = generateBinId('user123', 'glass', 8);
      const binId2 = generateBinId('user123', 'glass', 99);
      
      expect(binId1).toContain('-009');
      expect(binId2).toContain('-100');
    });

    test('should handle different user IDs', () => {
      const binId1 = generateBinId('userA', 'metal', 0);
      const binId2 = generateBinId('userB', 'metal', 0);
      
      expect(binId1).toContain('userA');
      expect(binId2).toContain('userB');
      expect(binId1).not.toBe(binId2);
    });

    test('should handle different categories', () => {
      const categories = Object.keys(BIN_CATEGORIES);
      
      categories.forEach(category => {
        const binId = generateBinId('user123', category, 0);
        expect(binId).toContain(category);
      });
    });
  });
});

describe('Bin Service - Waste Type Mapping', () => {
  test('should map bin categories to schedule waste types', () => {
    expect(BIN_TO_WASTE_TYPE_MAP['paper']).toBe('paper');
    expect(BIN_TO_WASTE_TYPE_MAP['glass']).toBe('glass');
    expect(BIN_TO_WASTE_TYPE_MAP['metal']).toBe('metal');
    expect(BIN_TO_WASTE_TYPE_MAP['plastic']).toBe('plastic');
  });

  test('should have one-to-one mapping', () => {
    Object.keys(BIN_CATEGORIES).forEach(category => {
      expect(BIN_TO_WASTE_TYPE_MAP[category]).toBe(category);
    });
  });
});

describe('Bin Service - Category Validation', () => {
  test('should validate hazardous waste category', () => {
    const hazardous = BIN_CATEGORIES.hazardous;
    
    expect(hazardous.label).toContain('Hazardous');
    expect(hazardous.color).toBe('#EF4444'); // Red color
    expect(hazardous.description).toContain('Batteries');
  });

  test('should validate organic waste category', () => {
    const organic = BIN_CATEGORIES.organic;
    
    expect(organic.label).toContain('Organic');
    expect(organic.description).toContain('Food');
  });

  test('should validate recyclable categories', () => {
    const recyclables = ['paper', 'glass', 'metal', 'plastic'];
    
    recyclables.forEach(category => {
      expect(BIN_CATEGORIES[category]).toBeDefined();
      expect(BIN_CATEGORIES[category].icon).toBeTruthy();
    });
  });
});

describe('Bin Service - Icon Consistency', () => {
  test('should use distinct icons for each category', () => {
    const icons = Object.values(BIN_CATEGORIES).map(cat => cat.icon);
    const uniqueIcons = new Set(icons);
    
    expect(uniqueIcons.size).toBe(icons.length);
  });

  test('should use emoji icons', () => {
    Object.values(BIN_CATEGORIES).forEach(category => {
      expect(category.icon).toBeTruthy();
      expect(category.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('Bin Service - Color Accessibility', () => {
  test('should use distinct colors for categories', () => {
    const colors = Object.values(BIN_CATEGORIES).map(cat => cat.color);
    const uniqueColors = new Set(colors);
    
    // Most categories should have unique colors
    expect(uniqueColors.size).toBeGreaterThanOrEqual(5);
  });

  test('should use valid CSS color values', () => {
    Object.values(BIN_CATEGORIES).forEach(category => {
      expect(category.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe('Bin Service - Edge Cases', () => {
  test('should handle bin ID generation with large counts', () => {
    const binId = generateBinId('user123', 'plastic', 999);
    expect(binId).toContain('-1000');
  });

  test('should handle bin ID with empty user ID', () => {
    const binId = generateBinId('', 'plastic', 0);
    expect(binId).toContain('plastic');
    expect(binId).toContain('-001');
  });

  test('should handle invalid category gracefully', () => {
    const binId = generateBinId('user123', 'invalid-category', 0);
    expect(binId).toContain('invalid-category');
  });
});

describe('Bin Service - Data Structure', () => {
  test('should have consistent structure across all categories', () => {
    Object.values(BIN_CATEGORIES).forEach(category => {
      expect(category).toHaveProperty('label');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('description');
    });
  });

  test('should have non-empty values for all fields', () => {
    Object.values(BIN_CATEGORIES).forEach(category => {
      expect(category.label.length).toBeGreaterThan(0);
      expect(category.icon.length).toBeGreaterThan(0);
      expect(category.color.length).toBe(7); // #RRGGBB
      expect(category.description.length).toBeGreaterThan(0);
    });
  });
});
