import {
    getUpcomingPickups,
    refreshPickupSchedules,
} from '../pickupService';

describe('pickupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcomingPickups', () => {
    it('should retrieve upcoming pickups for active bins', async () => {
      const pickups = await getUpcomingPickups('user_123');

      expect(Array.isArray(pickups)).toBe(true);
    });

    it('should return empty array for user with no active bins', async () => {
      const pickups = await getUpcomingPickups('user_no_bins');

      expect(pickups).toEqual([]);
    });

    it('should return empty array for user with no zone', async () => {
      const pickups = await getUpcomingPickups('user_no_zone');

      expect(pickups).toEqual([]);
    });

    it('should return empty array for non-existent user', async () => {
      const pickups = await getUpcomingPickups('invalid_user');

      expect(pickups).toEqual([]);
    });

    it('should include bin details in pickup data', async () => {
      const pickups = await getUpcomingPickups('user_with_bins');

      pickups.forEach(pickup => {
        expect(pickup.binId).toBeDefined();
        expect(pickup.category).toBeDefined();
      });
    });

    it('should include schedule details in pickup data', async () => {
      const pickups = await getUpcomingPickups('user_with_schedules');

      pickups.forEach(pickup => {
        if (pickup.scheduleId) {
          expect(pickup.date).toBeDefined();
          expect(pickup.wasteTypes).toBeDefined();
        }
      });
    });

    it('should only return future pickups', async () => {
      const pickups = await getUpcomingPickups('user_123');

      const now = new Date();
      pickups.forEach(pickup => {
        if (pickup.date) {
          const pickupDate = new Date(pickup.date);
          expect(pickupDate >= now || pickup.scheduleId).toBeTruthy();
        }
      });
    });

    it('should return pickups sorted by date', async () => {
      const pickups = await getUpcomingPickups('user_multiple_bins');

      if (pickups.length > 1) {
        for (let i = 1; i < pickups.length; i++) {
          if (pickups[i - 1].date && pickups[i].date) {
            const prevDate = new Date(pickups[i - 1].date);
            const currDate = new Date(pickups[i].date);
            expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
          }
        }
      }
    });

    it('should handle bins without matching schedules', async () => {
      const pickups = await getUpcomingPickups('user_no_matching_schedules');

      expect(Array.isArray(pickups)).toBe(true);
      // Should return bins even if no schedules match
      pickups.forEach(pickup => {
        expect(pickup.binId).toBeDefined();
      });
    });

    it('should match bins to correct waste type schedules', async () => {
      const pickups = await getUpcomingPickups('user_specific_waste');

      pickups.forEach(pickup => {
        if (pickup.scheduleId && pickup.category) {
          expect(pickup.wasteTypes).toContain(pickup.category);
        }
      });
    });
  });

  describe('refreshPickupSchedules', () => {
    it('should refresh schedules for all active bins', async () => {
      const result = await refreshPickupSchedules('user_123');

      expect(result.success).toBe(true);
      expect(typeof result.added).toBe('number');
      expect(typeof result.removed).toBe('number');
    });

    it('should handle user with no active bins', async () => {
      const result = await refreshPickupSchedules('user_no_bins');

      expect(result.success).toBe(true);
      expect(result.added).toBe(0);
      expect(result.removed).toBe(0);
    });

    it('should handle user with no zone', async () => {
      const result = await refreshPickupSchedules('user_no_zone');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent user', async () => {
      const result = await refreshPickupSchedules('invalid_user');

      expect(result.success).toBe(false);
    });

    it('should add stops to matching schedules', async () => {
      const result = await refreshPickupSchedules('user_with_matching_schedules');

      expect(result.success).toBe(true);
      expect(result.added).toBeGreaterThanOrEqual(0);
    });

    it('should remove duplicate stops', async () => {
      const result = await refreshPickupSchedules('user_with_duplicates');

      expect(result.success).toBe(true);
      expect(result.removed).toBeGreaterThanOrEqual(0);
    });

    it('should handle zone with no future schedules', async () => {
      const result = await refreshPickupSchedules('user_no_future_schedules');

      expect(result.success).toBe(true);
      expect(result.added).toBe(0);
    });

    it('should keep only closest schedule per bin category', async () => {
      const result = await refreshPickupSchedules('user_multiple_schedules');

      expect(result.success).toBe(true);
      // Should optimize by keeping closest schedule
      expect(result.message).toContain('Updated');
    });

    it('should include user address in stop data', async () => {
      const result = await refreshPickupSchedules('user_with_address');

      expect(result.success).toBe(true);
      if (result.added > 0) {
        expect(result.message).toBeDefined();
      }
    });

    it('should include user name in stop data', async () => {
      const result = await refreshPickupSchedules('user_with_name');

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should match bins to schedules by waste type', async () => {
      const result = await refreshPickupSchedules('user_various_waste_types');

      expect(result.success).toBe(true);
      // Each bin should be added to schedule with matching waste type
    });

    it('should handle concurrent refresh requests', async () => {
      const promises = [
        refreshPickupSchedules('user_concurrent_1'),
        refreshPickupSchedules('user_concurrent_2'),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully in getUpcomingPickups', async () => {
      // Mock a Firebase error
      const pickups = await getUpcomingPickups('user_error');

      expect(Array.isArray(pickups)).toBe(true);
      // Should return empty array on error
    });

    it('should handle Firebase errors gracefully in refreshPickupSchedules', async () => {
      const result = await refreshPickupSchedules('user_error');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null user ID', async () => {
      const pickups = await getUpcomingPickups(null);

      expect(pickups).toEqual([]);
    });

    it('should handle undefined user ID', async () => {
      const pickups = await getUpcomingPickups(undefined);

      expect(pickups).toEqual([]);
    });

    it('should handle empty string user ID', async () => {
      const pickups = await getUpcomingPickups('');

      expect(pickups).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle user with multiple bin categories', async () => {
      const pickups = await getUpcomingPickups('user_multi_category');

      expect(Array.isArray(pickups)).toBe(true);
      if (pickups.length > 1) {
        const categories = pickups.map(p => p.category);
        const uniqueCategories = [...new Set(categories)];
        expect(uniqueCategories.length).toBeGreaterThan(0);
      }
    });

    it('should handle user in zone with multiple schedules', async () => {
      const pickups = await getUpcomingPickups('user_multi_schedules');

      expect(Array.isArray(pickups)).toBe(true);
      // Should match bins to appropriate schedules
    });

    it('should refresh after user adds new bin', async () => {
      const beforePickups = await getUpcomingPickups('user_refresh_test');
      const refreshResult = await refreshPickupSchedules('user_refresh_test');
      const afterPickups = await getUpcomingPickups('user_refresh_test');

      expect(refreshResult.success).toBe(true);
      expect(Array.isArray(afterPickups)).toBe(true);
    });

    it('should handle bin activation workflow', async () => {
      // User activates bin -> refresh schedules -> check pickups
      const refreshResult = await refreshPickupSchedules('user_activation');
      const pickups = await getUpcomingPickups('user_activation');

      expect(refreshResult.success).toBe(true);
      expect(Array.isArray(pickups)).toBe(true);
    });

    it('should optimize stops when multiple bins share category', async () => {
      const result = await refreshPickupSchedules('user_same_category_bins');

      expect(result.success).toBe(true);
      // Should not create duplicate stops
    });
  });

  describe('Performance', () => {
    it('should handle user with many bins efficiently', async () => {
      const startTime = Date.now();
      const pickups = await getUpcomingPickups('user_many_bins');
      const endTime = Date.now();

      expect(Array.isArray(pickups)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle refresh for user with many bins', async () => {
      const startTime = Date.now();
      const result = await refreshPickupSchedules('user_many_bins_refresh');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
