# Role-Based Navigation System 🚀

## Overview
WasteWise now has a complete **role-based authentication and navigation system** that automatically routes users to different home screens based on their role (`customer` or `cleaner`).

---

## 🎯 Features Implemented

### 1. **Role-Based Navigation**
- **Customer Role** → Navigate to `/(tabs)/customer/home`
- **Cleaner Role** → Navigate to `/(tabs)/cleaner/home`
- Automatic role detection from Firestore user profile
- Role stored in AsyncStorage for offline access

### 2. **AsyncStorage Data Management**
When a user logs in or signs up, the following data is stored:
```javascript
{
  userToken: "firebase_id_token",
  userId: "firebase_user_id",
  userEmail: "user@example.com",
  userFirstName: "John",
  userRole: "customer" // or "cleaner"
}
```

### 3. **Logout Functionality**
Both home screens have a logout button that:
- Shows a confirmation alert
- Clears ALL AsyncStorage data:
  - `userToken`
  - `userId`
  - `userEmail`
  - `userFirstName`
  - `userRole`
  - `hasSeenOnboarding` (optional - reset onboarding)
- Redirects to `/login` screen

---

## 📂 File Structure

```
app/
├── splash.jsx                    # Entry point with role detection
├── login.jsx                     # Login with role-based routing
├── signup.jsx                    # Signup (always creates customer role)
├── profile.jsx                   # Profile screen for both roles
├── (tabs)/
│   ├── customer/
│   │   ├── _layout.jsx          # Customer tab navigation
│   │   ├── home.jsx             # Customer home screen ✅
│   │   ├── map.jsx              # Map view (coming soon)
│   │   └── locations.jsx        # Locations management
│   └── cleaner/
│       ├── _layout.jsx          # Cleaner tab navigation
│       ├── home.jsx             # Cleaner home screen ✅
│       ├── map.jsx              # Route map (coming soon)
│       └── stops.jsx            # Stops list (coming soon)
│
components/
└── app-header.jsx               # Shared header with logo & profile
```

---

## 🏠 Screen Details

### **Customer Home Screen**
Location: `app/(tabs)/customer/home.jsx`

**Features:**
- Welcome message with user's first name
- Next pickup schedule card with date/time
- Quick action buttons:
  - 📍 Track Truck
  - 📆 Schedule
  - 🗑️ Report Issue
  - 💰 Payment
- Recent pickups activity feed
- Logout button at bottom

**Design:**
- Primary color: Green `#16A34A`
- Clean card-based layout
- Scrollable content

---

### **Cleaner Home Screen**
Location: `app/(tabs)/cleaner/home.jsx`

**Features:**
- Today's route greeting
- Route progress card showing:
  - Total stops (42)
  - Completed stops (18)
  - Remaining stops (24)
  - Progress bar (43% complete)
- Quick action buttons:
  - 📍 Navigate
  - 📸 Scan QR
  - ⚠️ Report
  - 📋 Checklist
- Next stops list (shows upcoming 3 stops)
- Shift information (6:30 AM - 2:30 PM)
- Logout button at bottom

**Design:**
- Primary color: Orange `#F59E0B`
- Route-focused interface
- Real-time progress tracking

---

## 🔐 Authentication Flow

### **1. Splash Screen** (`app/splash.jsx`)
```javascript
// Check AsyncStorage
const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
const userToken = await AsyncStorage.getItem('userToken');
const userRole = await AsyncStorage.getItem('userRole');

// Route accordingly
if (!hasSeenOnboarding) {
  router.replace('/onboarding');
} else if (!userToken) {
  router.replace('/login');
} else {
  // Role-based routing
  if (userRole === 'cleaner') {
    router.replace('/(tabs)/cleaner/home');
  } else {
    router.replace('/(tabs)/customer/home');
  }
}
```

### **2. Login** (`app/login.jsx`)
```javascript
const result = await signInWithEmail(email, password);

// Store user data including role
await AsyncStorage.setItem('userRole', result.profile.role);
await AsyncStorage.setItem('userFirstName', result.profile.firstName);

// Navigate based on role
const userRole = result.profile.role || 'customer';
if (userRole === 'cleaner') {
  router.replace('/(tabs)/cleaner/home');
} else {
  router.replace('/(tabs)/customer/home');
}
```

### **3. Signup** (`app/signup.jsx`)
```javascript
const result = await signUpWithEmail(email, password, userData);

// Always creates customer role in Firestore
// Store data in AsyncStorage
await AsyncStorage.setItem('userRole', 'customer');
await AsyncStorage.setItem('userFirstName', formData.firstName);

// Navigate to customer home
router.replace('/(tabs)/customer/home');
```

---

## 🎨 Shared Components

### **AppHeader** (`components/app-header.jsx`)
Used by both customer and cleaner screens.

**Props:**
- `userName` - User's first name
- `userRole` - "customer" or "cleaner"

**Features:**
- Left: WasteWise logo (🌱)
- Right: Profile avatar with role badge
- Tappable avatar → navigates to `/profile`
- Role badge shows 👤 for customer, 🚛 for cleaner

**Usage:**
```jsx
<AppHeader userName={userData?.firstName} userRole="customer" />
<AppHeader userName={userData?.firstName} userRole="cleaner" />
```

---

## 🗂️ Tab Navigation

### **Customer Tabs**
File: `app/(tabs)/customer/_layout.jsx`

Tabs:
1. 🏠 Home - Customer home screen
2. 🗺️ Map - Track pickup truck (coming soon)
3. 📍 Locations - Manage addresses (coming soon)

Active color: Green `#16A34A`

### **Cleaner Tabs**
File: `app/(tabs)/cleaner/_layout.jsx`

