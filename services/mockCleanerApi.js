const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const MockCleaner = {
  async getRouteOverview() {
    await delay();
    return {
      routeId: 'rt_2025_10_17_A',
      date: '2025-10-17',
      zone: 'C7',
      totalStops: 42,
      completed: 17,
      remaining: 25,
      next: [
        { stopId: 's_220', label: '12/3 Flower Rd, Colombo 7', distKm: 1.2, priority: 'normal' },
        { stopId: 's_221', label: 'No. 5 Galle Rd', distKm: 2.1, priority: 'high' },
        { stopId: 's_222', label: 'Ward Pl', distKm: 2.4, priority: 'normal' },
      ],
    };
  },

  async getMapData() {
    await delay();
    return {
      current: { lat: 6.92, lng: 79.874 },
      stops: [
        { stopId: 's_220', lat: 6.906, lng: 79.868, status: 'pending' },
        { stopId: 's_221', lat: 6.91, lng: 79.872, status: 'pending' },
        { stopId: 's_100', lat: 6.91, lng: 79.872, status: 'done' },
      ],
      polyline: [
        [6.92, 79.874],
        [6.913, 79.872],
        [6.91, 79.872],
        [6.906, 79.868],
      ],
    };
  },

  async getStopsList() {
    await delay();
    return [
      { stopId: 's_220', time: '07:20', address: '12/3 Flower Rd', status: 'pending', binId: 'bin_1234' },
      { stopId: 's_221', time: '07:32', address: 'No. 5 Galle Rd', status: 'pending', binId: 'bin_1240' },
      { stopId: 's_100', time: '07:00', address: 'Ward Pl', status: 'completed', binId: 'bin_1001' },
    ];
  },

  async getStop(id) {
    await delay();
    return {
      stopId: id,
      address: id === 's_220' ? '12/3 Flower Rd, Colombo 7' : 'No. 5 Galle Rd',
      customer: { name: 'N. Perera', phone: '+94 71 123 4567' },
      instructions: 'Gate on left. Dog friendly.',
      bin: { binId: 'bin_1234', wasteTypes: ['general', 'recyclables'] },
      coords: { lat: 6.906, lng: 79.868 },
    };
  },

  async validateScan(payload) {
    await delay();
    return {
      ok: true,
      accountId: 'acc_78A3',
      binId: payload?.binId || 'bin_1234',
      wasteTypes: ['general', 'recyclables'],
    };
  },

  async submitPickup(payload) {
    await delay();
    // Simulate updating stop status to completed
    const stops = await this.getStopsList();
    const updatedStops = stops.map(stop => 
      stop.stopId === payload.stopId 
        ? { ...stop, status: 'completed' }
        : stop
    );
    // In a real app, this would persist to Firebase
    return { ok: true, pickupId: 'pk_' + Date.now(), payload };
  },

  async markMissed(payload) {
    await delay();
    return { ok: true, payload };
  },

  async getChecklist() {
    await delay();
    return {
      date: '2025-10-17',
      ppe: { gloves: false, mask: false, boots: false },
      vehicle: { lights: true, horn: true },
    };
  },

  async submitChecklist(payload) {
    await delay();
    return { ok: true, payload };
  },

  async getMessages() {
    await delay();
    return [
      { id: 'm1', from: 'Dispatch', text: 'Rain expected after 10:00 AM. Drive safe.', time: '07:10' },
      { id: 'm2', from: 'Ops', text: 'Priority stop added to route.', time: '06:50' },
    ];
  },

  async getAnalytics() {
    await delay();
    return {
      date: '2025-10-17',
      completed: 28,
      missed: 2,
      avgStopMin: 4.2,
    };
  },
};
