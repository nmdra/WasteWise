import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BIN_CATEGORIES, BIN_CATEGORY_TO_WASTE_TYPE, normalizeWasteType } from '../constants/wasteTypes';

/**
 * Get upcoming pickups for customer's active bins
 * Shows the next scheduled pickup for each bin type
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of upcoming pickups with schedule details
 */
export const getUpcomingPickups = async (userId) => {
  try {
    console.log('📅 Getting upcoming pickups for user:', userId);

    // Get user's active bins
    const binsQuery = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const binsSnapshot = await getDocs(binsQuery);

    if (binsSnapshot.empty) {
      return [];
    }

    const activeBins = binsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get user's zone
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }

    const userZone = userDoc.data().zone;

    if (!userZone) {
      return [];
    }

    // Get all future schedules in user's zone
    const today = Timestamp.now();
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('zone', '==', userZone),
      where('status', '==', 'active'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );

    const schedulesSnapshot = await getDocs(schedulesQuery);

    if (schedulesSnapshot.empty) {
      // Return bins with no pickups scheduled
      return activeBins.map(bin => ({
        binId: bin.id,
        binCode: bin.binId,
        category: bin.category,
        categoryLabel: BIN_CATEGORIES[bin.category]?.label || bin.category,
        icon: BIN_CATEGORIES[bin.category]?.icon || '🗑️',
        color: BIN_CATEGORIES[bin.category]?.color || '#6B7280',
        nextPickup: null,
        hasPickup: false,
      }));
    }

    // For each bin, find the next matching schedule
    const pickups = await Promise.all(
      activeBins.map(async (bin) => {
        const wasteType = normalizeWasteType(BIN_CATEGORY_TO_WASTE_TYPE[bin.category] || bin.category);
        console.log(`   🔍 Looking for schedule for bin ${bin.binId} (${bin.category}) -> waste type: ${wasteType}`);

        // Find the first schedule that collects this waste type
        const matchingSchedule = schedulesSnapshot.docs.find(scheduleDoc => {
          const scheduleData = scheduleDoc.data();
          const wasteTypes = scheduleData.wasteTypes || [];
          console.log(`      📋 Checking schedule ${scheduleDoc.id}: wasteTypes=${wasteTypes.join(', ')}`);
          
          // Case-insensitive matching
          const matches = wasteTypes.some(wt => wt.toLowerCase() === wasteType.toLowerCase());
          console.log(`         ${matches ? '✅ MATCH' : '❌ No match'}`);
          return matches;
        });

        if (!matchingSchedule) {
          console.log(`   ❌ No matching schedule found for bin ${bin.binId}`);
          return {
            binId: bin.id,
            binCode: bin.binId,
            category: bin.category,
            categoryLabel: BIN_CATEGORIES[bin.category]?.label || bin.category,
            icon: BIN_CATEGORIES[bin.category]?.icon || '🗑️',
            color: BIN_CATEGORIES[bin.category]?.color || '#6B7280',
            nextPickup: null,
            hasPickup: false,
          };
        }

        const scheduleData = matchingSchedule.data();

        // Check if this specific bin has a stop on this schedule
        const stopsQuery = query(
          collection(db, 'schedules', matchingSchedule.id, 'stops'),
          where('userId', '==', userId),
          where('binId', '==', bin.id)
        );
        
        const stopsSnapshot = await getDocs(stopsQuery);
        const hasStop = !stopsSnapshot.empty;
        
        console.log(`   🔍 Bin ${bin.binId} (${bin.category}) -> Schedule ${matchingSchedule.id}:`, 
          hasStop ? '✅ Stop found' : '⚠️ No stop');

        return {
          binId: bin.id,
          binCode: bin.binId,
          category: bin.category,
          categoryLabel: BIN_CATEGORIES[bin.category]?.label || bin.category,
          icon: BIN_CATEGORIES[bin.category]?.icon || '🗑️',
          color: BIN_CATEGORIES[bin.category]?.color || '#6B7280',
          nextPickup: {
            scheduleId: matchingSchedule.id,
            date: scheduleData.date?.toDate(),
            timeRanges: scheduleData.timeRanges || [],
            collectorName: scheduleData.collectorName || 'Collector',
            zone: scheduleData.zone || userZone,
            availableSlots: scheduleData.availableSlots || 0,
            wasteTypes: scheduleData.wasteTypes || [],
            hasStop: hasStop,
          },
          hasPickup: true,
        };
      })
    );

    console.log(`✅ Found ${pickups.length} bin pickups`);
    return pickups;
  } catch (error) {
    console.error('❌ Error getting upcoming pickups:', error);
    return [];
  }
};