Tabs:
1. 🏠 Home - Cleaner home screen
2. 🗺️ Map - Route navigation (coming soon)
3. 📋 Stops - Pickup stops list (coming soon)

Active color: Orange `#F59E0B`

---

## 🔄 Logout Process

Both home screens implement the same logout function:

```javascript
const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Clear all AsyncStorage data
          await AsyncStorage.multiRemove([
            'userToken',
            'userId',
            'userEmail',
            'userFirstName',
            'userRole',
            'hasSeenOnboarding', // Optional: reset onboarding
          ]);
          router.replace('/login');
        },
      },
    ]
  );
};
```

**What gets cleared:**
- ✅ Authentication token
- ✅ User ID
- ✅ Email address
- ✅ First name
- ✅ Role information
- ✅ Onboarding status (optional)

**Result:**
- User is redirected to login screen
- Splash screen will show onboarding on next app launch (if cleared)

---

## 🔥 Firebase Integration

### **User Collection Structure**
```javascript
{
  uid: "firebase_user_id",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John Doe",
  phoneNumber: "+94 XX XXX XXXX",
  address: "123 Main Street",
  location: null,
  role: "customer", // or "cleaner"
  profileImage: "",
  isProfileComplete: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### **How Roles Are Assigned**
- **Signup:** Always creates `role: "customer"` by default
- **Admin Panel:** You can manually change role to "cleaner" in Firebase Console
- **Future:** Add role selection during signup or admin dashboard

---

## 🚀 Testing the System

### **Test as Customer:**
1. Sign up with email/password
2. User is created with `role: "customer"`
3. Redirected to Customer Home screen
4. See green-themed interface
5. Test logout → clears data → back to login

### **Test as Cleaner:**
1. Create a user (sign up as customer)
2. Go to Firebase Console → Firestore → users collection
3. Find your user document
4. Change `role: "customer"` to `role: "cleaner"`
5. Logout from app
6. Login again
7. Should be redirected to Cleaner Home screen
8. See orange-themed interface

---

## 📱 Profile Screen

Location: `app/profile.jsx`

**Features:**
- Shows user avatar with role badge
- Displays account information:
  - Email
  - User ID
  - Account type (Customer/Cleaner)
- Settings options:
  - ✏️ Edit Profile (coming soon)
  - 🔔 Notifications (coming soon)
  - 🔒 Privacy & Security (coming soon)
  - ❓ Help & Support (coming soon)
- Logout button

**Accessible from:**
- Tap profile avatar in AppHeader
- Navigate to `/profile`

---

## 🎯 Next Steps

### **Immediate:**
- Test login/logout flow thoroughly
- Verify AsyncStorage data persistence
- Test role-based navigation

### **Future Enhancements:**
1. **Map Integration:**
   - Add `react-native-maps` for map view
   - Real-time truck tracking for customers
   - Route navigation for cleaners

2. **QR Code Scanning:**
   - Add `expo-camera` and `expo-barcode-scanner`
   - Scan pickup location QR codes

3. **Profile Completion:**
   - Screen for users who clicked "fill later"
   - Edit profile functionality

4. **Push Notifications:**
   - Pickup reminders for customers
   - Route updates for cleaners

5. **Role Selection:**
   - During signup, let user choose role
   - Or add "Switch to Cleaner Account" option

---

## 🐛 Troubleshooting

### **Issue: User always goes to customer home**
**Fix:** Check if role is properly stored in Firestore and AsyncStorage
```javascript
// Check AsyncStorage
const role = await AsyncStorage.getItem('userRole');
console.log('Current role:', role);
```

### **Issue: Logout doesn't work**
**Fix:** Make sure AsyncStorage.multiRemove includes all keys
```javascript
await AsyncStorage.multiRemove([
  'userToken', 'userId', 'userEmail', 
  'userFirstName', 'userRole', 'hasSeenOnboarding'
]);
```

### **Issue: Can't navigate to profile**
**Fix:** Make sure profile route is defined in `app/_layout.jsx`
```jsx
<Stack.Screen name="profile" options={{ headerShown: false }} />
```

---

## ✅ Checklist

- [x] Firebase authentication setup
- [x] Role-based routing logic
- [x] Customer home screen
- [x] Cleaner home screen
- [x] Shared header component
- [x] Logout functionality
- [x] AsyncStorage data management
- [x] Profile screen
- [x] Tab navigation for both roles
- [ ] Map integration (coming soon)
- [ ] QR code scanning (coming soon)
- [ ] Push notifications (coming soon)

---

## 🎨 Design System

### **Colors**
```javascript
// Customer Theme
primary: '#16A34A'      // Green
secondary: '#0F766E'    // Teal
background: '#F8FAFC'   // Light gray
text: '#0B1220'         // Dark

// Cleaner Theme
primary: '#F59E0B'      // Orange
secondary: '#16A34A'    // Green
background: '#F8FAFC'   // Light gray
text: '#0B1220'         // Dark

// Shared
gray: '#64748B'
lightGray: '#94A3B8'
border: '#E2E8F0'
error: '#DC2626'
```

### **Typography**
- **Heading:** 28-32px, Bold (700)
- **Subtitle:** 16px, Regular (400)
- **Card Title:** 18px, Bold (700)
- **Body:** 14-16px, Regular (400)
- **Button:** 16-17px, Bold (700)

---

## 📖 Summary

You now have a complete role-based authentication system with:
- ✅ Automatic role detection from Firestore
- ✅ Role-specific home screens (customer & cleaner)
- ✅ Persistent login with AsyncStorage
- ✅ Logout with complete data clearing
- ✅ Shared header component
- ✅ Profile screen for both roles
- ✅ Tab navigation customized per role

**Ready to test!** 🚀
