import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Development helpers for testing onboarding and auth flows
 * Use these in your app during development to quickly test different states
 */

export const DevHelpers = {
  /**
   * Simulate first-time user (will show onboarding)
   */
  async resetToFirstTime() {
    await AsyncStorage.clear();
    console.log('✅ Reset to first-time user - will show onboarding');
  },

  /**
   * Simulate returning user who hasn't logged in (skip onboarding, show login)
   */
  async setReturningUser() {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await AsyncStorage.removeItem('userToken');
    console.log('✅ Set as returning user - will skip onboarding, show login');
  },

  /**
   * Simulate logged-in user (skip onboarding and login, go to app)
   */
  async setLoggedInUser(email = 'demo@wastewise.lk') {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await AsyncStorage.setItem('userToken', 'demo-token-123');
    await AsyncStorage.setItem('userEmail', email);
    console.log('✅ Set as logged-in user - will go straight to app');
  },

  /**
   * Check current storage state
   */
  async checkState() {
    const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
    const userToken = await AsyncStorage.getItem('userToken');
    const userEmail = await AsyncStorage.getItem('userEmail');

    console.log('📱 Current Storage State:');
    console.log('  Has seen onboarding:', hasSeenOnboarding || 'false');
    console.log('  User token:', userToken || 'none');
    console.log('  User email:', userEmail || 'none');

    if (!hasSeenOnboarding) {
      console.log('➡️  Will show: ONBOARDING');
    } else if (!userToken) {
      console.log('➡️  Will show: LOGIN');
    } else {
      console.log('➡️  Will show: MAIN APP');
    }
  },

  /**
   * Logout user (keeps onboarding seen flag)
   */
  async logout() {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userEmail');
    console.log('✅ Logged out - will show login screen');
  },
};

// Example usage in a test screen or component:
// import { DevHelpers } from '@/utils/dev-helpers';
//
// <Button title="Reset to First Time" onPress={DevHelpers.resetToFirstTime} />
// <Button title="Check State" onPress={DevHelpers.checkState} />
// <Button title="Set Logged In" onPress={DevHelpers.setLoggedInUser} />
