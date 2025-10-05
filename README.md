# WasteWise 🌱♻️

A Smart Waste Management application with **role-based authentication** built with React Native, Expo, and Firebase. The app provides different experiences for customers (waste generators) and cleaners (waste collectors) with real-time tracking, scheduling, and route management.

## ✨ Features

### � **Authentication System**
- Email/Password signup and login
- Google OAuth integration
- Firebase Authentication & Firestore
- Secure token management with AsyncStorage
- "Fill later" option for profile fields

### � **Role-Based Navigation**
- **Customer Role** - Green themed interface for waste generators
- **Cleaner Role** - Orange themed interface for waste collectors
- Automatic role detection and routing
- Persistent login across app restarts

### � **Customer Features**
- Next pickup schedule with date/time
- Track waste collection truck in real-time
- Schedule pickup requests
- Report issues with collections
- Payment management
- Recent pickups activity feed
- Location management

### � **Cleaner Features**
- Daily route overview and progress tracking
- Visual progress bar (completed vs remaining stops)
- Next stops list with addresses
- Navigate to pickup locations
- QR code scanning for verification
- Shift information display
- Route optimization

### 🎨 **User Interface**
- Beautiful card-based layouts
- Smooth animations and transitions
- Intuitive tab navigation
- Responsive design
- Profile management
- Settings and preferences

## 🚀 Tech Stack

- **Framework:** React Native with Expo Router
- **Authentication:** Firebase Auth (Email/Password, Google OAuth)
- **Database:** Cloud Firestore
- **Local Storage:** AsyncStorage
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet
- **UI Components:** Custom components

## 📂 Project Structure

```
WasteWise/
├── app/
│   ├── _layout.jsx              # Root navigation
│   ├── splash.jsx               # Entry with role detection
│   ├── onboarding.jsx           # 3-page onboarding
│   ├── login.jsx                # Login with role routing
│   ├── signup.jsx               # Signup (customer by default)
│   ├── profile.jsx              # Profile & settings
│   │
│   └── (tabs)/
│       ├── customer/
│       │   ├── _layout.jsx      # Customer tabs
│       │   ├── home.jsx         # Customer dashboard
│       │   ├── map.jsx          # Track truck
│       │   └── locations.jsx    # Address management
│       │
│       └── cleaner/
│           ├── _layout.jsx      # Cleaner tabs
│           ├── home.jsx         # Cleaner dashboard
│           ├── map.jsx          # Route navigation
│           └── stops.jsx        # Pickup stops list
│
├── components/
│   └── app-header.jsx           # Shared header component
│
├── config/
│   └── firebase.js              # Firebase configuration
│
├── services/
│   └── auth.js                  # Authentication service
│
├── .env                         # Firebase credentials
├── ROLE_BASED_SYSTEM.md        # System documentation
├── TESTING_GUIDE.md            # Test scenarios
├── IMPLEMENTATION_SUMMARY.md   # Implementation details
└── FLOW_DIAGRAM.md             # Visual flow charts
```

## 🔥 Firebase Structure

### Authentication
- Email/Password provider
- Google OAuth provider

### Firestore Database
Collection: `users`

```javascript
{
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  displayName: string,
  phoneNumber: string,
  address: string,
  location: null,
  role: "customer" | "cleaner",  // Role determines UI
  profileImage: string,
  isProfileComplete: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🛠️ Installation

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device
- Firebase project with Auth and Firestore enabled

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/nmdra/WasteWise.git
cd WasteWise
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Firebase:**

Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Enable Firebase Services:**
   - Go to Firebase Console
   - Enable Email/Password authentication
   - Enable Google authentication
   - Create Firestore database
   - Set Firestore security rules

5. **Start the development server:**
```bash
npm start
# or
npx expo start
```

6. **Run on your device:**
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   - Or press `a` for Android emulator or `i` for iOS simulator

## 📱 Usage

### First Time User Flow
1. **Splash Screen** - Animated logo (1.5s)
2. **Onboarding** - 3 screens explaining features
3. **Login/Signup** - Create account or sign in
4. **Home Screen** - Role-based dashboard

### Customer Journey
```
Login → Customer Home → Track/Schedule/Report/Pay
      → Map View → See truck location
      → Locations → Manage pickup addresses
```

### Cleaner Journey
```
Login → Cleaner Home → View route & progress
      → Map View → Navigate to stops
      → Stops List → Manage pickup stops
```

### Testing Different Roles

**As Customer (Default):**
- Sign up normally - role is set to "customer" automatically

**As Cleaner (Admin Change):**
1. Sign up as customer
2. Go to Firebase Console → Firestore → `users` collection
3. Find your user document
4. Change `role: "customer"` to `role: "cleaner"`
5. Logout from app and login again
6. You'll see the Cleaner interface!

## 🎨 Design System

### Customer Theme
- **Primary:** #16A34A (Green)
- **Accent:** #DCFCE7 (Light Green)
- **Icon:** 👤
- **Focus:** Waste collection tracking

### Cleaner Theme
- **Primary:** #F59E0B (Orange/Amber)
- **Accent:** #FEF3C7 (Light Orange)
- **Icon:** 🚛
- **Focus:** Route management

### Shared Colors
- **Background:** #F8FAFC
- **Text:** #0B1220
- **Border:** #E2E8F0
- **Error:** #DC2626

## 📖 Documentation

- **[ROLE_BASED_SYSTEM.md](ROLE_BASED_SYSTEM.md)** - Complete system architecture
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Test scenarios and debugging
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's built
- **[FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)** - Visual flow charts

## � Security Features

- ✅ Firebase Authentication tokens
- ✅ Secure password requirements (min 6 chars)
- ✅ Password confirmation on signup
- ✅ Token refresh handled by Firebase
- ✅ Logout clears all local data
- ✅ Role-based access control

## 🚧 Coming Soon

### Phase 2: Map Integration
- Real-time truck tracking with GPS
- Route navigation for cleaners
- Google Maps / Mapbox integration

### Phase 3: QR Code Scanning
- Pickup verification
- Location check-in
- Camera permissions

### Phase 4: Notifications
- Pickup reminders
- Route updates
- Push notifications

### Phase 5: Advanced Features
- Payment integration
- Issue reporting with photos
- Schedule management
- Route optimization

## 🧪 Testing

See **[TESTING_GUIDE.md](TESTING_GUIDE.md)** for:
- 10 comprehensive test scenarios
- Debug commands
- Common issues & fixes
- Test results template

Quick test:
```bash
# Run the app
npm start

# Test as customer
1. Sign up with email
2. Should see green customer home

# Test as cleaner
1. Change role in Firebase Console
2. Logout and login
3. Should see orange cleaner home
```

## 🐛 Troubleshooting

### User always goes to customer home
**Fix:** Check if role is properly stored in Firestore and AsyncStorage

### Logout doesn't work
**Fix:** Verify AsyncStorage.multiRemove includes all keys:
```javascript
['userToken', 'userId', 'userEmail', 'userFirstName', 'userRole', 'hasSeenOnboarding']
```

### Can't navigate to profile
**Fix:** Make sure profile route is in `app/_layout.jsx`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/) for authentication and database
- [Expo Router](https://expo.github.io/router/) for navigation
- Icons from Unicode Emoji

## 📧 Contact

NIMENDRA - [GitHub](https://github.com/nmdra)

Project Link: [https://github.com/nmdra/WasteWise](https://github.com/nmdra/WasteWise)

---

Made with 💚 for a cleaner tomorrow 🌍
