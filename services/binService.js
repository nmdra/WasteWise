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
    const binRef = doc(db, 'bins', binId);
    
    await updateDoc(binRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: isActive ? 'Bin activated successfully' : 'Bin deactivated successfully',
    };
  } catch (error) {
    console.error('Error toggling bin status:', error);
    throw error;
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
