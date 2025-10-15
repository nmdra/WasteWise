/**
 * Auth Service Tests
 * 
 * Tests for user authentication, profile management, and authorization
 */

// Mock Firebase modules
jest.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('../stopsService', () => ({
  createCustomerStop: jest.fn(),
}));

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import {
    createUserProfile,
    getCurrentUser,
    getUserProfile,
    logOut,
    signInWithEmail,
    signUpWithEmail,
    updateUserProfile,
} from '../auth';

describe('Auth Service - Profile Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    test('should create user profile successfully', async () => {
      setDoc.mockResolvedValue();
      
      const result = await createUserProfile('user123', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.uid).toBe('user123');
      expect(result.user.email).toBe('test@example.com');
      expect(setDoc).toHaveBeenCalled();
    });

    test('should set default zone to A', async () => {
      setDoc.mockResolvedValue();
      
      const result = await createUserProfile('user123', {
        email: 'test@example.com',
      });

      expect(result.user.zone).toBe('A');
    });

    test('should set default role to customer', async () => {
      setDoc.mockResolvedValue();
      
      const result = await createUserProfile('user123', {
        email: 'test@example.com',
      });

      expect(result.user.role).toBe('customer');
    });

    test('should handle errors gracefully', async () => {
      setDoc.mockRejectedValue(new Error('Database error'));
      
      const result = await createUserProfile('user123', {
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserProfile', () => {
    test('should retrieve existing user profile', async () => {
      const mockUserData = {
        uid: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await getUserProfile('user123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUserData);
    });

    test('should return error when user not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
    });

    test('should handle database errors', async () => {
      getDoc.mockRejectedValue(new Error('Network error'));

      const result = await getUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
      setDoc.mockResolvedValue();

      const result = await updateUserProfile('user123', {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result.success).toBe(true);
      expect(setDoc).toHaveBeenCalled();
    });

    test('should mark profile as complete', async () => {
      setDoc.mockResolvedValue();

      await updateUserProfile('user123', {
        firstName: 'Jane',
      });

      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs.isProfileComplete).toBe(true);
    });

    test('should handle update errors', async () => {
      setDoc.mockRejectedValue(new Error('Update failed'));

      const result = await updateUserProfile('user123', {
        firstName: 'Jane',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});

describe('Auth Service - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    test('should create user account and profile', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      setDoc.mockResolvedValue();

      const result = await signUpWithEmail('test@example.com', 'password123', {
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    test('should handle weak passwords', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        message: 'Password should be at least 6 characters',
      });

      const result = await signUpWithEmail('test@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });

    test('should handle duplicate email', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        message: 'Email already in use',
      });

      const result = await signUpWithEmail('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email');
    });
  });

  describe('signInWithEmail', () => {
    test('should sign in existing user', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'customer', zone: 'A' }),
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    test('should reject sign in with wrong password', async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        message: 'Wrong password',
      });

      const result = await signInWithEmail('test@example.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Wrong password');
    });

    test('should sign out if profile not found', async () => {
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'user123' },
      });

      getDoc.mockResolvedValue({
        exists: () => false,
      });

      signOut.mockResolvedValue();

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('logOut', () => {
    test('should log out user successfully', async () => {
      signOut.mockResolvedValue();

      const result = await logOut();

      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalled();
    });

    test('should handle logout errors', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'));

      const result = await logOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user', () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      auth.currentUser = mockUser;

      const result = getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    test('should return null when no user logged in', () => {
      auth.currentUser = null;

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });
});

describe('Auth Service - Role Management', () => {
  test('should create customer profile by default', async () => {
    setDoc.mockResolvedValue();

    const result = await createUserProfile('user123', {
      email: 'test@example.com',
    });

    expect(result.user.role).toBe('customer');
  });

  test('should respect provided role', async () => {
    setDoc.mockResolvedValue();

    const result = await createUserProfile('user123', {
      email: 'collector@example.com',
      role: 'collector',
    });

    expect(result.user.role).toBe('collector');
  });
});

describe('Auth Service - Data Validation', () => {
  test('should handle missing email', async () => {
    createUserWithEmailAndPassword.mockRejectedValue({
      message: 'Email is required',
    });

    const result = await signUpWithEmail('', 'password123');

    expect(result.success).toBe(false);
  });

  test('should handle invalid email format', async () => {
    createUserWithEmailAndPassword.mockRejectedValue({
      message: 'Invalid email',
    });

    const result = await signUpWithEmail('invalid-email', 'password123');

    expect(result.success).toBe(false);
  });
});
