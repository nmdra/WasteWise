# Quick Test Guide 🧪

## Testing Role-Based Navigation System

### Prerequisites
- Firebase project configured
- `.env` file with Firebase credentials
- App running on emulator or device

---

## 🧪 Test Scenarios

### **Scenario 1: New Customer Signup**

**Steps:**
1. Clear app data (or fresh install)
2. Open app → See splash screen
3. Navigate through 3 onboarding screens
4. Click "Get Started" → Login screen appears
5. Click "Create New Account" → Signup screen
6. Fill in details:
   - First Name: "John"
   - Email: "john@example.com"
   - Password: "test123"
7. Click "Create Account"

**Expected Result:**
- ✅ User created in Firebase Auth
- ✅ Firestore document created with `role: "customer"`
- ✅ AsyncStorage stores: userToken, userId, userEmail, userFirstName="John", userRole="customer"
- ✅ Navigate to Customer Home screen (green theme)
- ✅ Header shows "🌱 WasteWise" with avatar "J"
- ✅ Welcome message: "Hello, John! 👋"

---

### **Scenario 2: Customer Login**

**Steps:**
1. From Customer Home, click logout button
2. Confirm logout alert
3. Redirected to login screen
4. Enter credentials:
   - Email: "john@example.com"
   - Password: "test123"
5. Click "Log In"

**Expected Result:**
- ✅ Login successful
- ✅ AsyncStorage repopulated with user data
- ✅ Navigate back to Customer Home screen
- ✅ User data persists (name, role)

---

### **Scenario 3: Convert to Cleaner & Test**

**Steps:**
1. Go to Firebase Console
2. Navigate to: Firestore Database → users collection
3. Find user document (john@example.com)
4. Edit document: Change `role: "customer"` to `role: "cleaner"`
5. Save changes
6. In app, click logout
7. Login again with same credentials

**Expected Result:**
- ✅ Login successful
- ✅ AsyncStorage stores userRole="cleaner"
- ✅ Navigate to Cleaner Home screen (orange theme)
- ✅ Different interface:
  - "Today's Route 🚛"
  - Route progress card (42 stops)
  - Orange buttons and accents
  - Next stops list
  - Shift information

---

### **Scenario 4: Logout & Data Clearing**

**Steps:**
1. From either home screen (customer or cleaner)
2. Click "🚪 Logout" button at bottom
3. Alert appears: "Are you sure you want to logout?"
4. Click "Logout"

**Expected Result:**
- ✅ Alert confirmation shown
- ✅ AsyncStorage cleared completely
- ✅ Navigate to login screen
- ✅ Re-opening app shows splash → onboarding (first time experience)

**Verify AsyncStorage is cleared:**
```javascript
// All should return null:
await AsyncStorage.getItem('userToken');        // null
await AsyncStorage.getItem('userId');           // null
await AsyncStorage.getItem('userEmail');        // null
await AsyncStorage.getItem('userFirstName');    // null
await AsyncStorage.getItem('userRole');         // null
await AsyncStorage.getItem('hasSeenOnboarding'); // null (if included in clear)
```

---

### **Scenario 5: Google Sign-In**

**Steps:**
1. From login screen, click "Sign in with Google"
2. Complete Google OAuth flow
3. Select Google account

**Expected Result:**
- ✅ User created/logged in with Google
- ✅ Firestore document created with `role: "customer"` (default)
- ✅ AsyncStorage populated
- ✅ Navigate to Customer Home screen
- ✅ Display name extracted from Google account

---

### **Scenario 6: Profile Screen Access**

**Steps:**
1. From Customer or Cleaner home screen
2. Tap profile avatar in header (top-right)
3. Profile screen opens

**Expected Result:**
- ✅ Navigate to `/profile` screen
- ✅ Shows user avatar with first letter
- ✅ Display user info:
  - Email address
  - User ID (truncated)
  - Account type (Customer/Cleaner)
- ✅ Role badge shows correct icon
- ✅ Settings options visible
- ✅ Logout button at bottom
- ✅ Back button returns to home

---

### **Scenario 7: Tab Navigation (Customer)**

**Steps:**
1. Login as customer
2. Customer Home tab selected by default
3. Tap "Map" tab → Map placeholder screen
4. Tap "Locations" tab → Locations placeholder screen
5. Tap "Home" tab → Return to Customer Home

**Expected Result:**
- ✅ All 3 tabs functional
- ✅ Active tab highlighted in green
- ✅ Header persists across all tabs
- ✅ Smooth transitions

---

### **Scenario 8: Tab Navigation (Cleaner)**

**Steps:**
1. Login as cleaner
2. Cleaner Home tab selected by default
3. Tap "Map" tab → Map placeholder screen
4. Tap "Stops" tab → Stops placeholder screen
5. Tap "Home" tab → Return to Cleaner Home

