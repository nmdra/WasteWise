/**
 * User Service Tests
 * 
 * Tests for user profile operations
 */

jest.mock('../../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  getUserProfile,
  updateUserProfile,
  getUserZone,
} from '../userService';

describe('User Service - Profile Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    test('should retrieve user profile successfully', async () => {
      const mockUserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        zone: 'B',
        role: 'customer',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user123',
        data: () => mockUserData,
      });

      const result = await getUserProfile('user123');

      expect(result).toBeDefined();
      expect(result.id).toBe('user123');
      expect(result.firstName).toBe('John');
      expect(result.zone).toBe('B');
    });

    test('should return null for non-existent user', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserProfile('nonexistent');

      expect(result).toBeNull();
    });

    test('should handle database errors', async () => {
      getDoc.mockRejectedValue(new Error('Database error'));

      await expect(getUserProfile('user123')).rejects.toThrow('Database error');
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
      setDoc.mockResolvedValue();

      const result = await updateUserProfile('user123', {
        firstName: 'Jane',
        phoneNumber: '+1234567890',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(setDoc).toHaveBeenCalled();
    });

    test('should include updatedAt timestamp', async () => {
      setDoc.mockResolvedValue();

      await updateUserProfile('user123', { firstName: 'Jane' });

      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs.updatedAt).toBeDefined();
    });

    test('should merge with existing data', async () => {
      setDoc.mockResolvedValue();

      await updateUserProfile('user123', { firstName: 'Jane' });

      const callArgs = setDoc.mock.calls[0];
      expect(callArgs[2]).toEqual({ merge: true });
    });

    test('should handle update errors', async () => {
      setDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        updateUserProfile('user123', { firstName: 'Jane' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getUserZone', () => {
    test('should retrieve user zone', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user123',
        data: () => ({
          zone: 'C',
          firstName: 'John',
        }),
      });

      const zone = await getUserZone('user123');

      expect(zone).toBe('C');
    });

    test('should return null if user has no zone', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user123',
        data: () => ({
          firstName: 'John',
        }),
      });

      const zone = await getUserZone('user123');

      expect(zone).toBeNull();
    });

    test('should return null if user not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const zone = await getUserZone('nonexistent');

      expect(zone).toBeNull();
    });

    test('should handle errors gracefully', async () => {
      getDoc.mockRejectedValue(new Error('Network error'));

      const zone = await getUserZone('user123');

      expect(zone).toBeNull();
    });
  });
});

describe('User Service - Data Integrity', () => {
  test('should preserve all profile fields during update', async () => {
    setDoc.mockResolvedValue();

    const updates = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      zone: 'B',
    };

    await updateUserProfile('user123', updates);

    const callArgs = setDoc.mock.calls[0][1];
    expect(callArgs.firstName).toBe('John');
    expect(callArgs.lastName).toBe('Doe');
    expect(callArgs.phoneNumber).toBe('+1234567890');
    expect(callArgs.address).toBe('123 Main St');
    expect(callArgs.zone).toBe('B');
  });
});

describe('User Service - Edge Cases', () => {
  test('should handle empty updates', async () => {
    setDoc.mockResolvedValue();

    const result = await updateUserProfile('user123', {});

    expect(result.success).toBe(true);
    expect(setDoc).toHaveBeenCalled();
  });

  test('should handle undefined userId', async () => {
    getDoc.mockRejectedValue(new Error('Invalid user ID'));

    await expect(getUserProfile(undefined)).rejects.toThrow();
  });

  test('should handle null profile data', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => null,
    });

    const result = await getUserProfile('user123');

    expect(result).toBeDefined();
    expect(result.id).toBe('user123');
  });
});
