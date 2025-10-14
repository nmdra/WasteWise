import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
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
    return { success: true, scheduleId: scheduleRef.id };
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

/**
 * Get schedules for user's bins by checking stops subcollection
 */
export async function getSchedulesForUserBins(userId, onlyActive = false) {
  try {
    console.log('🔍 Getting schedules for user bins:', userId);
    // Build bins query - optionally include only active bins
    let binsQuery;
    if (onlyActive) {
      binsQuery = query(
        collection(db, 'bins'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
    } else {
      binsQuery = query(
        collection(db, 'bins'),
        where('userId', '==', userId)
      );
    }

    const binsSnapshot = await getDocs(binsQuery);

    if (binsSnapshot.empty) {
      return [];
    }

    const activeBins = binsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const schedulesMap = new Map();
    const today = Timestamp.now();

    for (const bin of activeBins) {
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('status', '==', 'active'),
        where('date', '>=', today),
        orderBy('date', 'asc')
      );

      const schedulesSnapshot = await getDocs(schedulesQuery);

      for (const scheduleDoc of schedulesSnapshot.docs) {
        const scheduleId = scheduleDoc.id;

        const stopsQuery = query(
          collection(db, 'schedules', scheduleId, 'stops'),
          where('binId', '==', bin.id),
          where('status', '==', 'pending')
        );

        const stopsSnapshot = await getDocs(stopsQuery);

        if (!stopsSnapshot.empty) {
          const scheduleData = scheduleDoc.data();
          
          // Handle both old and new stop formats
          const stopDocData = stopsSnapshot.docs[0].data();
          let stopData;
          
          if (stopDocData.bins && Array.isArray(stopDocData.bins)) {
            // New format: find the specific bin in the array
            const binInStop = stopDocData.bins.find(b => b.binId === bin.id);
            if (binInStop) {
              stopData = {
                ...stopDocData,
                binId: binInStop.binId,
                binCode: binInStop.binCode,
                binCategory: binInStop.binCategory,
                wasteType: binInStop.wasteType,
              };
            } else {
              continue; // Bin not found in this stop
            }
          } else {
            // Old format: single bin
            stopData = stopDocData;
          }
          
          // Handle different date formats (Timestamp, Date, or string)
          let scheduleDate = null;
          if (scheduleData.date) {
            if (scheduleData.date.toDate && typeof scheduleData.date.toDate === 'function') {
              // Firestore Timestamp
              scheduleDate = scheduleData.date.toDate();
            } else if (scheduleData.date instanceof Date) {
              // Already a Date object
              scheduleDate = scheduleData.date;
            } else if (typeof scheduleData.date === 'string') {
              // Date string
              scheduleDate = new Date(scheduleData.date);
            }
          }
          
          schedulesMap.set(bin.id, {
            binId: bin.id,
            binCode: bin.binId,
            category: bin.category,
            categoryLabel: bin.category,
            icon: '🗑️',
            color: '#6B7280',
            schedule: {
              scheduleId: scheduleId,
              date: scheduleDate,
              timeRanges: scheduleData.timeRanges || [],
              collectorName: scheduleData.collectorName || 'Collector',
              zone: scheduleData.zone,
              availableSlots: scheduleData.availableSlots || 0,
              totalSlots: scheduleData.totalSlots || 0,
              wasteTypes: scheduleData.wasteTypes || [],
              stopId: stopsSnapshot.docs[0].id,
              stopStatus: stopData.status,
              stopAddress: stopData.address,
            },
          });

          break;
        }
      }

      if (!schedulesMap.has(bin.id)) {
        schedulesMap.set(bin.id, {
          binId: bin.id,
          binCode: bin.binId,
          category: bin.category,
          categoryLabel: bin.category,
          icon: '🗑️',
          color: '#6B7280',
          schedule: null,
        });
      }
    }

    return Array.from(schedulesMap.values());
  } catch (error) {
    console.error('Error getting schedules for bins:', error);
    return [];
  }
}

/**
 * Get upcoming schedules that have stops assigned to the user.
 * Searches stops subcollection across all schedules where userId matches.
 * Returns an array of schedule objects with aggregated stops belonging to the user.
 */
export async function getSchedulesForUser(userId) {
  try {
    console.log('🔍 Fetching schedules for user:', userId);
    
    const scheduleMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use collectionGroup to find stops where userId matches
    const stopsQuery = query(
      collectionGroup(db, 'stops'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const stopsSnapshot = await getDocs(stopsQuery);
    console.log('📍 Found', stopsSnapshot.size, 'pending stops for user');

    for (const stopDoc of stopsSnapshot.docs) {
      // stopDoc.ref.parent.parent is the schedule document reference
      const scheduleRef = stopDoc.ref.parent.parent;
      if (!scheduleRef) continue;
      const scheduleId = scheduleRef.id;

      // Fetch schedule document if not already in map
      if (!scheduleMap.has(scheduleId)) {
        const scheduleSnap = await getDoc(scheduleRef);
        if (!scheduleSnap.exists()) continue;
        // Only include upcoming schedules (today or future)
        const scheduleData = scheduleSnap.data();
        
        // Handle different date formats (Timestamp, Date, or string)
        let scheduleDate = null;
        if (scheduleData.date) {
          if (scheduleData.date.toDate && typeof scheduleData.date.toDate === 'function') {
            // Firestore Timestamp
            scheduleDate = scheduleData.date.toDate();
          } else if (scheduleData.date instanceof Date) {
            // Already a Date object
            scheduleDate = scheduleData.date;
          } else if (typeof scheduleData.date === 'string') {
            // Date string
            scheduleDate = new Date(scheduleData.date);
          }
        }
        
        if (scheduleDate && scheduleDate >= today) {
          scheduleMap.set(scheduleId, {
            scheduleId,
            date: scheduleDate,
            timeRanges: scheduleData.timeRanges || [],
            collectorName: scheduleData.collectorName || 'Collector',
            zone: scheduleData.zone || 'Unknown',
            availableSlots: scheduleData.availableSlots || 0,
            totalSlots: scheduleData.totalSlots || 0,
            wasteTypes: scheduleData.wasteTypes || [],
            status: scheduleData.status,
            stops: [],
          });
        }
      }

      // Add stop to the schedule entry
      if (scheduleMap.has(scheduleId)) {
        const entry = scheduleMap.get(scheduleId);
        const stopData = stopDoc.data();
        
        // Handle both old single-bin format and new multi-bin format
        if (stopData.bins && Array.isArray(stopData.bins)) {
          // New format: bins is an array
          entry.stops.push(...stopData.bins.map(bin => ({
            stopId: stopDoc.id,
            binId: bin.binId,
            binCode: bin.binCode,
            binCategory: bin.binCategory,
            address: stopData.address,
            status: stopData.status,
            wasteType: bin.wasteType,
          })));
        } else {
          // Old format: single bin fields (for backwards compatibility)
          entry.stops.push({
            stopId: stopDoc.id,
            binId: stopData.binId,
            binCode: stopData.binCode,
            binCategory: stopData.binCategory,
            address: stopData.address,
            status: stopData.status,
            wasteType: stopData.wasteType,
          });
        }
      }
    }

    const schedules = Array.from(scheduleMap.values());
    
    // Sort by date ascending (closest first)
    schedules.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date - b.date;
    });

    console.log('✅ Returning', schedules.length, 'upcoming schedules');
    return schedules;
  } catch (error) {
    console.error('❌ Error getting user schedules:', error);
    return [];
  }
}
