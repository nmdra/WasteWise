# WasteWise - Onboarding & Auth Flow

## ✅ Completed Features

### 1. **Splash Screen** (`app/splash.jsx`)
- Beautiful animated logo with fade-in and scale effects
- Eco-friendly gradient background (#16A34A → #0F766E)
- Smart routing logic:
  - First-time users → Onboarding
  - Returning users (not logged in) → Login
  - Logged-in users → Main App

### 2. **Onboarding Screens** (`app/onboarding.jsx`)
- 3 swipeable landing pages with smooth animations
- Page 1: Track & Schedule pickups
- Page 2: Optimized waste collection routes
- Page 3: Rewards & easy payments
- Pagination dots with active indicator
- Skip button and Next/Get Started CTAs
- **AsyncStorage integration** - saves `hasSeenOnboarding` flag

### 3. **Login Screen** (`app/login.jsx`)
- Toggle between Phone and Email login
- Clean, modern UI with proper form validation
- Email/Password fields (ready for Firebase)
- Phone OTP placeholder (ready for implementation)
- "Create Account" button for signup flow
- Terms & Privacy legal text
- **AsyncStorage** - saves user token after login

## 🎨 Design System

### Colors
- **Primary Green**: `#16A34A` (Eco Green)
- **Dark Teal**: `#0F766E` (Deep Teal)
- **Accent**: `#22C55E` (Lime Green)
- **Text Dark**: `#0B1220` (Ink)
- **Background**: `#F8FAFC` (Off-white)
- **Border**: `#E2E8F0` (Light Gray)

### Typography
- **Title**: 32px / Bold
- **Subtitle**: 26px / Bold
- **Body**: 16px / Regular
- **Button**: 17px / Bold

## 🚀 How to Use

### Start the App
```bash
npm start
# or
npx expo start
```

### Flow Logic
1. **First Launch**: Splash → Onboarding (3 pages) → Login
2. **Second Launch** (not logged in): Splash → Login
3. **Logged In**: Splash → Main App (Tabs)

### Testing Different Flows

#### Reset to First-Time User
```javascript
// In your terminal or code
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all data
await AsyncStorage.clear();

// Or clear specific keys
await AsyncStorage.removeItem('hasSeenOnboarding');
await AsyncStorage.removeItem('userToken');
```

#### Simulate Logged-In User
```javascript
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
await AsyncStorage.setItem('userToken', 'demo-token-123');
```

## 📁 File Structure
```
app/
├── splash.jsx          # Animated splash with routing logic
├── onboarding.jsx      # 3-page swipeable onboarding
├── login.jsx           # Phone/Email login screen
├── index.jsx           # Redirect to splash
├── _layout.jsx         # Root navigation setup
└── (tabs)/             # Main app (after login)
    ├── index.jsx
    ├── explore.jsx
    └── _layout.jsx
```

## 🔧 Next Steps (Ready for You to Add)

### 1. Firebase Authentication
```javascript
// In login.jsx - replace the demo login
import auth from '@react-native-firebase/auth';

const handleEmailLogin = async () => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    await AsyncStorage.setItem('userToken', await userCredential.user.getIdToken());
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### 2. Phone OTP (Firebase)
```javascript
const handlePhoneLogin = async () => {
  const confirmation = await auth().signInWithPhoneNumber(phone);
  // Show OTP input screen
  // verify with: await confirmation.confirm(code);
};
```

### 3. Role-Based Routing
After login, check user role and route accordingly:
```javascript
const idTokenResult = await auth().currentUser.getIdTokenResult();
const role = idTokenResult.claims.role; // 'customer' or 'cleaner'

if (role === 'cleaner') {
  router.replace('/(cleaner-tabs)');
} else {
  router.replace('/(tabs)');
}
```

### 4. Add Real Images
Replace emoji placeholders in:
- `splash.jsx` - Add your logo
- `onboarding.jsx` - Add 3 illustration images

### 5. Sign Up Flow
Create `app/signup.jsx` with:
- Name, Email, Phone, Password fields
- Role selection (Customer/Cleaner)
- Firebase user creation
- Firestore profile setup

## 🎯 AsyncStorage Keys Used

| Key | Value | Purpose |
|-----|-------|---------|
| `hasSeenOnboarding` | `'true'` | Skip onboarding on future launches |
| `userToken` | JWT/Token | User authentication token |
| `userEmail` | Email string | Cached user email |

## 🐛 Troubleshooting

### App stuck on splash?
- Check AsyncStorage values
- Ensure router.replace() paths are correct
- Check console for errors

### Onboarding shows every time?
- Verify AsyncStorage.setItem() is being called
- Check Platform permissions for storage

### Navigation errors?
- Ensure all screen names in _layout.jsx match file names
- Check expo-router version is up to date

## 📱 Screenshots (Placeholders)
- [ ] Add screenshot of splash
- [ ] Add screenshot of onboarding pages
- [ ] Add screenshot of login screen

---

**Ready to customize!** Just replace the emoji placeholders with your actual logo and illustrations, and wire up Firebase Auth. Everything else is production-ready! 🚀
