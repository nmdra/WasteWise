import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  BIN_CATEGORIES,
  BIN_CATEGORY_TO_WASTE_TYPE,
  normalizeWasteType,
} from '../constants/wasteTypes';

// Export for backwards compatibility
export { BIN_CATEGORIES };

// ==================== FETCH OPERATIONS ====================

/**
 * Get single bin by ID - OPTIMIZED
 */
export const getBinById = async (binId) => {
  try {
    const binDoc = await getDoc(doc(db, 'bins', binId));
    if (!binDoc.exists()) return null;
    return { id: binDoc.id, ...binDoc.data() };
  } catch (error) {
    console.error('Error fetching bin:', error);
    throw error;
  }
};

/**
 * Get user's bins - OPTIMIZED with limit
 */
export const getUserBins = async (userId, maxResults = 50) => {
  try {
    const q = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user bins:', error);
    return [];
  }
};

/**
 * Get user's active bins only - OPTIMIZED
 */
export const getUserActiveBins = async (userId) => {
  try {
    const q = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching active bins:', error);
    return [];
  }
};

/**
 * Get bin statistics - OPTIMIZED (calculates client-side from existing data)
 */
export const calculateBinStats = (bins) => {
  const active = bins.filter(b => b.isActive).length;
  const inactive = bins.length - active;
  const totalScans = bins.reduce((sum, b) => sum + (b.scanCount || 0), 0);
  
  return {
    total: bins.length,
    active,
    inactive,
    totalScans,
  };
};

/**
 * Real-time subscription - OPTIMIZED
 */
