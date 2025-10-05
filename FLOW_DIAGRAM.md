# WasteWise Flow Diagram 📊

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SPLASH SCREEN                               │
│  🌱 WasteWise                                                    │
│  (Animated, checks AsyncStorage)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   Check AsyncStorage
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ No Onboard   │    │ No Token     │      │ Has Token    │
│ Seen         │    │ (Logged out) │      │ (Logged in)  │
└──────────────┘    └──────────────┘      └──────────────┘
        ↓                     ↓                     ↓
        ↓                     ↓              Check userRole
        ↓                     ↓                     ↓
┌──────────────┐              ↓            ┌────────┴────────┐
│ ONBOARDING   │              ↓            ↓                 ↓
│ (3 screens)  │              ↓      role="customer"  role="cleaner"
│ - Track      │              ↓            ↓                 ↓
│ - Routes     │              ↓            ↓                 ↓
│ - Rewards    │              ↓      ┌─────────┐      ┌─────────┐
└──────────────┘              ↓      │Customer │      │Cleaner  │
        ↓                     ↓      │  Home   │      │  Home   │
        ↓                     ↓      │ (Green) │      │(Orange) │
        └─────────────────────┘      └─────────┘      └─────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN SCREEN                              │
│  - Email/Password input                                          │
│  - Forgot password link                                          │
│  - Login button                                                  │
│  - Google sign-in button                                         │
│  - Create New Account button                                     │
└─────────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────┐        ┌──────────────┐
│ LOGIN        │        │ SIGNUP       │
│ SUCCESSFUL   │        │ CLICKED      │
└──────────────┘        └──────────────┘
        ↓                       ↓
        ↓               ┌──────────────────────────────────┐
        ↓               │    SIGNUP SCREEN                 │
        ↓               │  - First Name (required)         │
        ↓               │  - Last Name                     │
        ↓               │  - Email (required)              │
        ↓               │  - Phone Number                  │
        ↓               │  - Address                       │
        ↓               │  - Password (required)           │
        ↓               │  - Confirm Password (required)   │
        ↓               │  - [✓] Fill later option         │
        ↓               │  - Create Account button         │
        ↓               │  - Google sign-up button         │
        ↓               └──────────────────────────────────┘
        ↓                       ↓
        ↓                       ↓
        ↓               Create Firebase Auth User
        ↓                       ↓
        ↓               Create Firestore Document
        ↓               (role: "customer" by default)
        ↓                       ↓
        ↓               Store in AsyncStorage:
        ↓               - userToken
        ↓               - userId
        ↓               - userEmail
        ↓               - userFirstName
        ↓               - userRole = "customer"
        ↓                       ↓
        └───────────────────────┘
                    ↓
        Check role from Firestore/AsyncStorage
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────────────┐ ┌──────────────────────┐
│  CUSTOMER HOME       │ │  CLEANER HOME        │
│  (Green Theme)       │ │  (Orange Theme)      │
├──────────────────────┤ ├──────────────────────┤
│ 🌱 WasteWise    [👤]│ │ 🌱 WasteWise    [🚛]│
├──────────────────────┤ ├──────────────────────┤
│ Hello, John! 👋      │ │ Today's Route 🚛     │
│                      │ │                      │
│ 📅 Next Pickup       │ │ 📍 Route Progress    │
│ Wednesday, 7:30 AM   │ │ Total: 42 stops      │
│ 123 Main Street      │ │ ✅ Completed: 18     │
│ [View Details]       │ │ ⏳ Remaining: 24     │
│                      │ │ [43% ████░░░]        │
│ Quick Actions:       │ │ [View Full Route]    │
│ [📍Track]  [📆Sched] │ │                      │
│ [🗑️Report] [💰Pay]   │ │ Quick Actions:       │
│                      │ │ [📍Nav] [📸Scan]     │
│ Recent Pickups:      │ │ [⚠️Rpt] [📋List]     │
│ ✅ Mon, Oct 13       │ │                      │
│ ✅ Fri, Oct 10       │ │ Next Stops:          │
│ ✅ Wed, Oct 8        │ │ 19. 123 Main St →    │
│                      │ │ 20. 456 Park Ave →   │
│ [🚪 Logout]          │ │ 21. 789 Green Rd →   │
│                      │ │                      │
│                      │ │ ⏰ Today's Shift     │
│                      │ │ 6:30 AM - 2:30 PM    │
│                      │ │                      │
│                      │ │ [🚪 Logout]          │
└──────────────────────┘ └──────────────────────┘
        ↓                       ↓
┌───────────┴────────────────────┴───────┐
│         BOTTOM TAB BAR                 │
├────────────────┬───────────────────────┤
│ Customer Tabs  │ Cleaner Tabs          │
├────────────────┼───────────────────────┤
│ 🏠 Home        │ 🏠 Home               │
│ 🗺️ Map         │ 🗺️ Map                │
│ 📍 Locations   │ 📋 Stops              │
└────────────────┴───────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      LOGOUT FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

User clicks [🚪 Logout]
        ↓
Alert: "Are you sure?"
        ↓
    [Cancel] [Logout]
        ↓
