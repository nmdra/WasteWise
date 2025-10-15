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
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Bin Categories with icons and colors
 */
export const BIN_CATEGORIES = {
  paper: {
    label: 'Paper & Cardboard',
    icon: '📄',
    color: '#3B82F6',
    description: 'Newspapers, magazines, cardboard boxes',
  },
  glass: {
    label: 'Glass',
    icon: '🍾',
    color: '#10B981',
    description: 'Glass bottles and jars',
  },
  metal: {
    label: 'Metal',
    icon: '🥫',
    color: '#6B7280',
    description: 'Aluminum cans, tin cans, metal containers',
  },
  plastic: {
    label: 'Plastic & Polythene',
    icon: '♻️',
    color: '#F59E0B',
    description: 'Plastic bottles, containers, polythene bags',
  },
  organic: {
    label: 'Organic & Food Waste',
    icon: '🍂',
    color: '#84CC16',
    description: 'Food scraps, garden waste, compostable items',
  },
  hazardous: {
    label: 'Hazardous Waste',
    icon: '☢️',
    color: '#EF4444',
    description: 'Batteries, chemicals, electronic waste',
  },
  general: {
    label: 'General Waste',
    icon: '🗑️',
    color: '#8B5CF6',
    description: 'Mixed waste that doesn\'t fit other categories',
  },
};

/**
 * Map bin categories to schedule waste types
 * This allows matching bins to schedules that collect the same waste type
 */
export const BIN_TO_WASTE_TYPE_MAP = {
  paper: 'paper',
  glass: 'glass',
  metal: 'metal',
  plastic: 'plastic',
  organic: 'organic',
  hazardous: 'hazardous',
  general: 'general',
};

/**
 * Generate unique bin ID
 * Format: {userId}-{category}-{uniqueId}
 * Example: abc123-plastic-001
 */
export const generateBinId = (userId, category, existingBinsCount = 0) => {
  const uniqueNumber = String(existingBinsCount + 1).padStart(3, '0');
  return `${userId.slice(0, 8)}-${category}-${uniqueNumber}`;
};

/**
 * Create a new bin QR code
 * @param {Object} binData - Bin information
 * @returns {Promise<Object>} Created bin result
 */
