// Mock API for Customer Module
// Replace with real Firebase calls later

export const MockCustomer = {
  // Home Screen Data
  getHome: async () => ({
    nextPickup: {
      date: '2025-10-21T07:30:00',
      wasteTypes: ['general', 'recyclables'],
      etaMinutes: 45,
    },
    lastPickup: {
      date: '2025-10-14T07:31:22',
      weightKg: 11.2,
      photos: ['/mock/p1.jpg'],
    },
    alerts: [
      { type: 'reminder', text: 'Put bin out by 7:00 AM' },
      { type: 'info', text: 'Route delayed by 15 mins due to traffic' },
    ],
    recent: [
      {
        id: 'pk_101',
        date: '2025-10-14',
        status: 'completed',
        weightKg: 11.2,
        types: ['general', 'recyclables'],
      },
      {
        id: 'pk_100',
        date: '2025-10-07',
        status: 'completed',
        weightKg: 9.7,
        types: ['general'],
      },
      {
        id: 'pk_99',
        date: '2025-09-30',
        status: 'completed',
        weightKg: 12.5,
        types: ['general', 'recyclables'],
      },
    ],
  }),

  // Map Screen Data
  getMap: async () => ({
    userLocation: { lat: 6.9271, lng: 79.8612 },
    truck: {
      lat: 6.9202,
      lng: 79.8745,
      heading: 135,
      lastUpdated: '2025-10-17T09:40:00',
      driverId: 'drv_123',
      driverName: 'K. Silva',
    },
    route: [
      { lat: 6.9202, lng: 79.8745 },
      { lat: 6.923, lng: 79.8702 },
      { lat: 6.9271, lng: 79.8612 },
    ],
    etaMinutes: 18,
    stopsBefore: 3,
  }),

  // Locations
  getLocations: async () => [
    {
      id: 'loc_home',
      label: 'Home',
      address: '12/3, Flower Rd, Colombo 7',
      isPrimary: true,
      coords: { lat: 6.906, lng: 79.868 },
    },
    {
      id: 'loc_shop',
      label: 'Shop',
      address: 'Main St, Nugegoda',
      isPrimary: false,
      coords: { lat: 6.86, lng: 79.888 },
    },
  ],

  // My Bins
  getBins: async () => [
    {
      binId: 'bin_1234',
      tagId: 'QR-A1B2',
      types: ['general', 'recyclables'],
      lastCollected: '2025-10-14T07:31:22',
      notes: 'OK',
      status: 'active',
    },
    {
      binId: 'bin_2001',
      tagId: 'QR-X9Y8',
      types: ['organic'],
      lastCollected: '2025-10-13T07:18:05',
      notes: '',
      status: 'active',
    },
  ],

  // Schedule
  getSchedule: async () => ({
    wardSchedule: [
      { weekday: 'Tuesday', waste: ['general', 'recyclables'] },
      { weekday: 'Friday', waste: ['organic'] },
    ],
    upcomingPickups: [
      { date: '2025-10-22', time: '07:00-08:00', types: ['general', 'recyclables'] },
      { date: '2025-10-25', time: '07:00-08:00', types: ['organic'] },
      { date: '2025-10-29', time: '07:00-08:00', types: ['general', 'recyclables'] },
    ],
    availableSlots: ['06:30', '07:00', '07:30', '08:00'],
    blockedSlots: ['09:00'],
  }),

  // Payments
  getInvoices: async () => [
    {
      invoiceId: 'inv_2025_09',
      period: 'Sep 2025',
      amount: 1200,
      status: 'paid',
      dueDate: '2025-10-01',
    },
    {
      invoiceId: 'inv_2025_10',
      period: 'Oct 2025',
      amount: 1450,
      status: 'unpaid',
      dueDate: '2025-11-01',
    },
  ],

  getInvoice: async (id) => ({
    invoiceId: id,
    period: 'Oct 2025',
    lines: [
      { label: 'General waste (by weight)', qty: '10.8 kg', amount: 980 },
      { label: 'Recyclables credit', qty: '3.2 kg', amount: -150 },
      { label: 'Organic waste', qty: '5.5 kg', amount: 620 },
    ],
    subtotal: 1450,
    tax: 0,
    total: 1450,
    status: 'unpaid',
    dueDate: '2025-11-01',
    receiptUrl: '/mock/receipt.pdf',
  }),

  // Wallet
  getWallet: async () => ({
    balance: 450,
    transactions: [
      {
        id: 'tx_1',
        type: 'rebate',
        note: 'E-waste credit',
        amount: 300,
        createdAt: '2025-10-10',
      },
      {
        id: 'tx_2',
        type: 'rebate',
        note: 'Recyclables bonus',
        amount: 150,
        createdAt: '2025-10-05',
      },
      {
        id: 'tx_3',
        type: 'withdrawal',
        note: 'Bank transfer',
        amount: -200,
        createdAt: '2025-10-01',
      },
    ],
  }),

  // Activity History
  getActivity: async () => [
    {
      pickupId: 'pk_101',
      date: '2025-10-14',
      types: ['general', 'recyclables'],
      weightKg: 11.2,
      status: 'completed',
      photos: ['/mock/p1.jpg'],
    },
    {
      pickupId: 'pk_100',
      date: '2025-10-07',
      types: ['general'],
      weightKg: 9.7,
      status: 'completed',
      photos: [],
    },
    {
      pickupId: 'pk_99',
      date: '2025-09-30',
      types: ['general', 'recyclables'],
      weightKg: 12.5,
      status: 'completed',
      photos: ['/mock/p2.jpg'],
    },
  ],

  // Education / Sorting Guide
  getEducation: async () => [
    {
      id: 'it_paper',
      title: 'Paper & Cardboard',
      category: 'recyclables',
      icon: '📄',
      goesTo: 'Blue Bin',
      examples: ['newspapers', 'magazines', 'cardboard boxes', 'office paper'],
      tips: 'Remove plastic windows from envelopes',
    },
    {
      id: 'it_plastic',
      title: 'Plastic Bottles',
      category: 'recyclables',
      icon: '♻️',
      goesTo: 'Blue Bin',
      examples: ['water bottles', 'soda bottles', 'milk jugs'],
      tips: 'Rinse before recycling',
    },
    {
      id: 'it_food',
      title: 'Food Waste',
      category: 'organic',
      icon: '🥗',
      goesTo: 'Green Bin',
      examples: ['fruit peels', 'vegetable scraps', 'leftovers', 'coffee grounds'],
      tips: 'No meat or dairy products',
    },
    {
      id: 'it_glass',
      title: 'Glass Bottles & Jars',
      category: 'recyclables',
      icon: '🍾',
      goesTo: 'Blue Bin',
      examples: ['wine bottles', 'jam jars', 'sauce bottles'],
      tips: 'Remove lids and rinse',
    },
    {
      id: 'it_metal',
      title: 'Metal Cans',
      category: 'recyclables',
      icon: '🥫',
      goesTo: 'Blue Bin',
      examples: ['tin cans', 'aluminum cans', 'food tins'],
      tips: 'Clean and flatten if possible',
    },
    {
      id: 'it_ewaste',
      title: 'E-Waste',
      category: 'special',
      icon: '📱',
      goesTo: 'Special Pickup',
      examples: ['old phones', 'computers', 'batteries', 'chargers'],
      tips: 'Request special pickup for e-waste',
    },
  ],

  // Notifications
  getNotifications: async () => [
    {
      id: 'n1',
      type: 'reminder',
      title: 'Put bin out tonight',
      message: 'Pickup scheduled for tomorrow 7:00 AM',
      time: '2025-10-20T20:00:00',
      read: false,
    },
    {
      id: 'n2',
      type: 'update',
      title: 'Route delayed',
      message: 'Due to heavy rain, pickup delayed by 30 mins',
      time: '2025-10-14T06:40:00',
      read: true,
    },
    {
      id: 'n3',
      type: 'success',
      title: 'Pickup completed',
      message: '11.2 kg collected. View details in Activity.',
      time: '2025-10-14T07:45:00',
      read: true,
    },
  ],

  // Profile
  getProfile: async () => ({
    user: {
      name: 'N. Perera',
      email: 'n.perera@example.com',
      phone: '+94 71 123 4567',
      role: 'customer',
      accountId: 'acc_78A3',
    },
    prefs: {
      language: 'en',
      pushReminders: true,
      emailNotifications: true,
      primaryLocationId: 'loc_home',
    },
  }),

  // Help & FAQs
  getHelp: async () => ({
    faqs: [
      {
        q: 'What time should I put the bin out?',
        a: 'Put your bin out by 7:00 AM on collection day, or the night before.',
      },
      {
        q: 'How do I book an e-waste pickup?',
        a: 'Use the Special Pickup screen and select E-waste category.',
      },
      {
        q: 'What happens if I miss a pickup?',
        a: 'You can report a missed pickup and we will reschedule within 24 hours.',
      },
      {
        q: 'How is my bill calculated?',
        a: 'Bills are based on weight collected. You get credits for recyclables.',
      },
      {
        q: 'Can I change my pickup location?',
        a: 'Yes, go to Locations and set a different primary address.',
      },
    ],
    contact: {
      phone: '1234',
      email: 'support@wastewise.lk',
      hours: '8:00 AM - 6:00 PM',
    },
  }),
};

// Simulate API delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wrap all methods to add realistic delays
Object.keys(MockCustomer).forEach((key) => {
  const original = MockCustomer[key];
  MockCustomer[key] = async (...args) => {
    await delay(300 + Math.random() * 200);
    return original(...args);
  };
});