/**
 * Refresh pickup schedules for all active bins
 * Optimizes stops by keeping only the closest schedule for each bin type
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with count of schedules updated
 */
export const refreshPickupSchedules = async (userId) => {
  try {
    console.log('🔄 Refreshing pickup schedules for user:', userId);

    // Get user's active bins
    const binsQuery = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const binsSnapshot = await getDocs(binsQuery);

    if (binsSnapshot.empty) {
      return { success: true, message: 'No active bins', added: 0, removed: 0 };
    }

    const activeBins = binsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const userZone = userData.zone;
    const userAddress = userData.address || 'Address not provided';
    const userName = userData.displayName || userData.firstName || 'Customer';

    if (!userZone) {
      return { success: false, error: 'User zone not found' };
    }

    // Get all future schedules in user's zone
    const today = Timestamp.now();
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('zone', '==', userZone),
      where('status', '==', 'active'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );

    const schedulesSnapshot = await getDocs(schedulesQuery);

    if (schedulesSnapshot.empty) {
      return { success: true, message: 'No future schedules found', added: 0, removed: 0 };
    }

    let addedCount = 0;
    let removedCount = 0;

    // For each bin category, keep only the closest schedule
    for (const bin of activeBins) {
      const wasteType = normalizeWasteType(BIN_CATEGORY_TO_WASTE_TYPE[bin.category] || bin.category);

      // Find all schedules that collect this waste type
      const matchingSchedules = schedulesSnapshot.docs.filter(scheduleDoc => {
        const scheduleData = scheduleDoc.data();
        const wasteTypes = scheduleData.wasteTypes || [];
        // Case-insensitive matching
        return wasteTypes.some(wt => normalizeWasteType(wt) === wasteType);
      });

      if (matchingSchedules.length === 0) {
        continue;
      }

      // Get the closest schedule (first one since they're ordered by date)
      const closestSchedule = matchingSchedules[0];

      // Check existing stops for this user on all matching schedules
      for (let i = 0; i < matchingSchedules.length; i++) {
        const scheduleDoc = matchingSchedules[i];
        const isClosest = i === 0;

        const stopsQuery = query(
          collection(db, 'schedules', scheduleDoc.id, 'stops'),
          where('userId', '==', userId),
          where('binId', '==', bin.id)
        );

        const stopsSnapshot = await getDocs(stopsQuery);

        if (isClosest) {
          // This is the closest schedule - ensure stop exists
          if (stopsSnapshot.empty) {
            // Add stop
            await addDoc(collection(db, 'schedules', scheduleDoc.id, 'stops'), {
              userId: userId,
              userName: userName,
              binId: bin.id,
              binCategory: bin.category,
              binCode: bin.binId,
              address: userAddress,
              zone: userZone,
              type: 'customer',
              status: 'pending',
              collectedAt: null,
              notes: `Auto-added via pickup refresh for ${BIN_CATEGORIES[bin.category]?.label || bin.category}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            addedCount++;
          }
        } else {
          // This is NOT the closest schedule - remove stops
          for (const stopDoc of stopsSnapshot.docs) {
            if (stopDoc.data().status === 'pending') {
              await updateDoc(doc(db, 'schedules', scheduleDoc.id, 'stops', stopDoc.id), {
                status: 'cancelled',
                notes: 'Removed by pickup refresh - keeping only closest schedule',
                updatedAt: serverTimestamp(),
              });
              removedCount++;
            }
          }
        }
      }
    }

    console.log(`✅ Refresh complete: +${addedCount} stops, -${removedCount} duplicates`);

    return {
      success: true,
      added: addedCount,
      removed: removedCount,
      message: `Updated ${addedCount + removedCount} schedule(s)`,
    };
  } catch (error) {
    console.error('❌ Error refreshing pickup schedules:', error);
    return { success: false, error: error.message };
  }
};
