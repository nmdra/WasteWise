import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a main stop when collector creates schedule
 * Stops are stored as a subcollection under the schedule
 */
export const createMainStop = async (scheduleId, stopData) => {
  try {
    console.log('📍 Creating main stop for schedule:', scheduleId, stopData);
    
    const stopRef = await addDoc(collection(db, 'schedules', scheduleId, 'stops'), {
      ...stopData,
      type: 'main',
      status: 'pending',
      collectedAt: null,
      notes: stopData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Main stop created with ID:', stopRef.id);
    return { success: true, stopId: stopRef.id };
  } catch (error) {
    console.error('❌ Error creating main stop:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a customer stop when customer registers
 * Adds customer as a stop to all active schedules in their zone
 */
export const createCustomerStop = async (customerId, customerData) => {
  try {
    console.log('📍 Creating customer stop for:', customerId);
    
    // Find active schedules in customer's zone
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('zone', '==', customerData.zone),
      where('status', '==', 'active')
    );
    
    const schedulesSnapshot = await getDocs(schedulesQuery);
    
    if (schedulesSnapshot.empty) {
      console.log('⚠️ No active schedules found for zone:', customerData.zone);
      return { success: true, message: 'No active schedules to add stop to' };
    }
    
    // Create stop as subcollection under each active schedule
    const stopPromises = schedulesSnapshot.docs.map(scheduleDoc => {
      return addDoc(collection(db, 'schedules', scheduleDoc.id, 'stops'), {
        customerId: customerId,
        address: customerData.address || 'Address not provided',
        zone: customerData.zone,
        type: 'customer',
        status: 'pending',
        collectedAt: null,
        notes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await Promise.all(stopPromises);
    
    console.log('✅ Customer stops created for', stopPromises.length, 'schedules');
    return { success: true, count: stopPromises.length };
  } catch (error) {
    console.error('❌ Error creating customer stop:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch create main stops for a schedule
 * Stores stops as subcollection under the schedule
 */
export const createMainStopsForSchedule = async (scheduleId, stops) => {
  try {
    console.log('📍 Creating', stops.length, 'main stops for schedule:', scheduleId);
    
    const stopPromises = stops.map(stop => {
      return addDoc(collection(db, 'schedules', scheduleId, 'stops'), {
        address: stop.address,
        zone: stop.zone,
        type: 'main',
        status: 'pending',
        collectedAt: null,
        notes: stop.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    const results = await Promise.all(stopPromises);
    
    console.log('✅ Created', results.length, 'main stops');
    return { success: true, count: results.length };
  } catch (error) {
    console.error('❌ Error creating main stops:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all stops for a specific schedule from subcollection
 */
export const getStopsBySchedule = async (scheduleId) => {
  try {
    console.log('📍 Fetching stops for schedule:', scheduleId);
    
    const stopsQuery = query(
      collection(db, 'schedules', scheduleId, 'stops'),
      orderBy('createdAt', 'asc')
    );
    
    const stopsSnapshot = await getDocs(stopsQuery);
    
    const stops = stopsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      collectedAt: doc.data().collectedAt?.toDate()
    }));
    
    console.log('✅ Found', stops.length, 'stops');
    return stops;
  } catch (error) {
    console.error('❌ Error fetching stops:', error);
    return [];
  }
};

/**
 * Subscribe to stops for a schedule (real-time)
 * Listens to stops subcollection under the schedule
 */
export const subscribeToStopsBySchedule = (scheduleId, callback) => {
  console.log('📍 Subscribing to stops for schedule:', scheduleId);
  
  const stopsQuery = query(
    collection(db, 'schedules', scheduleId, 'stops'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(stopsQuery, (snapshot) => {
    const stops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      collectedAt: doc.data().collectedAt?.toDate()
    }));
    
    console.log('📍 Real-time update:', stops.length, 'stops');
    callback(stops);
  }, (error) => {
    console.error('❌ Error in stops subscription:', error);
    callback([]);
  });
};

/**
 * Get stop statistics for a schedule
 */
export const getStopStats = async (scheduleId) => {
  try {
    const stops = await getStopsBySchedule(scheduleId);
    
    const stats = {
      total: stops.length,
      mainStops: stops.filter(s => s.type === 'main').length,
      customerStops: stops.filter(s => s.type === 'customer').length,
      pending: stops.filter(s => s.status === 'pending').length,
      collected: stops.filter(s => s.status === 'collected').length,
      skipped: stops.filter(s => s.status === 'skipped').length
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting stop stats:', error);
    return {
      total: 0,
      mainStops: 0,
      customerStops: 0,
      pending: 0,
      collected: 0,
      skipped: 0
    };
  }
};

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Mark a stop as collected
 */
export const markStopAsCollected = async (scheduleId, stopId, notes = '') => {
  try {
    console.log('✅ Marking stop as collected:', stopId);
    
    const stopRef = doc(db, 'schedules', scheduleId, 'stops', stopId);
    await updateDoc(stopRef, {
      status: 'collected',
      collectedAt: serverTimestamp(),
      notes: notes,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Stop marked as collected');
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking stop as collected:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a stop as skipped
 */
export const markStopAsSkipped = async (scheduleId, stopId, reason = '') => {
  try {
    console.log('⏭️ Marking stop as skipped:', stopId);
    
    const stopRef = doc(db, 'schedules', scheduleId, 'stops', stopId);
    await updateDoc(stopRef, {
      status: 'skipped',
      notes: reason,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Stop marked as skipped');
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking stop as skipped:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update stop details
 */
export const updateStop = async (scheduleId, stopId, updates) => {
  try {
    console.log('📍 Updating stop:', stopId);
    
    const stopRef = doc(db, 'schedules', scheduleId, 'stops', stopId);
    await updateDoc(stopRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Stop updated');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating stop:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a stop
 */
export const deleteStop = async (scheduleId, stopId) => {
  try {
    console.log('🗑️ Deleting stop:', stopId);
    
    await deleteDoc(doc(db, 'schedules', scheduleId, 'stops', stopId));
    
    console.log('✅ Stop deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting stop:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all stops for a schedule (subcollection)
 */
export const deleteStopsBySchedule = async (scheduleId) => {
  try {
    console.log('🗑️ Deleting all stops for schedule:', scheduleId);
    
    const stops = await getStopsBySchedule(scheduleId);
    
    const deletePromises = stops.map(stop => 
      deleteDoc(doc(db, 'schedules', scheduleId, 'stops', stop.id))
    );
    
    await Promise.all(deletePromises);
    
    console.log('✅ Deleted', stops.length, 'stops');
    return { success: true, count: stops.length };
  } catch (error) {
    console.error('❌ Error deleting stops:', error);
    return { success: false, error: error.message };
  }
};
