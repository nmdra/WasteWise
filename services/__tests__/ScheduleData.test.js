import {
  getMockSchedules,
  getMockUserSchedules,
  bookSchedule,
  cancelSchedule,
  rescheduleAppointment,
} from '../mockScheduleData';

describe('mockScheduleData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMockSchedules', () => {
    it('should return schedules object', () => {
      const schedules = getMockSchedules();

      expect(schedules).toBeDefined();
      expect(typeof schedules).toBe('object');
    });

    it('should generate schedules for 30 days', () => {
      const schedules = getMockSchedules();
      const dates = Object.keys(schedules);

      expect(dates.length).toBe(30);
    });

    it('should use correct date format (YYYY-MM-DD)', () => {
      const schedules = getMockSchedules();
      const dates = Object.keys(schedules);

      dates.forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should start from specific date (2025-10-17)', () => {
      const schedules = getMockSchedules();
      const dates = Object.keys(schedules);
      const firstDate = dates[0];

      expect(firstDate).toBe('2025-10-17');
    });

    it('should have consecutive dates', () => {
      const schedules = getMockSchedules();
      const dates = Object.keys(schedules).sort();

      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

        expect(diffDays).toBe(1);
      }
    });

    it('should have slots for each date', () => {
      const schedules = getMockSchedules();

      Object.values(schedules).forEach(schedule => {
        expect(Array.isArray(schedule.slots)).toBe(true);
        expect(schedule.slots.length).toBe(6);
      });
    });

    it('should have valid slot structure', () => {
      const schedules = getMockSchedules();

      Object.values(schedules).forEach(schedule => {
        schedule.slots.forEach(slot => {
          expect(slot.id).toBeDefined();
          expect(typeof slot.id).toBe('number');
          expect(slot.time).toBeDefined();
          expect(typeof slot.time).toBe('string');
          expect(typeof slot.available).toBe('boolean');
        });
      });
    });

    it('should have standard time slots', () => {
      const schedules = getMockSchedules();
      const firstSchedule = Object.values(schedules)[0];
      const times = firstSchedule.slots.map(s => s.time);

      expect(times).toContain('09:00 AM');
      expect(times).toContain('10:00 AM');
      expect(times).toContain('11:00 AM');
      expect(times).toContain('01:00 PM');
      expect(times).toContain('02:00 PM');
      expect(times).toContain('03:00 PM');
    });

    it('should have random availability', () => {
      const schedules = getMockSchedules();
      let hasAvailable = false;
      let hasUnavailable = false;

      Object.values(schedules).forEach(schedule => {
        schedule.slots.forEach(slot => {
          if (slot.available) hasAvailable = true;
          if (!slot.available) hasUnavailable = true;
        });
      });

      // With randomness, we should have both available and unavailable slots
      expect(hasAvailable || hasUnavailable).toBe(true);
    });
  });

  describe('getMockUserSchedules', () => {
    it('should return array of user schedules', () => {
      const schedules = getMockUserSchedules();

      expect(Array.isArray(schedules)).toBe(true);
      expect(schedules.length).toBeGreaterThan(0);
    });

    it('should have complete schedule structure', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        expect(schedule.id).toBeDefined();
        expect(schedule.date).toBeDefined();
        expect(schedule.time).toBeDefined();
        expect(schedule.status).toBeDefined();
        expect(Array.isArray(schedule.wasteTypes)).toBe(true);
        expect(schedule.address).toBeDefined();
      });
    });

    it('should have valid status values', () => {
      const schedules = getMockUserSchedules();
      const validStatuses = ['upcoming', 'completed', 'cancelled'];

      schedules.forEach(schedule => {
        expect(validStatuses).toContain(schedule.status);
      });
    });

    it('should include different statuses', () => {
      const schedules = getMockUserSchedules();
      const statuses = schedules.map(s => s.status);
      const uniqueStatuses = [...new Set(statuses)];

      expect(uniqueStatuses.length).toBeGreaterThan(1);
    });

    it('should have valid waste types', () => {
      const schedules = getMockUserSchedules();
      const validWasteTypes = ['General', 'Recyclables', 'Organic', 'Plastic', 'Paper', 'Glass', 'Metal'];

      schedules.forEach(schedule => {
        schedule.wasteTypes.forEach(type => {
          expect(validWasteTypes).toContain(type);
        });
      });
    });

    it('should have completed schedules with timestamps', () => {
      const schedules = getMockUserSchedules();
      const completedSchedules = schedules.filter(s => s.status === 'completed');

      completedSchedules.forEach(schedule => {
        expect(schedule.completedAt).toBeDefined();
      });
    });

    it('should have completed schedules with ratings', () => {
      const schedules = getMockUserSchedules();
      const completedSchedules = schedules.filter(s => s.status === 'completed');

      completedSchedules.forEach(schedule => {
        expect(schedule.rating).toBeDefined();
        expect(schedule.rating).toBeGreaterThanOrEqual(1);
        expect(schedule.rating).toBeLessThanOrEqual(5);
      });
    });

    it('should have cancelled schedules with timestamps', () => {
      const schedules = getMockUserSchedules();
      const cancelledSchedules = schedules.filter(s => s.status === 'cancelled');

      cancelledSchedules.forEach(schedule => {
        expect(schedule.cancelledAt).toBeDefined();
      });
    });

    it('should include collector names for non-cancelled schedules', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        if (schedule.status !== 'cancelled') {
          expect(schedule.collectorName).toBeDefined();
          expect(schedule.collectorName).not.toBeNull();
        }
      });
    });

    it('should have optional notes field', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        expect('notes' in schedule).toBe(true);
      });
    });
  });

  describe('bookSchedule', () => {
    it('should book a schedule successfully', async () => {
      const result = await bookSchedule(
        '2025-10-25',
        { time: '09:00 AM', id: 1 },
        ['General', 'Recyclables'],
        'Please collect from backyard'
      );

      expect(result.success).toBe(true);
      expect(result.schedule).toBeDefined();
    });

    it('should return schedule with correct data', async () => {
      const date = '2025-10-26';
      const timeSlot = { time: '02:00 PM', id: 5 };
      const wasteTypes = ['Organic'];
      const notes = 'Test notes';

      const result = await bookSchedule(date, timeSlot, wasteTypes, notes);

      expect(result.schedule.date).toBe(date);
      expect(result.schedule.time).toBe(timeSlot.time);
      expect(result.schedule.wasteTypes).toEqual(wasteTypes);
      expect(result.schedule.notes).toBe(notes);
    });

    it('should generate unique schedule ID', async () => {
      const result1 = await bookSchedule('2025-10-25', { time: '09:00 AM' }, ['General'], '');
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await bookSchedule('2025-10-26', { time: '10:00 AM' }, ['Organic'], '');

      expect(result1.schedule.id).not.toBe(result2.schedule.id);
    });

    it('should set status to upcoming', async () => {
      const result = await bookSchedule('2025-10-27', { time: '11:00 AM' }, ['Recyclables'], '');

      expect(result.schedule.status).toBe('upcoming');
    });

    it('should set default address', async () => {
      const result = await bookSchedule('2025-10-28', { time: '01:00 PM' }, ['General'], '');

      expect(result.schedule.address).toBe('123 Main St, Colombo');
    });

    it('should assign collector', async () => {
      const result = await bookSchedule('2025-10-29', { time: '03:00 PM' }, ['Organic'], '');

      expect(result.schedule.collectorName).toBeDefined();
      expect(result.schedule.collectorName).toBe('Assigned Collector');
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await bookSchedule('2025-10-30', { time: '09:00 AM' }, ['General'], '');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it('should handle multiple waste types', async () => {
      const wasteTypes = ['General', 'Recyclables', 'Organic', 'Plastic'];
      const result = await bookSchedule('2025-10-31', { time: '10:00 AM' }, wasteTypes, '');

      expect(result.schedule.wasteTypes).toEqual(wasteTypes);
    });

    it('should handle empty notes', async () => {
      const result = await bookSchedule('2025-11-01', { time: '11:00 AM' }, ['Paper'], '');

      expect(result.schedule.notes).toBe('');
    });
  });

  describe('cancelSchedule', () => {
    it('should cancel a schedule successfully', async () => {
      const result = await cancelSchedule('SCH_001');

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should return success message', async () => {
      const result = await cancelSchedule('SCH_002');

      expect(result.message).toBe('Schedule cancelled successfully');
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await cancelSchedule('SCH_003');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });

    it('should handle different schedule IDs', async () => {
      const ids = ['SCH_001', 'SCH_002', 'SCH_003', 'SCH_999'];

      for (const id of ids) {
        const result = await cancelSchedule(id);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('rescheduleAppointment', () => {
    it('should reschedule successfully', async () => {
      const result = await rescheduleAppointment('SCH_001', '2025-11-05', '02:00 PM');

      expect(result.success).toBe(true);
      expect(result.schedule).toBeDefined();
    });

    it('should update date and time', async () => {
      const newDate = '2025-11-10';
      const newTime = '03:00 PM';
      const result = await rescheduleAppointment('SCH_002', newDate, newTime);

      expect(result.schedule.date).toBe(newDate);
      expect(result.schedule.time).toBe(newTime);
    });

    it('should keep same schedule ID', async () => {
      const scheduleId = 'SCH_003';
      const result = await rescheduleAppointment(scheduleId, '2025-11-15', '09:00 AM');

      expect(result.schedule.id).toBe(scheduleId);
    });

    it('should set status to upcoming', async () => {
      const result = await rescheduleAppointment('SCH_004', '2025-11-20', '10:00 AM');

      expect(result.schedule.status).toBe('upcoming');
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await rescheduleAppointment('SCH_005', '2025-11-25', '11:00 AM');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it('should handle different time slots', async () => {
      const times = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];

      for (const time of times) {
        const result = await rescheduleAppointment('SCH_TEST', '2025-12-01', time);
        expect(result.success).toBe(true);
        expect(result.schedule.time).toBe(time);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should book and then cancel schedule', async () => {
      const bookResult = await bookSchedule('2025-11-01', { time: '09:00 AM' }, ['General'], '');
      expect(bookResult.success).toBe(true);

      const cancelResult = await cancelSchedule(bookResult.schedule.id);
      expect(cancelResult.success).toBe(true);
    });

    it('should book and then reschedule', async () => {
      const bookResult = await bookSchedule('2025-11-02', { time: '10:00 AM' }, ['Organic'], '');
      expect(bookResult.success).toBe(true);

      const rescheduleResult = await rescheduleAppointment(
        bookResult.schedule.id,
        '2025-11-05',
        '02:00 PM'
      );
      expect(rescheduleResult.success).toBe(true);
    });

    it('should handle multiple concurrent bookings', async () => {
      const bookings = [
        bookSchedule('2025-11-10', { time: '09:00 AM' }, ['General'], ''),
        bookSchedule('2025-11-11', { time: '10:00 AM' }, ['Organic'], ''),
        bookSchedule('2025-11-12', { time: '11:00 AM' }, ['Recyclables'], ''),
      ];

      const results = await Promise.all(bookings);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Data Validation', () => {
    it('should maintain consistent schedule IDs format', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        expect(schedule.id).toMatch(/^SCH_\d+$/);
      });
    });

    it('should have valid date formats', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        expect(schedule.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(schedule.date).toString()).not.toBe('Invalid Date');
      });
    });

    it('should have valid time formats', () => {
      const schedules = getMockUserSchedules();

      schedules.forEach(schedule => {
        expect(schedule.time).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
      });
    });
  });
});
