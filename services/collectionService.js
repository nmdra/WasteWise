import { addDoc, collection, doc, getDocs, increment, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Collection Service for managing waste collection records
 */
export const collectionService = {
  /**
   * Create a new collection record after QR scan
   * @param {Object} collectionData - Collection data
   * @param {string} collectionData.binId - Bin ID (binId field from bins collection)
   * @param {string} collectionData.userId - User ID of cleaner
   * @param {string} collectionData.scannedAt - ISO timestamp of scan
   * @param {Array} collectionData.wasteTypes - Array of waste types
   * @param {string} collectionData.status - Collection status
   * @param {string} collectionData.notes - Additional notes
   * @param {string} collectionData.binDocId - Firebase document ID of the bin
   * @param {string} collectionData.ownerId - Owner user ID
   * @param {string} collectionData.ownerName - Owner display name
   * @param {number} collectionData.weight - Weight in kg
   * @param {string} collectionData.location - Location details
   * @param {string} collectionData.stopId - Stop ID (optional)
   * @returns {Promise<Object>} Created collection document
   */
  async createCollection(collectionData) {
    try {
      const collectionRef = collection(db, 'collections');

      const docData = {
        binId: collectionData.binId,
        userId: collectionData.userId || auth.currentUser?.uid,
        scannedAt: Timestamp.fromDate(new Date(collectionData.scannedAt)),
        collectedAt: Timestamp.now(),
        wasteTypes: collectionData.wasteTypes || [],
        status: collectionData.status || 'collected',
        notes: collectionData.notes || '',
        location: collectionData.location || null,
        stopId: collectionData.stopId || null,
        binDocId: collectionData.binDocId || null, // Firebase document ID of the bin
        ownerId: collectionData.ownerId || null, // Owner user ID
        ownerName: collectionData.ownerName || null, // Owner display name
        weight: collectionData.weight || null, // Weight in kg if provided
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collectionRef, docData);

      // Update bin's last scanned timestamp and scan count
      if (collectionData.binDocId) {
        try {
          const binRef = doc(db, 'bins', collectionData.binDocId);
          await updateDoc(binRef, {
            lastScanned: Timestamp.now(),
            scanCount: increment(1),
            updatedAt: Timestamp.now()
          });
          console.log('✅ Updated bin scan data successfully');
        } catch (binUpdateError) {
          console.warn('⚠️ Failed to update bin scan data:', binUpdateError);
          // Don't fail the collection if bin update fails
        }
      }

      return {
        id: docRef.id,
        ...docData
      };
    } catch (error) {
      console.error('❌ Error creating collection:', error);
      throw error;
    }
  },

  /**
   * Update stop status after collection
   * @param {string} stopId - Stop ID
   * @param {string} status - New status
   */
  async updateStopStatus(stopId, status) {
    try {
      // Find the stop document (this might be in schedules collection)
      const schedulesRef = collection(db, 'schedules');
      const q = query(schedulesRef, where('stops', 'array-contains', { stopId }));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const scheduleDoc = querySnapshot.docs[0];
        const scheduleData = scheduleDoc.data();

        // Update the specific stop in the stops array
        const updatedStops = scheduleData.stops.map(stop =>
          stop.stopId === stopId ? { ...stop, status } : stop
        );

        await updateDoc(scheduleDoc.ref, {
          stops: updatedStops,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating stop status:', error);
      throw error;
    }
  },

  /**
   * Get collections for a specific user (cleaner)
   * @param {string} userId - User ID (cleaner)
   * @param {Date} startDate - Start date filter
   * @param {Date} endDate - End date filter
   * @returns {Promise<Array>} Array of collection records
   */
  async getCollectionsByUser(userId, startDate = null, endDate = null) {
    try {
      const collectionRef = collection(db, 'collections');
      let q = query(collectionRef, where('userId', '==', userId));

      if (startDate && endDate) {
        q = query(
          collectionRef,
          where('userId', '==', userId),
          where('collectedAt', '>=', Timestamp.fromDate(startDate)),
          where('collectedAt', '<=', Timestamp.fromDate(endDate))
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectedAt: doc.data().collectedAt?.toDate(),
        scannedAt: doc.data().scannedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  },

  /**
   * Get collections for a specific owner (customer)
   * @param {string} ownerId - Owner user ID (customer)
   * @param {Date} startDate - Start date filter
   * @param {Date} endDate - End date filter
   * @returns {Promise<Array>} Array of collection records
   */
  async getCollectionsByOwner(ownerId, startDate = null, endDate = null) {
    try {
      const collectionRef = collection(db, 'collections');
      let q = query(
        collectionRef, 
        where('ownerId', '==', ownerId),
        orderBy('collectedAt', 'desc')
      );

      if (startDate && endDate) {
        q = query(
          collectionRef,
          where('ownerId', '==', ownerId),
          where('collectedAt', '>=', Timestamp.fromDate(startDate)),
          where('collectedAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('collectedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectedAt: doc.data().collectedAt?.toDate(),
        scannedAt: doc.data().scannedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting collections by owner:', error);
      throw error;
    }
  },

  /**
   * Get collections for a specific bin
   * @param {string} binId - Bin ID
   * @returns {Promise<Array>} Array of collection records
   */
  async getCollectionsByBin(binId) {
    try {
      const collectionRef = collection(db, 'collections');
      const q = query(collectionRef, where('binId', '==', binId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectedAt: doc.data().collectedAt?.toDate(),
        scannedAt: doc.data().scannedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting collections by bin:', error);
      throw error;
    }
  },

  /**
   * Get recent collections for dashboard/analytics
   * @param {number} limit - Number of collections to fetch
   * @returns {Promise<Array>} Array of recent collection records
   */
  async getRecentCollections(limit = 50) {
    try {
      const collectionRef = collection(db, 'collections');
      const q = query(
        collectionRef, 
        orderBy('collectedAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectedAt: doc.data().collectedAt?.toDate(),
        scannedAt: doc.data().scannedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting recent collections:', error);
      throw error;
    }
  },

  /**
   * Get collection statistics
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Collection statistics
   */
  async getCollectionStats(userId = null) {
    try {
      const collectionRef = collection(db, 'collections');
      let q = userId 
        ? query(collectionRef, where('userId', '==', userId))
        : collectionRef;

      const querySnapshot = await getDocs(q);
      const collections = querySnapshot.docs.map(doc => doc.data());

      const stats = {
        total: collections.length,
        byWasteType: {},
        totalWeight: 0,
        avgWeight: 0,
        byStatus: {}
      };

      collections.forEach(collection => {
        // Count by waste type
        (collection.wasteTypes || []).forEach(type => {
          stats.byWasteType[type] = (stats.byWasteType[type] || 0) + 1;
        });

        // Calculate weight
        if (collection.weight) {
          stats.totalWeight += collection.weight;
        }

        // Count by status
        const status = collection.status || 'collected';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      // Calculate average weight
      const collectionsWithWeight = collections.filter(c => c.weight > 0);
      if (collectionsWithWeight.length > 0) {
        stats.avgWeight = stats.totalWeight / collectionsWithWeight.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return { total: 0, byWasteType: {}, totalWeight: 0, avgWeight: 0, byStatus: {} };
    }
  },

  /**
   * Report an issue with a collection
   * @param {string} collectionId - Collection ID
   * @param {string} issueType - Type of issue
   * @param {string} description - Issue description
   * @param {Array} photos - Array of photo URLs (optional)
   */
  async reportIssue(collectionId, issueType, description, photos = []) {
    try {
      const collectionRef = doc(db, 'collections', collectionId);

      await updateDoc(collectionRef, {
        issue: {
          type: issueType,
          description,
          photos,
          reportedAt: Timestamp.now(),
          status: 'reported'
        },
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  }
};

export default collectionService;