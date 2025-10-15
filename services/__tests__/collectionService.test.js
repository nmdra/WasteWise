import { collectionService } from '../collectionService';

describe('collectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollection', () => {
    it('should create a collection record successfully', async () => {
      const mockCollectionData = {
        binId: 'bin_1234',
        userId: 'user_123',
        scannedAt: new Date().toISOString(),
        wasteTypes: ['general', 'recyclables'],
        status: 'collected',
        notes: 'Test collection',
        binDocId: 'doc_123',
        ownerId: 'owner_123',
        ownerName: 'John Doe',
        weight: 5.5,
        location: 'Colombo',
      };

      const result = await collectionService.createCollection(mockCollectionData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.binId).toBe('bin_1234');
      expect(result.status).toBe('collected');
    });

    it('should handle creation with minimal data', async () => {
      const mockCollectionData = {
        binId: 'bin_5678',
        userId: 'user_456',
        scannedAt: new Date().toISOString(),
        wasteTypes: ['organic'],
        status: 'pending',
      };

      const result = await collectionService.createCollection(mockCollectionData);

      expect(result).toBeDefined();
      expect(result.binId).toBe('bin_5678');
      expect(result.status).toBe('pending');
    });

    it('should handle missing wasteTypes gracefully', async () => {
      const mockCollectionData = {
        binId: 'bin_999',
        userId: 'user_789',
        scannedAt: new Date().toISOString(),
        status: 'collected',
      };

      const result = await collectionService.createCollection(mockCollectionData);

      expect(result).toBeDefined();
      expect(result.wasteTypes).toEqual([]);
    });

    it('should throw error for missing required fields', async () => {
      const invalidData = {
        userId: 'user_123',
      };

      await expect(
        collectionService.createCollection(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('updateStopStatus', () => {
    it('should update stop status to completed', async () => {
      const result = await collectionService.updateStopStatus('stop_123', 'completed');

      expect(result).toBeUndefined(); // Function returns void
    });

    it('should update stop status to pending', async () => {
      const result = await collectionService.updateStopStatus('stop_456', 'pending');

      expect(result).toBeUndefined();
    });

    it('should handle non-existent stop ID', async () => {
      await expect(
        collectionService.updateStopStatus('invalid_stop', 'completed')
      ).rejects.toThrow();
    });
  });

  describe('getCollectionsByUser', () => {
    it('should retrieve collections for a user without date filters', async () => {
      const collections = await collectionService.getCollectionsByUser('user_123');

      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve collections with date filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const collections = await collectionService.getCollectionsByUser(
        'user_123',
        startDate,
        endDate
      );

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should return empty array for user with no collections', async () => {
      const collections = await collectionService.getCollectionsByUser('new_user');

      expect(collections).toEqual([]);
    });
  });

  describe('getCollectionsByOwner', () => {
    it('should retrieve collections for an owner', async () => {
      const collections = await collectionService.getCollectionsByOwner('owner_123');

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should filter collections by date range', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      const collections = await collectionService.getCollectionsByOwner(
        'owner_123',
        startDate,
        endDate
      );

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should return empty array for non-existent owner', async () => {
      const collections = await collectionService.getCollectionsByOwner('fake_owner');

      expect(collections).toEqual([]);
    });
  });

  describe('getCollectionsByBin', () => {
    it('should retrieve collections for a specific bin', async () => {
      const collections = await collectionService.getCollectionsByBin('bin_1234');

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should return empty array for bin with no collections', async () => {
      const collections = await collectionService.getCollectionsByBin('new_bin');

      expect(collections).toEqual([]);
    });

    it('should handle invalid bin ID', async () => {
      const collections = await collectionService.getCollectionsByBin('');

      expect(collections).toEqual([]);
    });
  });

  describe('getRecentCollections', () => {
    it('should retrieve recent collections with default limit', async () => {
      const collections = await collectionService.getRecentCollections();

      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeLessThanOrEqual(50);
    });

    it('should retrieve recent collections with custom limit', async () => {
      const collections = await collectionService.getRecentCollections(10);

      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeLessThanOrEqual(10);
    });

    it('should return collections in descending order', async () => {
      const collections = await collectionService.getRecentCollections(5);

      if (collections.length > 1) {
        const firstDate = new Date(collections[0].scannedAt);
        const lastDate = new Date(collections[collections.length - 1].scannedAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime());
      }
    });
  });

  describe('getCollectionStats', () => {
    it('should calculate stats for all collections', async () => {
      const stats = await collectionService.getCollectionStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalCollections).toBe('number');
      expect(typeof stats.totalWeight).toBe('number');
      expect(stats.totalCollections).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stats for specific user', async () => {
      const stats = await collectionService.getCollectionStats('user_123');

      expect(stats).toBeDefined();
      expect(typeof stats.totalCollections).toBe('number');
    });

    it('should return zero stats for user with no collections', async () => {
      const stats = await collectionService.getCollectionStats('new_user');

      expect(stats.totalCollections).toBe(0);
      expect(stats.totalWeight).toBe(0);
    });
  });

  describe('reportIssue', () => {
    it('should report an issue for a collection', async () => {
      const result = await collectionService.reportIssue(
        'collection_123',
        'bin_damage',
        'Bin is broken',
        []
      );

      expect(result).toBeUndefined(); // Function returns void
    });

    it('should report issue with photos', async () => {
      const photos = ['photo1.jpg', 'photo2.jpg'];

      const result = await collectionService.reportIssue(
        'collection_456',
        'contamination',
        'Wrong waste type',
        photos
      );

      expect(result).toBeUndefined();
    });

    it('should handle various issue types', async () => {
      const issueTypes = ['bin_damage', 'contamination', 'missed_pickup', 'other'];

      for (const type of issueTypes) {
        const result = await collectionService.reportIssue(
          'collection_789',
          type,
          `Test issue: ${type}`,
          []
        );

        expect(result).toBeUndefined();
      }
    });

    it('should handle missing collection ID', async () => {
      await expect(
        collectionService.reportIssue('', 'bin_damage', 'Issue description')
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined values gracefully', async () => {
      const collections = await collectionService.getCollectionsByUser(null);

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should handle very large date ranges', async () => {
      const startDate = new Date('2000-01-01');
      const endDate = new Date('2050-12-31');

      const collections = await collectionService.getCollectionsByUser(
        'user_123',
        startDate,
        endDate
      );

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should handle collections with missing optional fields', async () => {
      const minimalData = {
        binId: 'bin_minimal',
        userId: 'user_minimal',
        scannedAt: new Date().toISOString(),
        wasteTypes: [],
        status: 'collected',
      };

      const result = await collectionService.createCollection(minimalData);

      expect(result).toBeDefined();
      expect(result.notes).toBeUndefined();
      expect(result.weight).toBeUndefined();
    });
  });
});