export const createBin = async (binData) => {
  try {
    const { userId, category, description, location } = binData;

    // Check existing bins for this user and category to generate unique ID
    const existingBins = await getUserBinsByCategory(userId, category);
    const binId = generateBinId(userId, category, existingBins.length);

    const newBin = {
      binId,
      userId,
      category,
      description: description || '',
      location: location || '',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      qrCodeGenerated: true,
      lastScanned: null,
      scanCount: 0,
    };

    const binRef = await addDoc(collection(db, 'bins'), newBin);

    return {
      success: true,
      binId: binRef.id,
      binCode: binId,
      message: 'Bin QR code created successfully',
      bin: {
        id: binRef.id,
        ...newBin,
      },
    };
  } catch (error) {
    console.error('Error creating bin:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all bins for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of bins
 */
export const getUserBins = async (userId) => {
  try {
    const q = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bins = [];
    snapshot.forEach((doc) => {
      bins.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bins;
  } catch (error) {
    console.error('Error getting user bins:', error);
    return [];
  }
};

/**
 * Get bins by category for a user
 * @param {string} userId - User ID
 * @param {string} category - Bin category
 * @returns {Promise<Array>} List of bins
 */
export const getUserBinsByCategory = async (userId, category) => {
  try {
    const q = query(
      collection(db, 'bins'),
      where('userId', '==', userId),
      where('category', '==', category)
    );

    const snapshot = await getDocs(q);
    const bins = [];
    snapshot.forEach((doc) => {
      bins.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bins;
  } catch (error) {
    console.error('Error getting user bins by category:', error);
    return [];
  }
};

/**
 * Subscribe to user bins (real-time)
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserBins = (userId, callback) => {
  const q = query(
    collection(db, 'bins'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const bins = [];
    snapshot.forEach((doc) => {
      bins.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(bins);
  });
};

/**
 * Get a single bin by ID
 * @param {string} binId - Bin document ID
 * @returns {Promise<Object>} Bin data
 */
export const getBinById = async (binId) => {
  try {
    const binDoc = await getDoc(doc(db, 'bins', binId));
    
    if (binDoc.exists()) {
      return {
        id: binDoc.id,
        ...binDoc.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting bin:', error);
    throw error;
  }
};

/**
 * Get bin by QR code (binId field)
 * @param {string} binCode - Bin QR code
 * @returns {Promise<Object>} Bin data
 */
export const getBinByCode = async (binCode) => {
  try {
    const q = query(
      collection(db, 'bins'),
      where('binId', '==', binCode)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const binDoc = snapshot.docs[0];
      return {
        id: binDoc.id,
        ...binDoc.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting bin by code:', error);
    throw error;
  }
};

/**
 * Update bin information
 * @param {string} binId - Bin document ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Update result
 */
export const updateBin = async (binId, updates) => {
  try {
    const binRef = doc(db, 'bins', binId);
    
    await updateDoc(binRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Bin updated successfully',
    };
  } catch (error) {
    console.error('Error updating bin:', error);
    throw error;
  }
};

/**
 * Toggle bin active status
 * @param {string} binId - Bin document ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Update result
 */
export const toggleBinStatus = async (binId, isActive) => {
  try {
    console.log('🔄 toggleBinStatus called:', { binId, isActive });
    
    const binRef = doc(db, 'bins', binId);
    
    await updateDoc(binRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Bin status updated in database');

    let scheduleResult = { success: true, count: 0 };

    // If activating, create stops on future schedules
    if (isActive) {
      console.log('📅 Activating bin - adding to schedules...');
      const bin = await getBinById(binId);
      if (bin) {
        scheduleResult = await addBinToFutureSchedules(bin);
      }
    } else {
      // If deactivating, remove from future schedules
      console.log('🗑️ Deactivating bin - removing from schedules...');
      const bin = await getBinById(binId);
      if (bin) {
        scheduleResult = await removeBinFromFutureSchedules(bin);
      }
    }

    console.log('✅ Schedule update result:', scheduleResult);

    return {
      success: true,
      message: isActive ? 'Bin activated successfully' : 'Bin deactivated successfully',
      count: scheduleResult.count || 0,
    };
  } catch (error) {
    console.error('❌ Error toggling bin status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update bin status',
    };
  }
};

/**
 * Automatically add bin to all future schedules in the same zone and waste type
 * @param {Object} bin - Bin data with userId, category, etc.
 * @returns {Promise<Object>} Result with count of schedules updated
 */
export const addBinToFutureSchedules = async (bin) => {
  try {
    console.log('🚀 Adding bin to future schedules:', bin.id);

    // Get user profile to get zone and address
    const userDoc = await getDoc(doc(db, 'users', bin.userId));
    if (!userDoc.exists()) {
      console.log('⚠️ User not found:', bin.userId);
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const userZone = userData.zone;
    const userAddress = userData.address || 'Address not provided';
    const userName = userData.displayName || userData.firstName || 'Customer';

    if (!userZone) {
      console.log('⚠️ User has no zone assigned');
      return { success: false, error: 'User zone not found' };
    }

    // Map bin category to waste type
    const wasteType = BIN_TO_WASTE_TYPE_MAP[bin.category] || bin.category;

    // Find all future schedules in the same zone that collect this waste type
    const today = Timestamp.now();
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('zone', '==', userZone),
      where('status', '==', 'active'),
      where('date', '>=', today)
    );

    const schedulesSnapshot = await getDocs(schedulesQuery);

    if (schedulesSnapshot.empty) {
      console.log('⚠️ No future schedules found for zone:', userZone);
      return { success: true, message: 'No future schedules to add stop to', count: 0 };
    }

    // Filter schedules that collect this waste type
    const matchingSchedules = schedulesSnapshot.docs.filter(scheduleDoc => {
      const scheduleData = scheduleDoc.data();
      const wasteTypes = scheduleData.wasteTypes || [];
      return wasteTypes.includes(wasteType);
    });

    if (matchingSchedules.length === 0) {
      console.log('⚠️ No schedules found that collect', wasteType, 'in zone', userZone);
      return { success: true, message: `No schedules collecting ${wasteType} in your zone`, count: 0 };
    }

    console.log(`✅ Found ${matchingSchedules.length} matching schedules`);

    // Create stops for each matching schedule
    const stopPromises = matchingSchedules.map(async (scheduleDoc) => {
      // Check if stop already exists for this user on this schedule
      const existingStopsQuery = query(
        collection(db, 'schedules', scheduleDoc.id, 'stops'),
        where('userId', '==', bin.userId)
      );
      
      const existingStops = await getDocs(existingStopsQuery);
      
      if (!existingStops.empty) {
        console.log('⏭️  Stop already exists for user on schedule:', scheduleDoc.id);
        return null; // Skip if already exists
      }

      // Create stop
      return addDoc(collection(db, 'schedules', scheduleDoc.id, 'stops'), {
        userId: bin.userId,
        userName: userName,
        binId: bin.id,
        binCategory: bin.category,
        binCode: bin.binId,
        address: userAddress,
        zone: userZone,
        type: 'customer',
        status: 'pending',
        collectedAt: null,
        notes: `Auto-added from ${BIN_CATEGORIES[bin.category]?.label || bin.category} bin activation`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const results = await Promise.all(stopPromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`✅ Created ${successCount} stops on future schedules`);

    return {
      success: true,
      count: successCount,
      message: `Added to ${successCount} future collection schedule(s)`,
    };
  } catch (error) {
    console.error('❌ Error adding bin to future schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove bin from all future schedules
 * @param {Object} bin - Bin data
 * @returns {Promise<Object>} Result with count of stops removed
 */
export const removeBinFromFutureSchedules = async (bin) => {
  try {
    console.log('🗑️  Removing bin from future schedules:', bin.id);

    // Find all future schedules
    const today = Timestamp.now();
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('status', '==', 'active'),
      where('date', '>=', today)
    );

    const schedulesSnapshot = await getDocs(schedulesQuery);

    if (schedulesSnapshot.empty) {
      return { success: true, count: 0 };
    }

    let removedCount = 0;

    // For each schedule, find and remove stops for this bin
    for (const scheduleDoc of schedulesSnapshot.docs) {
      try {
        const stopsQuery = query(
          collection(db, 'schedules', scheduleDoc.id, 'stops'),
          where('binId', '==', bin.id),
          where('status', '==', 'pending') // Only remove pending stops
        );

        const stopsSnapshot = await getDocs(stopsQuery);

        for (const stopDoc of stopsSnapshot.docs) {
          try {
            await updateDoc(doc(db, 'schedules', scheduleDoc.id, 'stops', stopDoc.id), {
              status: 'cancelled',
              notes: 'Bin deactivated by customer',
              updatedAt: serverTimestamp(),
            });
            removedCount++;
          } catch (updateError) {
            // Log but don't fail - might be blocked by ad blocker
            console.warn('⚠️  Failed to update stop (may be blocked by extension):', updateError.code);
          }
        }
      } catch (queryError) {
        // Log but continue with other schedules
        console.warn('⚠️  Failed to query stops (may be blocked by extension):', queryError.code);
      }
    }

    console.log(`✅ Removed/cancelled ${removedCount} stops from future schedules`);

    return {
      success: true,
      count: removedCount,
      message: removedCount > 0 
        ? `Removed from ${removedCount} future schedule(s)` 
        : 'Bin deactivated (no future pickups found)',
    };
  } catch (error) {
    console.error('❌ Error removing bin from future schedules:', error);
    // Return success even if some operations failed due to ad blocker
    return { 
      success: true, 
      count: 0,
      message: 'Bin deactivated',
    };
  }
};

/**
 * Record bin scan
 * @param {string} binCode - Bin QR code
 * @param {Object} scanData - Scan information
 * @returns {Promise<Object>} Update result
 */
export const recordBinScan = async (binCode, scanData = {}) => {
  try {
    const bin = await getBinByCode(binCode);
    
    if (!bin) {
      return {
        success: false,
        error: 'Bin not found',
      };
    }

    const binRef = doc(db, 'bins', bin.id);
    
    await updateDoc(binRef, {
      lastScanned: new Date().toISOString(),
      scanCount: (bin.scanCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    // Optionally log the scan
    if (scanData.logScan) {
      await addDoc(collection(db, 'binScans'), {
        binId: bin.id,
        binCode: bin.binId,
        userId: bin.userId,
        category: bin.category,
        scannedAt: serverTimestamp(),
        scannedBy: scanData.scannedBy || null,
        location: scanData.location || null,
        notes: scanData.notes || '',
      });
    }

    return {
      success: true,
      message: 'Bin scan recorded',
      bin,
    };
  } catch (error) {
    console.error('Error recording bin scan:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get bin statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics object
 */
export const getUserBinStats = async (userId) => {
  try {
    const bins = await getUserBins(userId);
    
    const stats = {
      total: bins.length,
      active: bins.filter(b => b.isActive).length,
      inactive: bins.filter(b => !b.isActive).length,
      byCategory: {},
      totalScans: bins.reduce((sum, b) => sum + (b.scanCount || 0), 0),
    };

    // Count by category
    Object.keys(BIN_CATEGORIES).forEach(category => {
      stats.byCategory[category] = bins.filter(b => b.category === category).length;
    });

    return stats;
  } catch (error) {
    console.error('Error getting bin stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byCategory: {},
      totalScans: 0,
    };
  }
};

/**
 * Check if bin ID already exists
 * @param {string} binCode - Bin QR code
 * @returns {Promise<boolean>} True if exists
 */
export const checkBinExists = async (binCode) => {
  try {
    const bin = await getBinByCode(binCode);
    return bin !== null;
  } catch (error) {
    console.error('Error checking bin existence:', error);
    return false;
  }
};

/**
 * Get bin with owner details
 * @param {string} binId - Bin document ID
 * @returns {Promise<Object>} Bin data with owner information
 */
export const getBinWithOwner = async (binId) => {
  try {
    // Get bin data
    const bin = await getBinById(binId);
    if (!bin) {
      return null;
    }

    // Get owner data
    const ownerDoc = await getDoc(doc(db, 'users', bin.userId));
    const owner = ownerDoc.exists() ? { id: ownerDoc.id, ...ownerDoc.data() } : null;

    return {
      bin,
      owner
    };
  } catch (error) {
    console.error('Error getting bin with owner:', error);
    throw error;
  }
};

/**
 * Validate Firebase document ID format
 * @param {string} docId - Document ID to validate
 * @returns {boolean} True if valid format
 */
export const isValidFirebaseDocId = (docId) => {
  if (!docId || typeof docId !== 'string') return false;
  
  // Firebase document IDs are typically 20 characters long
  // but can be shorter or longer depending on how they were generated
  const trimmedId = docId.trim();
  
  // Basic validation: length between 10-30 characters, alphanumeric
  if (trimmedId.length < 10 || trimmedId.length > 30) return false;
  
  // Check if it contains only valid characters (alphanumeric)
  const validPattern = /^[a-zA-Z0-9]+$/;
  return validPattern.test(trimmedId);
};
