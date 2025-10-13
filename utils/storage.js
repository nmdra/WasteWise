import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WASTE_TYPES: '@wastewise_waste_types',
  COLLECTION_DATES: '@wastewise_collection_dates',
  REMINDERS: '@wastewise_reminders',
  SETTINGS: '@wastewise_settings',
};

// Waste Types Storage
export const saveWasteTypes = async (wasteTypes) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WASTE_TYPES, JSON.stringify(wasteTypes));
  } catch (error) {
    console.error('Error saving waste types:', error);
  }
};

export const getWasteTypes = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WASTE_TYPES);
    return data ? JSON.parse(data) : getDefaultWasteTypes();
  } catch (error) {
    console.error('Error getting waste types:', error);
    return getDefaultWasteTypes();
  }
};

const getDefaultWasteTypes = () => [
  { id: '1', name: 'Organic', color: '#10b981', icon: '🌱' },
  { id: '2', name: 'Plastic', color: '#3b82f6', icon: '♻️' },
  { id: '3', name: 'Glass', color: '#06b6d4', icon: '🫙' },
  { id: '4', name: 'Paper', color: '#f59e0b', icon: '📄' },
  { id: '5', name: 'Metal', color: '#6366f1', icon: '🔧' },
  { id: '6', name: 'Electronic', color: '#8b5cf6', icon: '💻' },
];

// Collection Dates Storage
export const saveCollectionDates = async (dates) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION_DATES, JSON.stringify(dates));
  } catch (error) {
    console.error('Error saving collection dates:', error);
  }
};

export const getCollectionDates = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION_DATES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting collection dates:', error);
    return [];
  }
};

export const addCollectionDate = async (newDate) => {
  try {
    const dates = await getCollectionDates();
    dates.push(newDate);
    await saveCollectionDates(dates);
    return dates;
  } catch (error) {
    console.error('Error adding collection date:', error);
    return [];
  }
};

export const deleteCollectionDate = async (id) => {
  try {
    const dates = await getCollectionDates();
    const filtered = dates.filter(date => date.id !== id);
    await saveCollectionDates(filtered);
    return filtered;
  } catch (error) {
    console.error('Error deleting collection date:', error);
    return [];
  }
};

// Settings Storage
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    return getDefaultSettings();
  }
};

const getDefaultSettings = () => ({
  notificationsEnabled: true,
  reminderTime: '08:00',
  reminderDaysBefore: 1,
  theme: 'light',
});

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
