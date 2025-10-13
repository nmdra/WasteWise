import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

/**
 * Create user profile in Firestore
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const userProfile = {
      uid: userId,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      displayName: userData.displayName || '',
      phoneNumber: userData.phoneNumber || '',
      address: userData.address || '',
      location: userData.location || null,
      role: userData.role || 'customer',
      profileImage: userData.profileImage || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isProfileComplete: false, // Can fill later
    };

    await setDoc(userRef, userProfile);
    return { success: true, user: userProfile };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
        isProfileComplete: true,
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign up with Email and Password
 */
export const signUpWithEmail = async (email, password, additionalData = {}) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Firestore profile
    const profileData = {
      email: user.email,
      displayName: additionalData.displayName || user.email.split('@')[0],
      firstName: additionalData.firstName || '',
      lastName: additionalData.lastName || '',
      phoneNumber: additionalData.phoneNumber || '',
      address: additionalData.address || '',
      location: additionalData.location || null,
      role: additionalData.role || 'customer',
    };

    const result = await createUserProfile(user.uid, profileData);

    if (result.success) {
      return {
        success: true,
        user: user,
        profile: result.user,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile
    const profile = await getUserProfile(user.uid);

    if (!profile.success || !profile.user) {
      await signOut(auth);
      return {
        success: false,
        error: 'We could not find your WasteWise profile. Please complete signup before logging in.',
      };
    }

    return {
      success: true,
      user: user,
      profile: profile.user,
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (rolePreference = 'customer') => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists
    const existingProfile = await getUserProfile(user.uid);

    if (!existingProfile.success) {
      if (existingProfile.error !== 'User profile not found') {
        await signOut(auth);
        return { success: false, error: existingProfile.error };
      }

      // Create new profile for Google user with preferred role
      const profileData = {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        profileImage: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
        role: rolePreference, // Use the role preference passed from signup
      };

      const newProfile = await createUserProfile(user.uid, profileData);
      if (!newProfile.success || !newProfile.user) {
        await signOut(auth);
        return { success: false, error: newProfile.error || 'Failed to create profile.' };
      }
      return {
        success: true,
        user: user,
        profile: newProfile.user,
        isNewUser: true,
      };
    }

    return {
      success: true,
      user: user,
      profile: existingProfile.user,
      isNewUser: false,
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out
 */
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auth state listener
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};
