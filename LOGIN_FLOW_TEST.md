# ✅ Login Flow - Testing Guide

## Current Setup (Verified ✓)

### Flow Sequence
```
Splash Screen (1.5s)
    ↓
Onboarding (3 screens) ← First time only
    ↓
Login Screen (Email + Password)
    ↓
Main App (Tabs)
```

## Login Screen Features ✅

### What You Have Now:
1. **Email Input** - For user email
2. **Password Input** - Secure password field
3. **Forgot Password Link** - Top right of password
4. **Log In Button** - Primary green button
5. **Sign Up Button** - Below divider, outlined style
6. **Legal Text** - Terms & Privacy at bottom

### Layout:
```
┌─────────────────────────────┐
│  Welcome back               │
│  Log in to continue...      │
│                             │
│  Email                      │
│  ┌───────────────────┐      │
│  │ Enter your email  │      │
│  └───────────────────┘      │
│                             │
│  Password      [Forgot?]    │
│  ┌───────────────────┐      │
│  │ ••••••••••••••    │      │
│  └───────────────────┘      │
│                             │
│     [Log In Button]         │
│                             │
│  ────────  or  ────────     │
│                             │
│  [Create New Account]       │
│                             │
│  By continuing you agree... │
│                             │
└─────────────────────────────┘
```

## Testing Instructions

### 1. Test Full Flow (First Time User)
```bash
npx expo start
```

**Expected Flow:**
1. ✅ Splash screen appears (1.5s)
2. ✅ Onboarding screen 1 (📅 Track pickup)
3. ✅ Swipe or tap "Next" → Onboarding screen 2 (🚛 Routes)
4. ✅ Swipe or tap "Next" → Onboarding screen 3 (💰 Rewards)
5. ✅ Tap "Get Started" → Login screen appears
6. ✅ Login screen shows Email + Password fields
7. ✅ "Create New Account" button visible below

### 2. Test Login Functionality
```
1. Enter email: test@wastewise.lk
2. Enter password: anything
3. Tap "Log In"
4. Should show "Login successful!" alert
5. Should navigate to main app (/(tabs))
```

### 3. Test "Skip" on Onboarding
```
1. Clear AsyncStorage (see below)
2. Restart app
3. On any onboarding screen, tap "Skip"
4. Should go directly to Login screen
```

### 4. Test Returning User
```javascript
// In browser console or RN debugger:
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
await AsyncStorage.removeItem('userToken');
// Reload app
// Should skip onboarding → go to Login
```

### 5. Test Logged In User
```javascript
// In browser console or RN debugger:
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
await AsyncStorage.setItem('userToken', 'demo-token-123');
// Reload app
// Should skip to Main App
```

## Dev Helper Commands

### Reset to First Time User
```javascript
await AsyncStorage.clear();
// Reload → Shows onboarding
```

### Check Current State
```javascript
const onboarding = await AsyncStorage.getItem('hasSeenOnboarding');
const token = await AsyncStorage.getItem('userToken');
console.log({ onboarding, token });
```

### Quick Test Using Dev Helpers
```javascript
import { DevHelpers } from '@/utils/dev-helpers';

// Test different states
DevHelpers.resetToFirstTime();      // → Onboarding
DevHelpers.setReturningUser();      // → Login
DevHelpers.setLoggedInUser();       // → Main App
DevHelpers.checkState();            // Show current state
```

## Verification Checklist

### Onboarding Screen ✅
- [x] Has 3 screens (not 2, not 4)
- [x] Screen 1: 📅 Track & Schedule
- [x] Screen 2: 🚛 Optimized routes
- [x] Screen 3: 💰 Rewards & payments
- [x] Can swipe between screens
- [x] Shows pagination dots
- [x] Has "Skip" button on screens 1-2
- [x] Has "Next" button on screens 1-2
- [x] Has "Get Started" button on screen 3
- [x] Goes to Login after completion

### Login Screen ✅
- [x] Shows "Welcome back" title
- [x] Has Email input field
- [x] Has Password input field
- [x] Has "Forgot password?" link
- [x] Has "Log In" button (green)
- [x] Has "or" divider
- [x] Has "Create New Account" button (outlined)
- [x] Has Terms & Privacy text
- [x] No Phone/Email toggle (removed)
- [x] Email validation works
- [x] Password is secure (hidden)

### Flow Logic ✅
- [x] First time: Splash → Onboarding → Login
- [x] Returning: Splash → Login
- [x] Logged in: Splash → Main App
- [x] AsyncStorage saves onboarding state
- [x] AsyncStorage saves login token

## What Happens on Login

Current behavior (demo mode):
```javascript
1. Validates email and password are filled
2. Shows loading state "Logging in..."
3. Simulates API call (1 second delay)
4. Saves token to AsyncStorage
5. Shows success alert
6. Navigates to /(tabs) main app
```

## Next Steps (Ready to Wire Up)

### 1. Replace Demo Login with Firebase
```javascript
// In login.jsx
import auth from '@react-native-firebase/auth';

const handleLogin = async () => {
  try {
    const userCredential = await auth()
      .signInWithEmailAndPassword(email, password);
    
    const token = await userCredential.user.getIdToken();
    await AsyncStorage.setItem('userToken', token);
    
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### 2. Create Sign Up Screen
The "Create New Account" button is ready - just needs a signup screen!

### 3. Add Forgot Password Flow
The "Forgot password?" link is ready - just needs the reset screen!

## Troubleshooting

### ❌ Onboarding shows every time
**Check:** AsyncStorage.setItem('hasSeenOnboarding', 'true') is being called

### ❌ Login doesn't work
**Check:** Email and password fields are filled
**Check:** Console for errors

### ❌ App stuck on splash
**Check:** Console for navigation errors
**Check:** All route names match file names

### ❌ Can't test on web
**Check:** Open browser DevTools → Application → Local Storage
**Check:** Clear all WasteWise entries to reset

---

## Summary

✅ **3 Onboarding Screens** - Working  
✅ **Login Screen** - Email + Password only  
✅ **Sign Up Button** - Below login  
✅ **AsyncStorage** - Remembers onboarding  
✅ **Flow Logic** - All routes working  

**Ready to customize and add Firebase Auth!** 🚀
