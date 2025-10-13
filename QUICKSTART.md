# WasteWise - Quick Start Guide

## Overview
WasteWise is a Smart Waste Management mobile app that helps you track waste collection schedules, manage different waste types, and receive timely reminders.

## Prerequisites
Before running the app, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (optional but recommended): `npm install -g expo-cli`

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

3. **Run the app:**
   - **On a physical device:**
     - Install the "Expo Go" app from App Store (iOS) or Play Store (Android)
     - Scan the QR code shown in the terminal or browser
   
   - **On an emulator/simulator:**
     - Press `a` for Android emulator
     - Press `i` for iOS simulator (Mac only)
     - Press `w` for web browser

## Features

### 1. Dashboard 🏠
- View your next upcoming waste collection
- See all available waste types
- Quick overview of upcoming collections
- Quick action buttons to Calendar and Settings

### 2. Calendar 📅
- Interactive calendar view
- Tap any date to add a collection
- Visual indicators for scheduled collections
- Manage and delete collection dates
- Automatic notification scheduling

### 3. Settings ⚙️
- Enable/disable notifications
- Set reminder time (06:00, 08:00, 10:00, 12:00, 18:00)
- Configure reminder days before collection (0-3 days)
- Reset waste types to defaults
- Clear all data
- View app information

## Default Waste Types

The app includes 6 default waste types:
- 🌱 **Organic** - Food waste, garden waste
- ♻️ **Plastic** - Plastic bottles, containers
- 🫙 **Glass** - Glass bottles, jars
- 📄 **Paper** - Newspapers, cardboard
- 🔧 **Metal** - Aluminum cans, metal containers
- 💻 **Electronic** - E-waste, batteries

## Data Storage

All data is stored locally on your device using AsyncStorage:
- Collection schedules
- Waste type configurations
- User preferences
- No internet connection required

## Notifications

### Setup
- On first launch, the app will request notification permissions
- Enable notifications in Settings to receive reminders
- Customize reminder time and days before collection

### Android
- Uses notification channels for better control
- Requires "Schedule exact alarm" permission for precise timing

### iOS
- Requires notification permissions
- Notifications appear in the system notification center

## Troubleshooting

### App won't start
- Make sure all dependencies are installed: `npm install`
- Clear Metro bundler cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Notifications not working
- Check that notifications are enabled in Settings
- Verify device permissions for notifications
- Ensure the app has permission to schedule exact alarms (Android)

### Calendar not displaying correctly
- Make sure you have a stable internet connection (for initial calendar render)
- Check that the date format is correct in your system settings

## Development

### Project Structure
```
WasteWise/
├── App.js                    # Main app entry with navigation
├── screens/
│   ├── DashboardScreen.js   # Home dashboard
│   ├── CalendarScreen.js    # Calendar view
│   └── SettingsScreen.js    # Settings screen
├── utils/
│   ├── storage.js           # AsyncStorage utilities
│   └── notifications.js     # Notification management
└── assets/                  # App icons and images
```

### Adding New Waste Types
Edit the `getDefaultWasteTypes()` function in `utils/storage.js` to add or modify waste types.

### Customizing Colors
Edit the color scheme in `tailwind.config.js` to change the app's appearance.

## Building for Production

### Android APK
```bash
expo build:android
# or with EAS
eas build -p android
```

### iOS IPA
```bash
expo build:ios
# or with EAS
eas build -p ios
```

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/nmdra/WasteWise
- Issues: https://github.com/nmdra/WasteWise/issues

## License

MIT License - see LICENSE file for details

---

Happy waste management! ♻️🌱
