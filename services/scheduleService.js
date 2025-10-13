import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ===========================
// Schedule Management (Collectors)
// ===========================

/**
 * Create a new collection schedule
 * @param {Object} scheduleData - Schedule information
 * @returns {Promise<string>} - Created schedule ID
 */
export async function createSchedule(scheduleData) {
  console.log('📅 createSchedule() called with data:', scheduleData);
  
  try {
    console.log('🔥 Attempting to write to Firestore...');
    console.log('Database instance:', db ? 'Connected ✓' : 'NOT CONNECTED ✗');
    
    const dataToSave = {
      ...scheduleData,
      status: 'active',
      availableSlots: scheduleData.totalSlots || 20,
      bookedSlots: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    console.log('Data to save:', dataToSave);
    
    const scheduleRef = await addDoc(collection(db, 'schedules'), dataToSave);

    console.log('✅ Schedule created successfully! ID:', scheduleRef.id);
    return scheduleRef.id;
  } catch (error) {
    console.error('❌ Error creating schedule:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Update an existing schedule
 * @param {string} scheduleId - Schedule ID to update
 * @param {Object} updates - Fields to update
 */
export async function updateSchedule(scheduleId, updates) {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await updateDoc(scheduleRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log('Schedule updated:', scheduleId);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

/**
 * Delete a schedule
 * @param {string} scheduleId - Schedule ID to delete
 */
export async function deleteSchedule(scheduleId) {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await deleteDoc(scheduleRef);

    console.log('Schedule deleted:', scheduleId);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

/**
 * Get a single schedule by ID
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object>} - Schedule data
 */
export async function getSchedule(scheduleId) {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      return {
        id: scheduleSnap.id,
        ...scheduleSnap.data(),
      };
    } else {
      throw new Error('Schedule not found');
    }
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw error;
  }
}

/**
 * Get all schedules for a specific collector
 * @param {string} collectorId - Collector user ID
 * @returns {Promise<Array>} - Array of schedules
 */
export async function getCollectorSchedules(collectorId) {
  try {
    const q = query(
      collection(db, 'schedules'),
      where('collectorId', '==', collectorId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const schedules = [];
    
    querySnapshot.forEach((doc) => {
      schedules.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return schedules;
  } catch (error) {
    console.error('Error getting collector schedules:', error);
    throw error;
  }
}

/**
 * Listen to schedules in real-time for a specific zone
 * @param {string} zone - Zone to filter by
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToSchedulesByZone(zone, callback) {
  const today = new Date().toISOString().slice(0, 10);
  
  const q = query(
    collection(db, 'schedules'),
    where('zone', '==', zone),
    where('status', '==', 'active'),
    where('date', '>=', today),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const schedules = [];
    snapshot.forEach((doc) => {
      schedules.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(schedules);
  }, (error) => {
    console.error('Error in schedules subscription:', error);
  });
}

/**
 * Get active schedules for a specific zone and date range
 * @param {string} zone - Zone to filter by
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} - Array of schedules
 */
export async function getSchedulesByZoneAndDateRange(zone, startDate, endDate) {
  try {
    const q = query(
      collection(db, 'schedules'),
      where('zone', '==', zone),
      where('status', '==', 'active'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const schedules = [];
    
    querySnapshot.forEach((doc) => {
      schedules.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return schedules;
  } catch (error) {
    console.error('Error getting schedules by zone and date:', error);
    throw error;
  }
}

/**
 * Get the next upcoming schedule for a zone
 * @param {string} zone - Zone to filter by
 * @returns {Promise<Object|null>} - Next schedule or null
 */
export async function getNextSchedule(zone) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    const q = query(
      collection(db, 'schedules'),
      where('zone', '==', zone),
      where('status', '==', 'active'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      return {
        id: firstDoc.id,
        ...firstDoc.data(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting next schedule:', error);
    throw error;
  }
}

// ===========================
// Booking Management (Customers)
// ===========================

/**
 * Create a new booking for a special pickup
 * @param {Object} bookingData - Booking information
 * @returns {Promise<string>} - Created booking ID
 */
export async function createBooking(bookingData) {
  try {
    // Check if schedule has available slots
    const schedule = await getSchedule(bookingData.scheduleId);
    
    if (schedule.availableSlots <= 0) {
      throw new Error('No available slots for this schedule');
    }

    // Create booking
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update schedule slot counts
    await updateDoc(doc(db, 'schedules', bookingData.scheduleId), {
      availableSlots: schedule.availableSlots - 1,
      bookedSlots: schedule.bookedSlots + 1,
      updatedAt: Timestamp.now(),
    });

    console.log('Booking created:', bookingRef.id);
    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Update a booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status (pending, confirmed, completed, cancelled)
 */
export async function updateBookingStatus(bookingId, status) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    console.log('Booking status updated:', bookingId, status);
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

/**
 * Cancel a booking and restore schedule slot
 * @param {string} bookingId - Booking ID
 */
export async function cancelBooking(bookingId) {
  try {
    // Get booking details
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    // Update booking status
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    });

    // Restore schedule slot
    const scheduleRef = doc(db, 'schedules', booking.scheduleId);
    const scheduleSnap = await getDoc(scheduleRef);
    
    if (scheduleSnap.exists()) {
      const schedule = scheduleSnap.data();
      await updateDoc(scheduleRef, {
        availableSlots: schedule.availableSlots + 1,
        bookedSlots: schedule.bookedSlots - 1,
        updatedAt: Timestamp.now(),
      });
    }

    console.log('Booking cancelled:', bookingId);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

/**
 * Get all bookings for a customer
 * @param {string} customerId - Customer user ID
 * @returns {Promise<Array>} - Array of bookings
 */
export async function getCustomerBookings(customerId) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting customer bookings:', error);
    throw error;
  }
}

/**
 * Get all bookings for a schedule
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Array>} - Array of bookings
 */
export async function getScheduleBookings(scheduleId) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('scheduleId', '==', scheduleId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting schedule bookings:', error);
    throw error;
  }
}

// ===========================
// Helper Functions
// ===========================

/**
 * Waste type color mapping for calendar dots
 */
export const wasteTypeColors = {
  plastic: '#3B82F6', // blue
  paper: '#F59E0B', // amber
  organic: '#10B981', // green
  glass: '#06B6D4', // cyan
  metal: '#6B7280', // gray
  other: '#8B5CF6', // purple
};

/**
 * Waste type icons/emojis
 */
export const wasteTypeIcons = {
  plastic: '♻️',
  paper: '📄',
  organic: '🥬',
  glass: '🫙',
  metal: '🔩',
  other: '🗑️',
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export function formatScheduleDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time range for display
 * @param {Object} timeRange - {start, end}
 * @returns {string} - Formatted time range
 */
export function formatTimeRange(timeRange) {
  return `${timeRange.start} - ${timeRange.end}`;
}
