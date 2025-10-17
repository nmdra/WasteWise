// Mock schedule data service

export const getMockSchedules = () => {
  const today = new Date('2025-10-17');
  const schedules = {};

  // Generate schedules for next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    schedules[dateString] = {
      slots: [
        { id: 1, time: '09:00 AM', available: Math.random() > 0.3 },
        { id: 2, time: '10:00 AM', available: Math.random() > 0.3 },
        { id: 3, time: '11:00 AM', available: Math.random() > 0.3 },
        { id: 4, time: '01:00 PM', available: Math.random() > 0.3 },
        { id: 5, time: '02:00 PM', available: Math.random() > 0.3 },
        { id: 6, time: '03:00 PM', available: Math.random() > 0.3 },
      ],
    };
  }

  return schedules;
};

export const getMockUserSchedules = () => {
  return [
    {
      id: 'SCH_001',
      date: '2025-10-20',
      time: '09:00 AM',
      status: 'upcoming',
      wasteTypes: ['General', 'Recyclables'],
      address: '123 Main St, Colombo',
      collectorName: 'John Doe',
      notes: 'Please collect from backyard',
    },
    {
      id: 'SCH_002',
      date: '2025-10-25',
      time: '02:00 PM',
      status: 'upcoming',
      wasteTypes: ['Organic'],
      address: '123 Main St, Colombo',
      collectorName: 'Jane Smith',
      notes: '',
    },
    {
      id: 'SCH_003',
      date: '2025-10-15',
      time: '11:00 AM',
      status: 'completed',
      wasteTypes: ['General', 'Recyclables'],
      address: '123 Main St, Colombo',
      collectorName: 'Mike Johnson',
      notes: '',
      completedAt: '2025-10-15T11:30:00Z',
      rating: 5,
    },
    {
      id: 'SCH_004',
      date: '2025-10-10',
      time: '03:00 PM',
      status: 'completed',
      wasteTypes: ['General'],
      address: '123 Main St, Colombo',
      collectorName: 'Sarah Williams',
      notes: '',
      completedAt: '2025-10-10T15:25:00Z',
      rating: 4,
    },
    {
      id: 'SCH_005',
      date: '2025-10-05',
      time: '10:00 AM',
      status: 'cancelled',
      wasteTypes: ['Organic', 'Recyclables'],
      address: '123 Main St, Colombo',
      collectorName: null,
      notes: 'Cancelled due to weather',
      cancelledAt: '2025-10-04T18:00:00Z',
    },
  ];
};

export const bookSchedule = async (date, timeSlot, wasteTypes, notes) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        schedule: {
          id: `SCH_${Date.now()}`,
          date,
          time: timeSlot.time,
          status: 'upcoming',
          wasteTypes,
          notes,
          address: '123 Main St, Colombo',
          collectorName: 'Assigned Collector',
        },
      });
    }, 1000);
  });
};

export const cancelSchedule = async (scheduleId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Schedule cancelled successfully',
      });
    }, 500);
  });
};

export const rescheduleAppointment = async (scheduleId, newDate, newTime) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        schedule: {
          id: scheduleId,
          date: newDate,
          time: newTime,
          status: 'upcoming',
        },
      });
    }, 1000);
  });
};