Clear AsyncStorage:
  ❌ userToken
  ❌ userId
  ❌ userEmail
  ❌ userFirstName
  ❌ userRole
  ❌ hasSeenOnboarding (optional)
        ↓
Navigate to /login
        ↓
User must login again


┌─────────────────────────────────────────────────────────────────┐
│                   PROFILE SCREEN ACCESS                          │
└─────────────────────────────────────────────────────────────────┘

Tap avatar in header [👤] or [🚛]
        ↓
┌──────────────────────────────────┐
│        PROFILE SCREEN            │
├──────────────────────────────────┤
│         [← Back]                 │
│                                  │
│          ┌───┐                   │
│          │ J │  Avatar           │
│          └───┘                   │
│          John                    │
│       [👤 Customer]              │
│                                  │
│ Account Information:             │
│ Email: john@example.com          │
│ User ID: Xn2kP9...               │
│ Type: Customer                   │
│                                  │
│ Settings:                        │
│ ✏️ Edit Profile       →          │
│ 🔔 Notifications      →          │
│ 🔒 Privacy & Security →          │
│ ❓ Help & Support     →          │
│                                  │
│ [🚪 Logout]                      │
└──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                 ROLE CHANGE SCENARIO                             │
└─────────────────────────────────────────────────────────────────┘

1. User signs up as Customer
        ↓
2. Firebase Admin changes role to "cleaner"
        ↓
3. User logs out from app
        ↓
4. User logs in again
        ↓
5. App detects role="cleaner"
        ↓
6. Navigate to Cleaner Home (orange theme)


┌─────────────────────────────────────────────────────────────────┐
│                  DATA FLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────┘

Firebase Auth              Firestore DB           AsyncStorage
┌──────────┐              ┌──────────┐           ┌──────────┐
│  Email   │              │  users   │           │  Local   │
│   Auth   │◄────────────►│collection│◄─────────►│  Device  │
│          │              │          │           │          │
│ - User   │              │ - uid    │           │ - Token  │
│ - Token  │              │ - email  │           │ - Email  │
│ - Google │              │ - name   │           │ - Name   │
│          │              │ - role   │           │ - Role   │
└──────────┘              └──────────┘           └──────────┘
     ↑                         ↑                       ↑
     │                         │                       │
     └─────────────────────────┴───────────────────────┘
              Synced on login/signup


┌─────────────────────────────────────────────────────────────────┐
│              NAVIGATION STRUCTURE                                │
└─────────────────────────────────────────────────────────────────┘

app/
├── splash.jsx                    (Initial route)
├── onboarding.jsx               (First time users)
├── login.jsx                    (Auth gate)
├── signup.jsx                   (New users)
├── profile.jsx                  (User settings)
│
└── (tabs)/
    ├── customer/
    │   ├── _layout.jsx          (Customer tab wrapper)
    │   ├── home.jsx             (Customer main)
    │   ├── map.jsx              (Track truck)
    │   └── locations.jsx        (Addresses)
    │
    └── cleaner/
        ├── _layout.jsx          (Cleaner tab wrapper)
        ├── home.jsx             (Cleaner main)
        ├── map.jsx              (Route nav)
        └── stops.jsx            (Pickup list)


┌─────────────────────────────────────────────────────────────────┐
│                    COLOR CODING                                  │
└─────────────────────────────────────────────────────────────────┘

Customer Theme:           Cleaner Theme:
██ #16A34A Green         ██ #F59E0B Orange
██ #DCFCE7 Light Green   ██ #FEF3C7 Light Orange
👤 Customer Icon         🚛 Cleaner Icon

Shared:
██ #F8FAFC Background
██ #0B1220 Text
██ #E2E8F0 Borders
```

---

## Key Decision Points 🎯

### 1. **Route Detection (Splash Screen)**
```
Has onboarding? → No → Onboarding
               → Yes → Has token? → No → Login
                                  → Yes → Check role:
                                          - customer → Customer Home
                                          - cleaner → Cleaner Home
```

### 2. **Login Success**
```
User logs in → Get profile from Firestore
            → Extract role field
            → Store in AsyncStorage
            → Navigate to role-specific home
```

### 3. **Logout**
```
User clicks logout → Show confirmation
                  → Clear AsyncStorage (all keys)
                  → Navigate to login
                  → (Next launch: shows onboarding if flag cleared)
```

---

## Role Assignment Strategy 📝

### **Current Implementation:**
- All signups create `role: "customer"` by default
- Admin manually changes role in Firebase Console

### **Future Options:**
1. **During Signup:** Add role selection screen
2. **Separate Apps:** Different apps for customer/cleaner
3. **Admin Portal:** Dashboard to manage user roles
4. **Verification:** Cleaner role requires ID verification

---

## Security Considerations 🔒

1. ✅ Tokens stored securely in AsyncStorage
2. ✅ Logout clears all sensitive data
3. ✅ Role verification from Firestore (server-side)
4. ⚠️ Consider: Custom claims for role (more secure)
5. ⚠️ Consider: Role-based API access rules

---

This diagram shows the complete user journey from app launch to logout! 🚀
