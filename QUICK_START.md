# 🚀 Quick Start - Testing Your Onboarding Flow

## Immediate Testing

### 1. Start the App
```bash
npx expo start
```

Press `w` for web or scan QR code for mobile.

### 2. Test First-Time User Flow
The app should automatically show:
1. **Splash Screen** (1.5s) with animated logo
2. **Onboarding** (3 swipeable pages)
3. **Login Screen**

### 3. Test Returning User
Open your browser console or React Native debugger and run:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Skip onboarding next time
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
```

Refresh → Should skip onboarding and go straight to login.

### 4. Test Logged-In User
```javascript
// Simulate logged-in state
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
await AsyncStorage.setItem('userToken', 'demo-token-123');
```

Refresh → Should skip everything and go to main app.

## Quick Dev Commands

### Reset Everything (First-Time User)
```javascript
await AsyncStorage.clear();
```

### Check Current State
```javascript
const state = {
  onboarding: await AsyncStorage.getItem('hasSeenOnboarding'),
  token: await AsyncStorage.getItem('userToken'),
};
console.log(state);
```

## Using Dev Helpers

Add this to any screen for quick testing:

```javascript
import { DevHelpers } from '@/utils/dev-helpers';
import { Button, View } from 'react-native';

// In your component
<View>
  <Button title="Reset to First Time" onPress={DevHelpers.resetToFirstTime} />
  <Button title="Set Returning User" onPress={DevHelpers.setReturningUser} />
  <Button title="Set Logged In" onPress={DevHelpers.setLoggedInUser} />
  <Button title="Check State" onPress={DevHelpers.checkState} />
  <Button title="Logout" onPress={DevHelpers.logout} />
</View>
```

## File Structure You Just Got

```
WasteWise/
├── app/
│   ├── index.jsx               # Root redirect
│   ├── splash.jsx              # Animated splash ✨
│   ├── onboarding.jsx          # 3-page swipeable onboarding
│   ├── login.jsx               # Phone/Email login
│   ├── _layout.jsx             # Navigation setup
│   └── (tabs)/                 # Main app
│       ├── index.jsx
│       ├── explore.jsx
│       └── _layout.jsx
├── utils/
│   └── dev-helpers.js          # Testing utilities
├── ONBOARDING_README.md        # Full documentation
├── DESIGN_GUIDE.md             # Visual specs
└── QUICK_START.md              # This file
```

## Navigation Flow (How It Works)

```javascript
// app/splash.jsx - The brain of routing
const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
const userToken = await AsyncStorage.getItem('userToken');

if (!hasSeenOnboarding) {
  router.replace('/onboarding');  // First time
} else if (!userToken) {
  router.replace('/login');       // Returning, not logged in
} else {
  router.replace('/(tabs)');      // Logged in
}
```

## Customization Checklist

- [ ] Replace ♻️ emoji with your logo in `splash.jsx`
- [ ] Replace 📅 🚛 💰 emojis with illustrations in `onboarding.jsx`
- [ ] Update app name "WasteWise" to your branding
- [ ] Wire up Firebase Auth in `login.jsx`
- [ ] Add role-based routing (customer/cleaner)
- [ ] Create sign-up screen
- [ ] Add forgot password flow
- [ ] Implement phone OTP verification

## Common Issues & Fixes

### ❌ App shows blank screen
**Fix:** Check console for errors. Ensure all imports are correct.

### ❌ AsyncStorage not persisting
**Fix:** On web, check browser local storage. On mobile, check app permissions.

### ❌ Navigation not working
**Fix:** Verify all screen names in `_layout.jsx` match file names.

### ❌ Onboarding shows every time
**Fix:** Check that `AsyncStorage.setItem('hasSeenOnboarding', 'true')` is being called in `onboarding.jsx`.

## Testing on Different Platforms

### Web
```bash
npx expo start --web
```
Open browser DevTools → Application → Local Storage to see AsyncStorage.

### iOS Simulator
```bash
npx expo start --ios
```
Use React Native Debugger to inspect AsyncStorage.

### Android
```bash
npx expo start --android
```
Use `adb shell` or React Native Debugger.

## Next Steps After Testing

1. **Add Firebase**
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/auth
   ```

2. **Create Sign-Up Screen**
   - Copy `login.jsx` as template
   - Add name, role selection fields
   - Wire to Firebase `createUserWithEmailAndPassword`

3. **Add Role-Based Navigation**
   ```javascript
   // After login
   const role = await getUserRole(); // from Firestore
   if (role === 'cleaner') {
     router.replace('/(cleaner-tabs)');
   } else {
     router.replace('/(customer-tabs)');
   }
   ```

4. **Polish UI**
   - Add custom logo
   - Add real illustrations
   - Refine colors to match brand
   - Add haptic feedback
   - Add loading states

## Questions?

Check the full docs:
- `ONBOARDING_README.md` - Complete feature guide
- `DESIGN_GUIDE.md` - Visual design system

---

**You're all set!** 🎉 The onboarding flow is production-ready. Just customize the placeholders and wire up your backend!