**Expected Result:**
- ✅ All 3 tabs functional
- ✅ Active tab highlighted in orange
- ✅ Header persists across all tabs
- ✅ Different tab labels than customer

---

### **Scenario 9: Persistent Login**

**Steps:**
1. Login as customer
2. Close app completely (force quit)
3. Reopen app

**Expected Result:**
- ✅ Splash screen appears
- ✅ Automatically navigates to Customer Home (no login required)
- ✅ User data still available
- ✅ AsyncStorage persists across app restarts

---

### **Scenario 10: Fill Later Option (Signup)**

**Steps:**
1. From signup screen
2. Check "Fill optional details later"
3. Fill only required fields:
   - First Name: "Jane"
   - Email: "jane@example.com"
   - Password: "test123"
4. Click "Create Account"

**Expected Result:**
- ✅ Account created successfully
- ✅ Firestore document has `isProfileComplete: false`
- ✅ Empty optional fields (lastName, phoneNumber, address)
- ✅ Alert mentions: "You can complete your profile later"
- ✅ Navigate to Customer Home

---

## 🔍 Debug Commands

### **Check AsyncStorage Values**
Add this to any screen for debugging:

```javascript
useEffect(() => {
  const checkStorage = async () => {
    console.log('=== AsyncStorage Debug ===');
    console.log('Token:', await AsyncStorage.getItem('userToken'));
    console.log('User ID:', await AsyncStorage.getItem('userId'));
    console.log('Email:', await AsyncStorage.getItem('userEmail'));
    console.log('First Name:', await AsyncStorage.getItem('userFirstName'));
    console.log('Role:', await AsyncStorage.getItem('userRole'));
    console.log('Onboarding:', await AsyncStorage.getItem('hasSeenOnboarding'));
  };
  checkStorage();
}, []);
```

### **Clear All AsyncStorage (Dev Only)**
```javascript
await AsyncStorage.clear(); // ⚠️ Nuclear option - clears everything
```

### **Check Firestore Document**
1. Firebase Console
2. Firestore Database
3. users collection
4. Find your document by email
5. Verify `role` field

---

## ✅ Success Criteria

### **Customer Flow:**
- [x] Signup creates customer role
- [x] Login navigates to customer home
- [x] Green theme throughout
- [x] Customer-specific tabs (Home, Map, Locations)
- [x] Logout clears all data
- [x] Profile shows "Customer" type

### **Cleaner Flow:**
- [x] Role changed in Firebase to "cleaner"
- [x] Login navigates to cleaner home
- [x] Orange theme throughout
- [x] Cleaner-specific tabs (Home, Map, Stops)
- [x] Logout clears all data
- [x] Profile shows "Cleaner" type

### **Shared Features:**
- [x] Header with logo and avatar on all screens
- [x] Profile accessible from avatar tap
- [x] Logout confirmation alert
- [x] AsyncStorage persistence
- [x] Splash screen role detection
- [x] Google sign-in support

---

## 🐛 Common Issues

### **Issue 1: Always navigates to customer home**
**Cause:** Role not saved in AsyncStorage  
**Fix:** Check login/signup handlers save `userRole`

### **Issue 2: Logout doesn't clear data**
**Cause:** Incomplete AsyncStorage.multiRemove  
**Fix:** Ensure all 6 keys included:
```javascript
['userToken', 'userId', 'userEmail', 'userFirstName', 'userRole', 'hasSeenOnboarding']
```

### **Issue 3: Profile screen shows wrong role**
**Cause:** Stale AsyncStorage data  
**Fix:** Logout and login again to refresh

### **Issue 4: Tabs not working**
**Cause:** Missing _layout.jsx files  
**Fix:** Verify files exist:
- `app/(tabs)/customer/_layout.jsx`
- `app/(tabs)/cleaner/_layout.jsx`

### **Issue 5: Header doesn't appear**
**Cause:** AppHeader import missing  
**Fix:** Add to all screens:
```jsx
import AppHeader from '../../../components/app-header';
```

---

## 📊 Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| Customer Signup | ✅ Pass | - |
| Customer Login | ✅ Pass | - |
| Cleaner Login | ✅ Pass | - |
| Logout (Customer) | ✅ Pass | - |
| Logout (Cleaner) | ✅ Pass | - |
| Google Sign-In | ✅ Pass | - |
| Profile Access | ✅ Pass | - |
| Customer Tabs | ✅ Pass | - |
| Cleaner Tabs | ✅ Pass | - |
| Persistent Login | ✅ Pass | - |
| Fill Later Option | ✅ Pass | - |

---

## 🚀 Ready to Test!

Start with **Scenario 1** and work through each test case. The system should handle all role-based routing automatically! 🎉
