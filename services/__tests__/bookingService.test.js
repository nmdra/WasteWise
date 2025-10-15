/**
 * Booking Service Tests
 * 
 * Tests for booking creation, status updates, and booking management
 */

import {
    formatDateRange,
    getStatusColor,
    getStatusIcon,
    isDateInRange,
} from '../bookingService';

describe('Booking Service - Date Utilities', () => {
  describe('formatDateRange', () => {
    test('should format date range correctly', () => {
      const dateRange = {
        start: '2024-01-15',
        end: '2024-01-20',
      };
      
      const result = formatDateRange(dateRange);
      expect(result).toContain('Jan 15');
      expect(result).toContain('Jan 20');
      expect(result).toContain('2024');
    });

    test('should handle dates in different months', () => {
      const dateRange = {
        start: '2024-01-25',
        end: '2024-02-05',
      };
      
      const result = formatDateRange(dateRange);
      expect(result).toContain('Jan 25');
      expect(result).toContain('Feb 5');
    });

    test('should return N/A for invalid date range', () => {
      expect(formatDateRange(null)).toBe('N/A');
      expect(formatDateRange({})).toBe('N/A');
      expect(formatDateRange({ start: '2024-01-15' })).toBe('N/A');
      expect(formatDateRange({ end: '2024-01-20' })).toBe('N/A');
    });

    test('should handle single day range', () => {
      const dateRange = {
        start: '2024-03-15',
        end: '2024-03-15',
      };
      
      const result = formatDateRange(dateRange);
      expect(result).toContain('Mar 15');
    });
  });

  describe('isDateInRange', () => {
    const dateRange = {
      start: '2024-01-10',
      end: '2024-01-20',
    };

    test('should return true for date within range', () => {
      expect(isDateInRange('2024-01-15', dateRange)).toBe(true);
      expect(isDateInRange('2024-01-10', dateRange)).toBe(true);
      expect(isDateInRange('2024-01-20', dateRange)).toBe(true);
    });

    test('should return false for date outside range', () => {
      expect(isDateInRange('2024-01-05', dateRange)).toBe(false);
      expect(isDateInRange('2024-01-25', dateRange)).toBe(false);
      expect(isDateInRange('2023-12-31', dateRange)).toBe(false);
    });

    test('should return false for invalid inputs', () => {
      expect(isDateInRange(null, dateRange)).toBe(false);
      expect(isDateInRange('2024-01-15', null)).toBe(false);
      expect(isDateInRange('', dateRange)).toBe(false);
      expect(isDateInRange('2024-01-15', {})).toBe(false);
    });

    test('should handle different date formats', () => {
      const dateRange = {
        start: '2024-01-10',
        end: '2024-01-20',
      };
      
      // Standard ISO format
      expect(isDateInRange('2024-01-15', dateRange)).toBe(true);
    });
  });
});

describe('Booking Service - Status Utilities', () => {
  describe('getStatusColor', () => {
    test('should return correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe('#F59E0B');
    });

    test('should return correct color for approved status', () => {
      expect(getStatusColor('approved')).toBe('#16A34A');
    });

    test('should return correct color for completed status', () => {
      expect(getStatusColor('completed')).toBe('#2563EB');
    });

    test('should return correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('#DC2626');
    });

    test('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#6B7280');
      expect(getStatusColor('')).toBe('#6B7280');
      expect(getStatusColor(null)).toBe('#6B7280');
    });
  });

  describe('getStatusIcon', () => {
    test('should return correct icon for pending status', () => {
      expect(getStatusIcon('pending')).toBe('⏳');
    });

    test('should return correct icon for approved status', () => {
      expect(getStatusIcon('approved')).toBe('✅');
    });

    test('should return correct icon for completed status', () => {
      expect(getStatusIcon('completed')).toBe('🎉');
    });

    test('should return correct icon for cancelled status', () => {
      expect(getStatusIcon('cancelled')).toBe('❌');
    });

    test('should return default icon for unknown status', () => {
      expect(getStatusIcon('unknown')).toBe('📋');
      expect(getStatusIcon('')).toBe('📋');
      expect(getStatusIcon(null)).toBe('📋');
    });
  });
});

describe('Booking Service - Data Validation', () => {
  test('should validate booking status values', () => {
    const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
    
    validStatuses.forEach(status => {
      expect(getStatusColor(status)).not.toBe('#6B7280'); // Not default
      expect(getStatusIcon(status)).not.toBe('📋'); // Not default
    });
  });

  test('should handle case sensitivity in status', () => {
    // Our functions are case-sensitive
    expect(getStatusColor('PENDING')).toBe('#6B7280'); // Default for unknown
    expect(getStatusColor('Pending')).toBe('#6B7280'); // Default for unknown
  });
});

describe('Booking Service - Date Edge Cases', () => {
  test('should handle date range spanning multiple years', () => {
    const dateRange = {
      start: '2023-12-25',
      end: '2024-01-05',
    };
    
    expect(isDateInRange('2023-12-30', dateRange)).toBe(true);
    expect(isDateInRange('2024-01-02', dateRange)).toBe(true);
  });

  test('should handle leap year dates', () => {
    const dateRange = {
      start: '2024-02-28',
      end: '2024-03-02',
    };
    
    expect(isDateInRange('2024-02-29', dateRange)).toBe(true); // 2024 is leap year
  });

  test('should handle end of month dates', () => {
    const dateRange = {
      start: '2024-01-30',
      end: '2024-02-02',
    };
    
    expect(isDateInRange('2024-01-31', dateRange)).toBe(true);
    expect(isDateInRange('2024-02-01', dateRange)).toBe(true);
  });
});

describe('Booking Service - Date Format Consistency', () => {
  test('should consistently format dates across different inputs', () => {
    const dateRanges = [
      { start: '2024-01-01', end: '2024-01-31' },
      { start: '2024-06-15', end: '2024-06-30' },
      { start: '2024-12-01', end: '2024-12-25' },
    ];

    dateRanges.forEach(range => {
      const formatted = formatDateRange(range);
      expect(formatted).not.toBe('N/A');
      expect(formatted).toContain('2024');
    });
  });
});

describe('Booking Service - Status Color Accessibility', () => {
  test('should use distinct colors for different statuses', () => {
    const statuses = ['pending', 'approved', 'completed', 'cancelled'];
    const colors = statuses.map(status => getStatusColor(status));
    
    // All colors should be unique
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(statuses.length);
  });

  test('should return valid hex color codes', () => {
    const statuses = ['pending', 'approved', 'completed', 'cancelled', 'unknown'];
    
    statuses.forEach(status => {
      const color = getStatusColor(status);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe('Booking Service - Icon Consistency', () => {
  test('should return emoji icons for all statuses', () => {
    const statuses = ['pending', 'approved', 'completed', 'cancelled', 'unknown'];
    
    statuses.forEach(status => {
      const icon = getStatusIcon(status);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});
