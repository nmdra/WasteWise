// jest.setup.js - Global test setup

// Suppress console warnings during tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock_doc_id_' + Date.now() })),
  updateDoc: jest.fn(() => Promise.resolve()),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => false,
    id: 'mock_doc_id',
    data: () => ({}),
  })),
  getDocs: jest.fn(() => Promise.resolve({
    empty: true,
    forEach: jest.fn(),
    docs: [],
  })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  serverTimestamp: jest.fn(() => ({ toDate: () => new Date() })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Set test timeout
jest.setTimeout(10000);
