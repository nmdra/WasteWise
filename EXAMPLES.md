# WasteWise - Feature Examples

This document provides examples of how to use each feature in the WasteWise app.

## Dashboard Features

### Viewing Next Collection
1. Open the app - Dashboard is the home screen
2. The top card shows your next upcoming collection with:
   - Waste type icon and name
   - Collection date
   - Days remaining until collection

### Waste Types Overview
- The Dashboard displays all 6 waste types in a grid
- Each type has an icon and name
- Tap on any type to see when it's scheduled

### Quick Actions
- **Calendar Button**: Jump directly to the calendar view
- **Settings Button**: Access app settings and preferences

## Calendar Features

### Viewing the Calendar
1. Tap the Calendar tab at the bottom
2. See the full month calendar with markers for scheduled collections
3. Dates with collections show colored dots

### Adding a Collection
1. Tap any date on the calendar
2. A modal appears showing the selected date
3. Select a waste type from the grid
4. Tap "Add Collection" to confirm
5. A notification is automatically scheduled

### Managing Collections
1. Scroll below the calendar to see all scheduled collections
2. Each entry shows:
   - Waste type icon and name
   - Collection date
   - Delete button
3. Tap "Delete" to remove a collection
4. Confirm the deletion when prompted

### Example Schedule
```
Monday, Jan 15 - 🌱 Organic
Wednesday, Jan 17 - ♻️ Plastic
Friday, Jan 19 - 🫙 Glass
Monday, Jan 22 - 📄 Paper
```

## Settings Features

### Enabling Notifications
1. Navigate to Settings tab
2. Toggle "Enable Notifications" switch
3. Grant permission when prompted by your device
4. Notifications are now active

### Setting Reminder Time
1. Go to Settings
2. Find "Reminder Time" section
3. Choose from: 06:00, 08:00, 10:00, 12:00, or 18:00
4. Default time is 08:00 AM
5. All future notifications will use this time

### Configuring Reminder Days
1. In Settings, find "Days Before" section
2. Choose how many days before collection to be reminded:
   - Same Day (0): Get reminder on collection day
   - 1d: Get reminder 1 day before
   - 2d: Get reminder 2 days before
   - 3d: Get reminder 3 days before

### Resetting Waste Types
1. Scroll to "Data Management" section
2. Tap "Reset Waste Types"
3. Confirm the action
4. Waste types return to defaults:
   - Organic, Plastic, Glass, Paper, Metal, Electronic

### Clearing All Data
1. In Settings, scroll to "Data Management"
2. Tap "Clear All Data"
3. Confirm the action (this cannot be undone)
4. All collections, settings, and notifications are removed
5. App returns to initial state

## Notification Examples

### How Notifications Work
When you add a collection date:
1. The app schedules a notification based on your settings
2. Example: Collection on Friday, reminder 1 day before
3. You'll get notified Thursday at 08:00 AM (or your chosen time)

### Notification Content
```
Title: Waste Collection Reminder
Body: Plastic collection tomorrow!
Time: 08:00 AM (or your chosen time)
Date: 1 day before collection (or your chosen days)
```

### Viewing Scheduled Notifications
1. Go to Settings
2. See "Scheduled Notifications" counter
3. This shows how many upcoming reminders are set

## Usage Scenarios

### Scenario 1: Weekly Organic Waste
**Goal**: Set up weekly organic waste collection every Monday

1. Open Calendar
2. Tap on next Monday
3. Select 🌱 Organic
4. Add Collection
5. Repeat for next 4 Mondays to set up the month
6. Receive reminders every Sunday (if set to 1 day before)

### Scenario 2: Bi-weekly Recycling
**Goal**: Alternate weeks for plastic and glass

1. Week 1: Add ♻️ Plastic for Wednesday
2. Week 2: Add 🫙 Glass for Wednesday
3. Week 3: Add ♻️ Plastic for Wednesday
4. Continue pattern

### Scenario 3: Monthly E-waste
**Goal**: First Saturday of each month for electronics

1. Find first Saturday of month
2. Add 💻 Electronic waste
3. Set reminder to 3 days before (Wednesday)
4. Repeat for next months

## Tips & Best Practices

### Organizing Collections
- Use consistent days for each waste type
- Set reminders based on your schedule
- Group similar types on the same day if possible

### Managing Notifications
- Enable notifications for reliable reminders
- Choose a reminder time when you're usually awake
- Set days before based on preparation time needed

### Data Management
- Regularly review your scheduled collections
- Remove past dates to keep calendar clean
- Use "Reset Waste Types" if you change your local system

### Calendar Tips
- Color dots help identify waste types quickly
- Tap dates to see what's scheduled
- Plan ahead by scheduling multiple months

## Troubleshooting Examples

### Problem: Notifications not appearing
**Solution**:
1. Check Settings → Enable Notifications is ON
2. Verify device notification permissions
3. Ensure "Do Not Disturb" is not active during reminder time
4. Check Scheduled Notifications count > 0

### Problem: Cannot add collection
**Solution**:
1. Make sure you selected a waste type
2. Check if date already has that waste type
3. Try closing and reopening the modal

### Problem: Calendar not showing markers
**Solution**:
1. Pull down on Dashboard to refresh
2. Check if collections are in the list below calendar
3. Verify dates are in the future

## Advanced Usage

### Custom Waste Types
While the app comes with 6 default types, you can:
1. Use Settings → Reset Waste Types to restore defaults
2. Remember: Each type has a unique icon and color

### Bulk Scheduling
To schedule multiple dates quickly:
1. Open Calendar
2. Tap first date → Select type → Add
3. Immediately tap next date → Same type → Add
4. Repeat for all dates

### Export/Backup
Currently, data is stored locally. To backup:
1. Note down your scheduled collections
2. Before clearing data or changing devices
3. Re-enter them on the new device

## Future Feature Ideas
- Recurring schedules (weekly, monthly)
- Multiple notification times
- Custom waste types with custom icons
- Export/import schedules
- History of past collections
- Statistics and insights

---

Need help? Check QUICKSTART.md or README.md for more information.