export const subscribeToUserBins = (userId, callback, maxResults = 50) => {
  const q = query(
    collection(db, 'bins'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  
  return onSnapshot(q, (snapshot) => {
    const bins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(bins);
  }, (error) => {
    console.error('Subscription error:', error);
    callback([]);
  });
};

// ==================== CREATE OPERATIONS ====================

/**
 * Create new bin - OPTIMIZED (no schedule logic here)
 */
export const createBin = async (userId, binData) => {
  try {
    const newBin = {
      userId,
      binId: binData.binId || `BIN-${Date.now()}`,
      category: binData.category,
      location: binData.location || '',
      description: binData.description || '',
      isActive: false, // Start inactive
      scanCount: 0,
      lastScanned: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'bins'), newBin);
    return { success: true, id: docRef.id, bin: { id: docRef.id, ...newBin } };
  } catch (error) {
    console.error('Error creating bin:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Update bin status ONLY - OPTIMIZED (no schedule logic)
 */
export const updateBinStatus = async (binId, isActive) => {
  try {
    console.log('📝 updateBinStatus called:', { binId, isActive });
    console.log('🗄️ Firestore updating...');
    await updateDoc(doc(db, 'bins', binId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Firestore update successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating bin status:', error);
    console.error('❌ Error details:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update bin details - OPTIMIZED
 */
export const updateBin = async (binId, updates) => {
  try {
    await updateDoc(doc(db, 'bins', binId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating bin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment scan count - OPTIMIZED (single field update)
 */
export const incrementBinScan = async (binId) => {
  try {
    const binRef = doc(db, 'bins', binId);
    const binDoc = await getDoc(binRef);
    
    if (!binDoc.exists()) {
      return { success: false, error: 'Bin not found' };
    }

    const currentCount = binDoc.data().scanCount || 0;
    
    await updateDoc(binRef, {
      scanCount: currentCount + 1,
      lastScanned: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, newCount: currentCount + 1 };
  } catch (error) {
    console.error('Error incrementing scan:', error);
    return { success: false, error: error.message };
  }
};

// ==================== DELETE OPERATIONS ====================

/**
 * Delete bin - OPTIMIZED (no schedule cleanup here)
 */
export const deleteBin = async (binId) => {
  try {
    await deleteDoc(doc(db, 'bins', binId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting bin:', error);
    return { success: false, error: error.message };
  }
};

// ==================== SCHEDULE OPERATIONS (Separate) ====================

/**
 * Add bin to schedules - PROPER SLOT CHECKING VERSION
 */
export const addBinToSchedules = async (binId) => {
  try {
    console.log('📍 addBinToSchedules:', binId);
    
    // STEP 1: Get bin data
    const bin = await getBinById(binId);
    if (!bin) {
      console.log('❌ Bin not found');
      return { success: false, error: 'Bin not found' };
    }
    console.log('✅ Found bin:', bin.binId, 'Category:', bin.category);

    // STEP 2: Get user info and zone
    const userDoc = await getDoc(doc(db, 'users', bin.userId));
    if (!userDoc.exists()) {
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const userZone = userData.zone;
    const userName = userData.displayName || 'Customer';
    const userAddress = userData.address || '';
    const userEmail = userData.email || '';
    
    console.log('✅ User zone:', userZone, 'Address:', userAddress);

    // STEP 3: Get normalized waste type from bin category
    const wasteType = normalizeWasteType(BIN_CATEGORY_TO_WASTE_TYPE[bin.category] || bin.category);
    
    if (!wasteType) {
      console.log('❌ Invalid waste type for bin category:', bin.category);
      return { success: false, error: 'Invalid waste type' };
    }
    
    console.log('🗑️ Waste type:', wasteType);
    
    // STEP 4: Find schedules in user's zone (active status, future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    console.log('📆 Searching schedules from:', today.toISOString());
    
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('zone', '==', userZone),
      where('status', '==', 'active'),
      orderBy('date', 'asc'),
      limit(20)
    );

    const schedulesSnapshot = await getDocs(schedulesQuery);
    console.log('📅 Found', schedulesSnapshot.docs.length, 'schedules in zone', userZone);
    
    let addedCount = 0;

    // STEP 5: Check each schedule for matching waste type and available slots
    for (const scheduleDoc of schedulesSnapshot.docs) {
      const scheduleData = scheduleDoc.data();
      const scheduleId = scheduleDoc.id;
      
      console.log(`\n� Checking schedule: ${scheduleId}`);
      console.log('   Date:', scheduleData.date);
      console.log('   Waste types:', scheduleData.wasteTypes);
      console.log('   Total slots:', scheduleData.totalSlots);
      console.log('   Available slots:', scheduleData.availableSlots);
      console.log('   Booked slots:', scheduleData.bookedSlots);
      
      // STEP 5.1: Check if waste types match
      const scheduleWasteTypes = (scheduleData.wasteTypes || []).map(t => normalizeWasteType(t)).filter(Boolean);
      const matchesWasteType = scheduleWasteTypes.includes(wasteType);
      
      if (!matchesWasteType) {
        console.log('   ❌ No match - schedule collects:', scheduleWasteTypes, 'Need:', wasteType);
        continue;
      }
      
      console.log('   ✅ Waste type matches!');
      
      // STEP 5.2: Check if slots are available
      const availableSlots = scheduleData.availableSlots || 0;
      const totalSlots = scheduleData.totalSlots || 20;
      const bookedSlots = scheduleData.bookedSlots || 0;
      
      if (availableSlots <= 0 && bookedSlots >= totalSlots) {
        console.log('   ⚠️ Schedule is full (booked:', bookedSlots, '/', totalSlots, ')');
        continue;
      }
      
      console.log('   ✅ Slots available:', availableSlots);
      
      try {
        // STEP 5.3: Check if stop already exists for this user on this schedule
        const existingStopsQuery = query(
          collection(db, 'schedules', scheduleId, 'stops'),
          where('userId', '==', bin.userId),
          where('status', '==', 'pending'),
          limit(1)
        );
        
        const existingStops = await getDocs(existingStopsQuery);
        
        if (!existingStops.empty) {
          // STEP 5.3.1: Update existing stop to add this bin
          const existingStopDoc = existingStops.docs[0];
          const existingStopData = existingStopDoc.data();
          
          console.log('   📝 Updating existing stop:', existingStopDoc.id);
          
          // Add bin to existing arrays
          const updatedBins = [...(existingStopData.bins || []), {
            binId: binId,
            binCode: bin.binId,
            binCategory: bin.category,
            wasteType: wasteType,
          }];
          
          const updatedCategories = [...(existingStopData.categories || []), bin.category];
          const uniqueCategories = [...new Set(updatedCategories)]; // Remove duplicates
          
          await updateDoc(doc(db, 'schedules', scheduleId, 'stops', existingStopDoc.id), {
            bins: updatedBins,
            categories: uniqueCategories,
            notes: `Multiple bins: ${uniqueCategories.join(', ')}`,
            updatedAt: serverTimestamp(),
          });
          
          console.log('   ✅ Added bin to existing stop');
          
        } else {
          // STEP 5.3.2: Create new stop with arrays
          const stopData = {
            userId: bin.userId,
            userName,
            userEmail,
            bins: [{
              binId: binId,
              binCode: bin.binId,
              binCategory: bin.category,
              wasteType: wasteType,
            }],
            categories: [bin.category],
            address: userAddress,
            zone: userZone,
            wasteTypes: [wasteType], // Keep for backwards compatibility
            type: 'customer',
            status: 'pending',
            collectedAt: null,
            notes: `Bin: ${BIN_CATEGORIES[bin.category]?.label}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          await addDoc(collection(db, 'schedules', scheduleId, 'stops'), stopData);
          console.log('   ✅ Created new stop with bin array');
          
          // STEP 5.4: Update schedule slot counts
          const newAvailableSlots = Math.max(0, availableSlots - 1);
          const newBookedSlots = bookedSlots + 1;
          
          await updateDoc(doc(db, 'schedules', scheduleId), {
            availableSlots: newAvailableSlots,
            bookedSlots: newBookedSlots,
            updatedAt: serverTimestamp(),
          });
          
          console.log('   ✅ Updated slots - Available:', newAvailableSlots, 'Booked:', newBookedSlots);
        }
        
        addedCount++;
        
      } catch (err) {
        console.error('   ❌ Error adding stop:', err.message);
      }
    }

    console.log(`\n✅ Total stops added: ${addedCount}`);
    return { success: true, count: addedCount };
    
  } catch (error) {
    console.error('❌ Error in addBinToSchedules:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Remove bin from schedules - UPDATED VERSION for array-based stops
 */
export const removeBinFromSchedules = async (binId) => {
  try {
    console.log('🗑️ removeBinFromSchedules STARTED:', binId);

    const bin = await getBinById(binId);
    if (!bin) {
      console.log('⚠️ Bin not found, skipping removal');
      return { success: true, count: 0 };
    }
    console.log('✅ Found bin:', bin.binId, 'User:', bin.userId);

    // Use collectionGroup to find ALL stops for this user (like getSchedulesForUser does)
    console.log('🔍 Using collectionGroup to find all stops for user:', bin.userId);
    const stopsQuery = query(
      collectionGroup(db, 'stops'),
      where('userId', '==', bin.userId),
      limit(50)
    );

    const stopsSnapshot = await getDocs(stopsQuery);
    console.log('📍 Found', stopsSnapshot.docs.length, 'stops for user across all schedules');

    let removedCount = 0;

    for (const stopDoc of stopsSnapshot.docs) {
      const stopData = stopDoc.data();
      const currentBins = stopData.bins || [];
      console.log(`   🗑️ Stop ${stopDoc.id} (${stopData.status}) has ${currentBins.length} bins:`, currentBins.map(b => b.binId));

      // Check if this bin is in the stop
      const binIndex = currentBins.findIndex(b => b.binId === binId);

      if (binIndex !== -1) {
        console.log(`   ✅ Found bin ${binId} at index ${binIndex}, removing it`);

        // Remove the bin from the array
        const updatedBins = currentBins.filter(b => b.binId !== binId);
        console.log(`   📝 After removal: ${updatedBins.length} bins remain:`, updatedBins.map(b => b.binId));

        // Get the schedule reference from the stop document
        const scheduleRef = stopDoc.ref.parent.parent;
        if (!scheduleRef) {
          console.log('   ❌ Could not get schedule reference');
          continue;
        }

        const scheduleId = scheduleRef.id;
        console.log('   📋 Processing stop in schedule:', scheduleId);

        if (updatedBins.length === 0) {
          // No bins left, delete the entire stop
          console.log('   🗑️ No bins remaining, deleting stop');
          await deleteDoc(stopDoc.ref);

          // Only restore slot if schedule is still active and stop was pending
          try {
            const scheduleDoc = await getDoc(scheduleRef);
            if (scheduleDoc.exists()) {
              const scheduleData = scheduleDoc.data();
              if (scheduleData.status === 'active' && stopData.status === 'pending') {
                const newAvailableSlots = scheduleData.availableSlots + 1;
                const newBookedSlots = Math.max(0, scheduleData.bookedSlots - 1);

                await updateDoc(scheduleRef, {
                  availableSlots: newAvailableSlots,
                  bookedSlots: newBookedSlots,
                  updatedAt: serverTimestamp(),
                });

                console.log(`   ✅ Restored slot: Available=${newAvailableSlots}, Booked=${newBookedSlots}`);
              }
            }
          } catch (e) {
            console.warn('   ⚠️ Failed to restore slot:', e.message);
          }

        } else {
          // Update stop with remaining bins
          console.log(`   📝 Updated stop with ${updatedBins.length} remaining bins`);
          const updatedCategories = updatedBins.map(b => b.binCategory);
          const uniqueCategories = [...new Set(updatedCategories)];

          await updateDoc(stopDoc.ref, {
            bins: updatedBins,
            categories: uniqueCategories,
            notes: `Multiple bins: ${uniqueCategories.join(', ')}`,
            updatedAt: serverTimestamp(),
          });

          console.log(`   ✅ Updated stop categories: ${uniqueCategories.join(', ')}`);
        }

        removedCount++;
      } else {
        console.log(`   ❌ Bin ${binId} not found in this stop`);
      }
    }

    console.log(`✅ removeBinFromSchedules COMPLETED: Removed bin from ${removedCount} stops`);
    return { success: true, count: removedCount };
  } catch (error) {
    console.error('❌ Error in removeBinFromSchedules:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return { success: true, count: 0 };
  }
};

// ==================== COMBINED OPERATIONS ====================

/**
 * Toggle bin status with schedule management - OPTIMIZED
 */
export const toggleBinStatus = async (binId, isActive) => {
  try {
    console.log('🔄 toggleBinStatus CALLED:', { binId, isActive });
    console.log('📍 Function starting...');

    // 1. Update bin status (fast operation)
    console.log('💾 Updating bin status in Firestore...');
    const updateResult = await updateBinStatus(binId, isActive);
    console.log('✅ Update result:', updateResult);
    if (!updateResult.success) {
      return updateResult;
    }

    // 2. Update schedules (wait for completion)
    let scheduleResult = { count: 0 };

    if (isActive) {
      // Add to schedules
      console.log('📅 Adding bin to schedules...');
      scheduleResult = await addBinToSchedules(binId);
      console.log('✅ Added to schedules:', scheduleResult.count);
    } else {
      // Remove from schedules
      console.log('📅 Removing bin from schedules...');
      scheduleResult = await removeBinFromSchedules(binId);
      console.log('✅ Removed from schedules:', scheduleResult.count);
    }

    // Return with schedule result
    console.log('🎉 Returning success response');
    return {
      success: true,
      message: isActive ? 'Bin activated' : 'Bin deactivated',
      count: scheduleResult.count,
    };
  } catch (error) {
    console.error('❌ toggleBinStatus error:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create bin and optionally activate - OPTIMIZED
 */
export const createAndActivateBin = async (userId, binData, shouldActivate = false) => {
  try {
    // 1. Create bin
    const createResult = await createBin(userId, binData);
    if (!createResult.success) {
      return createResult;
    }

    // 2. Activate if requested
    if (shouldActivate) {
      await updateBinStatus(createResult.id, true);
      
      // Add to schedules in background
      addBinToSchedules(createResult.id).catch(err => {
        console.warn('Schedule update failed:', err);
      });
    }

    return createResult;
  } catch (error) {
    console.error('Error creating and activating bin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete bin and remove from schedules - OPTIMIZED
 */
export const deleteBinCompletely = async (binId) => {
  try {
    // Remove from schedules first (in background)
    removeBinFromSchedules(binId).catch(err => {
      console.warn('Schedule cleanup failed:', err);
    });

    // Delete bin
    return await deleteBin(binId);
  } catch (error) {
    console.error('Error deleting bin:', error);
    return { success: false, error: error.message };
  }
};
