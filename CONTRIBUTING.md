# WasteWise - Contributing Guide

Thank you for your interest in contributing to WasteWise! This guide will help you get started with development.

## Development Setup

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Git
- Code editor (VS Code recommended)
- Expo CLI (optional): `npm install -g expo-cli`

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/nmdra/WasteWise.git
cd WasteWise

# Install dependencies
npm install

# Start development server
npm start
```

## Project Architecture

### Directory Structure
```
WasteWise/
├── App.js                 # Main entry point
├── screens/              # Screen components
├── components/           # Reusable UI components
├── utils/                # Utility functions
│   ├── storage.js       # AsyncStorage operations
│   ├── notifications.js # Notification management
│   └── helpers.js       # Helper functions
└── assets/              # Images and static files
```

### Key Technologies
- **React Native**: Mobile framework
- **Expo**: Development platform
- **React Navigation**: Navigation library
- **NativeWind**: Tailwind CSS for React Native
- **AsyncStorage**: Local data persistence
- **expo-notifications**: Local notifications

## Code Style Guidelines

### JavaScript/React
- Use functional components with hooks
- Follow ES6+ syntax
- Use destructuring when appropriate
- Keep components small and focused
- Use meaningful variable names

### Example:
```javascript
// Good
const DashboardScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  return <View>...</View>;
};

// Avoid
function Screen(props) {
  var x = [];
  // ...
}
```

### Component Structure
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Component definition
export default function MyComponent({ prop1, prop2 }) {
  // 3. State
  const [state, setState] = useState(initialValue);
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Helper functions
  const helperFunction = () => {
    // Helper logic
  };
  
  // 7. Render
  return (
    <View>
      <Text>Content</Text>
    </View>
  );
}
```

### Styling with NativeWind
```javascript
// Use Tailwind class names
<View className="bg-white rounded-xl p-4 shadow-sm">
  <Text className="text-gray-800 font-semibold text-lg">
    Title
  </Text>
</View>

// For dynamic styles, use style prop
<View 
  className="rounded-full"
  style={{ backgroundColor: color + '20' }}
>
```

## Making Changes

### Adding a New Feature

1. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement the feature**
   - Write clean, modular code
   - Follow existing patterns
   - Add comments for complex logic
   - Update relevant documentation

3. **Test your changes**
   - Test on both iOS and Android
   - Test different screen sizes
   - Test edge cases
   - Ensure no errors in console

4. **Commit your changes**
```bash
git add .
git commit -m "feat: Add your feature description"
```

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

### Commit Message Format
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: Add recurring schedule feature
fix: Resolve notification timing issue
docs: Update README with new instructions
refactor: Simplify date formatting logic
```

## Common Development Tasks

### Adding a New Screen

1. Create screen file in `screens/` directory:
```javascript
// screens/NewScreen.js
import React from 'react';
import { View, Text } from 'react-native';

export default function NewScreen() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold">New Screen</Text>
    </View>
  );
}
```

2. Add to navigation in `App.js`:
```javascript
<Tab.Screen
  name="NewScreen"
  component={NewScreen}
  options={{
    tabBarLabel: 'New',
    tabBarIcon: ({ focused }) => <TabBarIcon icon="🆕" focused={focused} />,
  }}
/>
```

### Adding a New Waste Type

Edit `utils/storage.js`:
```javascript
const getDefaultWasteTypes = () => [
  // Existing types...
  { id: '7', name: 'Hazardous', color: '#ef4444', icon: '⚠️' },
];
```

### Adding a New Storage Key

1. Define key in `utils/storage.js`:
```javascript
const STORAGE_KEYS = {
  // Existing keys...
  NEW_KEY: '@wastewise_new_key',
};
```

2. Add getter/setter functions:
```javascript
export const saveNewData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NEW_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving new data:', error);
  }
};

export const getNewData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NEW_KEY);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error getting new data:', error);
    return defaultValue;
  }
};
```

### Adding a Reusable Component

Create in `components/UIComponents.js`:
```javascript
export function NewComponent({ title, onPress }) {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4"
      onPress={onPress}
    >
      <Text className="text-gray-800 font-semibold">{title}</Text>
    </TouchableOpacity>
  );
}
```

## Debugging

### Console Logs
```javascript
// Development logging
console.log('Debug info:', data);
console.error('Error:', error);

// Production: Remove or use proper logging service
```

### React Native Debugger
1. Press `Cmd + D` (iOS) or `Cmd + M` (Android)
2. Select "Debug" to open Chrome DevTools
3. Use Console and Network tabs

### Expo DevTools
- Press `Shift + M` to open dev menu
- View logs in terminal
- Use Expo Go app for device testing

## Testing

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] UI looks correct on different screen sizes
- [ ] Works on both iOS and Android
- [ ] Data persists correctly
- [ ] Notifications work (if applicable)

### Edge Cases to Test
- Empty states (no data)
- Large datasets (many collections)
- Past dates
- Future dates far ahead
- Rapid user interactions
- App restart with data

## Performance Considerations

### Best Practices
- Avoid unnecessary re-renders
- Use `React.memo` for expensive components
- Optimize list rendering with `FlatList`
- Lazy load data when appropriate
- Minimize AsyncStorage operations

### Example Optimization
```javascript
// Use memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.date - b.date);
}, [data]);

// Use useCallback for event handlers
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Troubleshooting

### Metro Bundler Cache Issues
```bash
# Clear cache and restart
expo start -c
# or
npx react-native start --reset-cache
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Expo Version Conflicts
```bash
# Check for updates
expo upgrade
```

## Documentation

### Update Documentation When:
- Adding new features
- Changing existing behavior
- Adding new dependencies
- Modifying configuration
- Adding new components or utilities

### Documentation Files
- `README.md` - Main project overview
- `QUICKSTART.md` - Getting started guide
- `EXAMPLES.md` - Usage examples
- `TESTING.md` - Testing procedures
- `CONTRIBUTING.md` - This file

## Code Review Guidelines

### Before Submitting PR
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Commits are clean and descriptive

### PR Description Should Include
- What: Brief description of changes
- Why: Reason for the changes
- How: Technical approach
- Testing: How you tested
- Screenshots: For UI changes

## Release Process

### Version Numbering
Follow Semantic Versioning (semver):
- MAJOR.MINOR.PATCH (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist
1. Update version in `package.json` and `app.json`
2. Update CHANGELOG.md
3. Test thoroughly
4. Create release tag
5. Build production apps
6. Deploy to app stores

## Getting Help

### Resources
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [NativeWind Docs](https://www.nativewind.dev/)

### Community
- GitHub Issues: Report bugs or request features
- Discussions: Ask questions or share ideas

## License

By contributing to WasteWise, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WasteWise! 🌱♻️
