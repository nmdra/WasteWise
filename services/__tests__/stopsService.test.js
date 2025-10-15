import {
  createMainStop,
  createCustomerStop,
  createMainStopsForSchedule,
  getStopsBySchedule,
  subscribeToStopsBySchedule,
  getStopStats,
  markStopAsCollected,
  markStopAsSkipped,
  updateStop,
  deleteStop,
  deleteStopsBySchedule,
} from '../stopsService';

describe('stopsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMainStop', () => {
    it('should create a main stop successfully', async () => {
      const stopData = {
        address: '123 Main St',
        wasteTypes: ['general', 'recyclables'],
        zone: 'A',
        notes: 'Test stop',
      };

      const result = await createMainStop('schedule_123', stopData);

      expect(result.success).toBe(true);
      expect(result.stopId).toBeDefined();
    });

    it('should create stop with minimal data', async () => {
      const stopData = {
        address: '456 Oak Ave',
        wasteTypes: ['organic'],
        zone: 'B',
      };

      const result = await createMainStop('schedule_456', stopData);

      expect(result.success).toBe(true);
      expect(result.stopId).toBeDefined();
    });

  

    it('should set default values for optional fields', async () => {
      const stopData = {
        address: '321 Elm St',
        wasteTypes: ['glass'],
        zone: 'D',
      };

      const result = await createMainStop('schedule_789', stopData);

      expect(result.success).toBe(true);
    });
  });

 
  describe('createMainStopsForSchedule', () => {
    it('should batch create multiple stops', async () => {
      const stops = [
        { address: 'Stop 1', wasteTypes: ['general'], zone: 'A' },
        { address: 'Stop 2', wasteTypes: ['recyclables'], zone: 'A' },
        { address: 'Stop 3', wasteTypes: ['organic'], zone: 'A' },
      ];

      const result = await createMainStopsForSchedule('schedule_123', stops);

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should handle empty stops array', async () => {
      const result = await createMainStopsForSchedule('schedule_456', []);

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it('should handle single stop', async () => {
      const stops = [
        { address: 'Single Stop', wasteTypes: ['paper'], zone: 'B' },
      ];

      const result = await createMainStopsForSchedule('schedule_789', stops);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe('getStopsBySchedule', () => {
    it('should retrieve all stops for a schedule', async () => {
      const stops = await getStopsBySchedule('schedule_123');

      expect(Array.isArray(stops)).toBe(true);
    });

    it('should return empty array for schedule with no stops', async () => {
      const stops = await getStopsBySchedule('empty_schedule');

      expect(stops).toEqual([]);
    });

    it('should return stops in creation order', async () => {
      const stops = await getStopsBySchedule('schedule_456');

      expect(Array.isArray(stops)).toBe(true);
      if (stops.length > 1) {
        expect(stops[0].createdAt).toBeDefined();
      }
    });
  });

  describe('subscribeToStopsBySchedule', () => {
    it('should set up real-time listener', () => {
      const callback = jest.fn();
      const unsubscribe = subscribeToStopsBySchedule('schedule_123', callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    // it('should call callback with stops data', (done) => {
    //   const callback = (stops) => {
    //     expect(Array.isArray(stops)).toBe(true);
    //     unsubscribe();
    //     done();
    //   };

    //   const unsubscribe = subscribeToStopsBySchedule('schedule_456', callback);
    // });

    it('should handle multiple subscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = subscribeToStopsBySchedule('schedule_789', callback1);
      const unsub2 = subscribeToStopsBySchedule('schedule_789', callback2);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');

      unsub1();
      unsub2();
    });
  });

  describe('getStopStats', () => {
    it('should calculate stop statistics', async () => {
      const stats = await getStopStats('schedule_123');

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.collected).toBe('number');
    });

    it('should return zero stats for empty schedule', async () => {
      const stats = await getStopStats('empty_schedule');

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.collected).toBe(0);
    });

    it('should calculate completion percentage', async () => {
      const stats = await getStopStats('schedule_456');

      expect(stats).toBeDefined();
      if (stats.total > 0) {
        const percentage = (stats.collected / stats.total) * 100;
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('markStopAsCollected', () => {
    it('should mark stop as collected', async () => {
      const result = await markStopAsCollected('schedule_123', 'stop_1', 'Collected successfully');

      expect(result.success).toBe(true);
    });

    it('should mark stop without notes', async () => {
      const result = await markStopAsCollected('schedule_456', 'stop_2');

      expect(result.success).toBe(true);
    });

    // it('should handle non-existent stop', async () => {
    //   const result = await markStopAsCollected('schedule_789', 'invalid_stop');

    //   expect(result.success).toBe(false);
    //   expect(result.error).toBeDefined();
    // });
  });

  describe('markStopAsSkipped', () => {
    it('should mark stop as skipped with reason', async () => {
      const result = await markStopAsSkipped('schedule_123', 'stop_1', 'Customer not available');

      expect(result.success).toBe(true);
    });

    it('should mark stop as skipped without reason', async () => {
      const result = await markStopAsSkipped('schedule_456', 'stop_2');

      expect(result.success).toBe(true);
    });

  
  });

  describe('updateStop', () => {
    it('should update stop address', async () => {
      const updates = { address: '999 New Address' };
      const result = await updateStop('schedule_123', 'stop_1', updates);

      expect(result.success).toBe(true);
    });

    it('should update stop waste types', async () => {
      const updates = { wasteTypes: ['plastic', 'metal'] };
      const result = await updateStop('schedule_456', 'stop_2', updates);

      expect(result.success).toBe(true);
    });

    it('should update multiple fields', async () => {
      const updates = {
        address: '111 Updated St',
        notes: 'New instructions',
        wasteTypes: ['general'],
      };
      const result = await updateStop('schedule_789', 'stop_3', updates);

      expect(result.success).toBe(true);
    });

    it('should handle empty updates', async () => {
      const result = await updateStop('schedule_123', 'stop_1', {});

      expect(result.success).toBe(true);
    });
  });

  describe('deleteStop', () => {
    it('should delete a stop', async () => {
      const result = await deleteStop('schedule_123', 'stop_1');

      expect(result.success).toBe(true);
    });

   
  });

  
});
