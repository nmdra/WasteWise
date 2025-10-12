import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create a new booking request
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Created booking result
 */
export const createBooking = async (bookingData) => {
  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'pending',
      requestDate: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      bookingId: bookingRef.id,
      message: 'Booking request created successfully',
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get bookings for a specific customer
 * @param {string} customerId - Customer user ID
 * @returns {Promise<Array>} List of bookings
 */
export const getCustomerBookings = async (customerId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting customer bookings:', error);
    return [];
  }
};

/**
 * Subscribe to customer bookings (real-time)
 * @param {string} customerId - Customer user ID
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCustomerBookings = (customerId, callback) => {
  const q = query(
    collection(db, 'bookings'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(bookings);
  });
};

/**
 * Get pending bookings for a specific zone
 * @param {string} zone - Zone identifier (A, B, C, D, E)
 * @returns {Promise<Array>} List of pending bookings
 */
export const getPendingBookingsByZone = async (zone) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerZone', '==', zone),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting pending bookings:', error);
    return [];
  }
};

/**
 * Subscribe to pending bookings for a zone (real-time)
 * @param {string} zone - Zone identifier
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPendingBookingsByZone = (zone, callback) => {
  const q = query(
    collection(db, 'bookings'),
    where('customerZone', '==', zone),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(bookings);
  });
};

/**
 * Get all bookings for a specific zone (all statuses)
 * @param {string} zone - Zone identifier (A, B, C, D, E)
 * @returns {Promise<Array>} List of bookings
 */
export const getBookingsByZone = async (zone) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerZone', '==', zone),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting bookings by zone:', error);
    return [];
  }
};

/**
 * Subscribe to all bookings for a zone (real-time)
 * @param {string} zone - Zone identifier
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToBookingsByZone = (zone, callback) => {
  const q = query(
    collection(db, 'bookings'),
    where('customerZone', '==', zone),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(bookings);
  });
};

/**
 * Get a single booking by ID
 * @param {string} bookingId - Booking document ID
 * @returns {Promise<Object>} Booking data
 */
export const getBookingById = async (bookingId) => {
  try {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    
    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
};

/**
 * Approve a booking with visiting date
 * @param {string} bookingId - Booking document ID
 * @param {Object} approvalData - Approval information
 * @returns {Promise<Object>} Update result
 */
export const approveBooking = async (bookingId, approvalData) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    await updateDoc(bookingRef, {
      status: 'approved',
      visitingDate: approvalData.visitingDate,
      collectorId: approvalData.collectorId,
      collectorName: approvalData.collectorName,
      approvedDate: new Date().toISOString().slice(0, 10),
      approvalNotes: approvalData.notes || '',
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Booking approved successfully',
    };
  } catch (error) {
    console.error('Error approving booking:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking document ID
 * @param {string} status - New status (pending, approved, completed, cancelled)
 * @param {Object} additionalData - Optional additional data to update
 * @returns {Promise<Object>} Update result
 */
export const updateBookingStatus = async (bookingId, status, additionalData = {}) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    await updateDoc(bookingRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'completed' && { completedDate: new Date().toISOString().slice(0, 10) }),
      ...(status === 'cancelled' && { cancelledDate: new Date().toISOString().slice(0, 10) }),
      ...additionalData,
    });

    return {
      success: true,
      message: `Booking ${status} successfully`,
    };
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking document ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Update result
 */
export const cancelBooking = async (bookingId, reason) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledDate: new Date().toISOString().slice(0, 10),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get booking statistics for a collector
 * @param {string} collectorId - Collector user ID
 * @returns {Promise<Object>} Statistics object
 */
export const getCollectorBookingStats = async (collectorId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('collectorId', '==', collectorId)
    );

    const snapshot = await getDocs(q);
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
    };

    snapshot.forEach((doc) => {
      const status = doc.data().status;
      stats.total++;
      stats[status] = (stats[status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting collector booking stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
    };
  }
};

/**
 * Format booking date range
 * @param {Object} dateRange - Date range object with start and end
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (dateRange) => {
  if (!dateRange || !dateRange.start || !dateRange.end) return 'N/A';
  
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  return `${startStr} - ${endStr}`;
};

/**
 * Check if a date is within a date range
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @param {Object} dateRange - Date range object with start and end
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, dateRange) => {
  if (!date || !dateRange || !dateRange.start || !dateRange.end) return false;
  
  const checkDate = new Date(date);
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Get status color
 * @param {string} status - Booking status
 * @returns {string} Color code
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: '#F59E0B',
    approved: '#16A34A',
    completed: '#2563EB',
    cancelled: '#DC2626',
  };
  
  return colors[status] || '#6B7280';
};

/**
 * Get status icon
 * @param {string} status - Booking status
 * @returns {string} Emoji icon
 */
export const getStatusIcon = (status) => {
  const icons = {
    pending: '⏳',
    approved: '✅',
    completed: '🎉',
    cancelled: '❌',
  };
  
  return icons[status] || '📋';
};
