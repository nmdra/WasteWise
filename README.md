# WasteWise 🌱♻️

A Smart Waste Management app built with React Native and Expo to help users track waste collection dates, manage waste types, and receive timely reminders.

## Features

- 📊 **Dashboard**: Overview of upcoming waste collections and waste types
- 📅 **Calendar View**: Interactive calendar to schedule and view collection dates
- 🔔 **Notifications**: Get reminders before collection days
- 🗑️ **Waste Type Management**: Track different waste types (Organic, Plastic, Glass, Paper, Metal, Electronic)
- ⚙️ **Settings**: Customize notifications, reminder times, and manage data
- 💾 **Local Storage**: All data stored locally using AsyncStorage

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development framework and tools
- **React Navigation** - Navigation between screens
- **NativeWind** - Tailwind CSS for React Native styling
- **expo-notifications** - Push notifications and reminders
- **AsyncStorage** - Local data persistence
- **react-native-calendars** - Calendar component

## Project Structure

```
WasteWise/
├── App.js                  # Main app with navigation setup
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── babel.config.js        # Babel configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── screens/
│   ├── DashboardScreen.js # Home dashboard
│   ├── CalendarScreen.js  # Calendar view
│   └── SettingsScreen.js  # Settings and preferences
├── utils/
│   ├── storage.js         # AsyncStorage utilities
│   └── notifications.js   # Notification utilities
└── assets/                # Images and icons
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device (for testing)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/nmdra/WasteWise.git
cd WasteWise
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
# or
expo start
```

4. Run on your device:
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   - Or press `a` for Android emulator or `i` for iOS simulator

## Usage

### Dashboard
- View your next upcoming collection
- See all waste types at a glance
- Quick access to upcoming collections
- Quick action buttons to navigate to Calendar and Settings

### Calendar
- Tap on any date to add a collection
- Select the waste type for collection
- View all scheduled collections
- Delete collections you no longer need
- Visual markers on dates with scheduled collections

### Settings
- Enable/disable notifications
- Set reminder time (default notification time)
- Configure reminder days before collection
- Reset waste types to defaults
- Clear all data
- View app information

## Waste Types

The app comes with 6 default waste types:
- 🌱 **Organic** - Food waste, garden waste
- ♻️ **Plastic** - Plastic bottles, containers, packaging
- 🫙 **Glass** - Glass bottles, jars
- 📄 **Paper** - Newspapers, cardboard, paper
- 🔧 **Metal** - Aluminum cans, metal containers
- 💻 **Electronic** - E-waste, batteries, electronics

## Notifications

- Automatic reminders before collection days
- Customizable reminder time (06:00, 08:00, 10:00, 12:00, 18:00)
- Set reminder days before (0-3 days)
- Android: Uses notification channels for better control
- iOS: Requires notification permissions

## Data Storage

All data is stored locally on your device using AsyncStorage:
- Collection dates and schedules
- Waste types configuration
- User settings and preferences
- No internet connection required

## Development

### Running Tests
```bash
npm test
```

### Building for Production

**Android:**
```bash
expo build:android
```

**iOS:**
```bash
expo build:ios
```

### Creating Standalone Apps
```bash
# Android APK
eas build -p android --profile preview

# iOS IPA
eas build -p ios --profile preview
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons from Unicode Emoji
- Calendar component by [react-native-calendars](https://github.com/wix/react-native-calendars)
- Styled with [NativeWind](https://www.nativewind.dev/)

## Contact

NIMENDRA - [GitHub](https://github.com/nmdra)

Project Link: [https://github.com/nmdra/WasteWise](https://github.com/nmdra/WasteWise)

---

Made with ♻️ for a cleaner tomorrow
