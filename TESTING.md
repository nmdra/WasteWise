# WasteWise - Testing Guide

This guide helps you test the WasteWise app to ensure all features work correctly.

## Prerequisites

Before testing:
- ✅ All dependencies installed (`npm install`)
- ✅ Expo Go app installed on your mobile device
- ✅ Development server running (`npm start`)

## Testing Methodology

### 1. Initial Setup Testing

#### Test: First Launch
**Steps:**
1. Start the app for the first time
2. Observe the dashboard

**Expected Results:**
- ✅ App loads without errors
- ✅ Dashboard displays with default waste types
- ✅ "No upcoming collections scheduled" message appears
- ✅ All 6 waste types visible in grid
- ✅ Navigation tabs visible at bottom

**Pass/Fail:** ___________

#### Test: Notification Permissions
**Steps:**
1. Launch app on physical device
2. When prompted, grant notification permissions

**Expected Results:**
- ✅ Permission dialog appears (first launch only)
- ✅ No errors after granting permission
- ✅ Settings shows notifications enabled

**Pass/Fail:** ___________

---

### 2. Dashboard Testing

#### Test: Dashboard Layout
**Steps:**
1. Navigate to Dashboard (Home tab)
2. Scroll through the screen

**Expected Results:**
- ✅ Header shows "WasteWise" title
- ✅ Next Collection card or empty state visible
- ✅ 6 waste type cards displayed in grid
- ✅ Upcoming Collections section visible
- ✅ Quick Actions buttons present

**Pass/Fail:** ___________

#### Test: Pull to Refresh
**Steps:**
1. On Dashboard, pull down from top
2. Release to trigger refresh

**Expected Results:**
- ✅ Refresh indicator appears
- ✅ Data reloads
- ✅ Indicator disappears after refresh

**Pass/Fail:** ___________

#### Test: Quick Actions
**Steps:**
1. Tap Calendar quick action button
2. Verify Calendar screen opens
3. Go back, tap Settings quick action button

**Expected Results:**
- ✅ Calendar button navigates to Calendar
- ✅ Settings button navigates to Settings
- ✅ Navigation is smooth

**Pass/Fail:** ___________

---

### 3. Calendar Testing

#### Test: Calendar Display
**Steps:**
1. Navigate to Calendar tab
2. Observe the calendar view

**Expected Results:**
- ✅ Current month calendar displays
- ✅ Today's date is highlighted
- ✅ Can swipe between months
- ✅ "All Scheduled Collections" list below

**Pass/Fail:** ___________

#### Test: Add Collection
**Steps:**
1. Tap on a future date
2. Modal opens with date selection
3. Select "Organic" waste type
4. Tap "Add Collection"

**Expected Results:**
- ✅ Modal opens showing selected date
- ✅ All 6 waste types visible
- ✅ Selected type shows border highlight
- ✅ "Add Collection" button works
- ✅ Modal closes after adding
- ✅ Date now shows colored dot on calendar
- ✅ Collection appears in list below

**Pass/Fail:** ___________

#### Test: Add Multiple Collections Same Date
**Steps:**
1. Tap on a date that already has a collection
2. Note existing collection shown
3. Select a different waste type
4. Add collection

**Expected Results:**
- ✅ Modal shows existing collections
- ✅ Can add different waste type to same date
- ✅ Both collections visible in list
- ✅ Calendar shows marker for that date

**Pass/Fail:** ___________

#### Test: Delete Collection
**Steps:**
1. Find a collection in the list
2. Tap "Delete" button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ "Cancel" option available
- ✅ After confirming, collection removed
- ✅ Calendar dot removed if no more collections
- ✅ List updates immediately

**Pass/Fail:** ___________

#### Test: Calendar Navigation
**Steps:**
1. Swipe left to next month
2. Swipe right to previous month
3. Verify collections persist

**Expected Results:**
- ✅ Can navigate between months
- ✅ Collections visible on correct dates
- ✅ Can add collections to future months

**Pass/Fail:** ___________

---

### 4. Settings Testing

#### Test: Notification Toggle
**Steps:**
1. Navigate to Settings
2. Toggle "Enable Notifications" off
3. Toggle it back on

**Expected Results:**
- ✅ Switch toggles smoothly
- ✅ No errors occur
- ✅ Setting persists after app restart

**Pass/Fail:** ___________

#### Test: Reminder Time Selection
**Steps:**
1. In Settings, find "Reminder Time"
2. Current time highlighted
3. Tap different time (e.g., 10:00)

**Expected Results:**
- ✅ Time buttons visible: 06:00, 08:00, 10:00, 12:00, 18:00
- ✅ Selected time highlighted in green
- ✅ Selection updates immediately
- ✅ Setting saved

**Pass/Fail:** ___________

#### Test: Days Before Selection
**Steps:**
1. Find "Days Before" section
2. Current selection highlighted
3. Change to different value (e.g., 2 days)

**Expected Results:**
- ✅ Options: Same Day, 1d, 2d, 3d visible
- ✅ Selected option highlighted
- ✅ Updates immediately
- ✅ Setting persists

**Pass/Fail:** ___________

#### Test: Reset Waste Types
**Steps:**
1. Scroll to "Data Management"
2. Tap "Reset Waste Types"
3. Confirm action

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Success message after reset
- ✅ Waste types restored to defaults

**Pass/Fail:** ___________

#### Test: Clear All Data
**Steps:**
1. Add a few collections first
2. Go to Settings
3. Tap "Clear All Data"
4. Confirm action

**Expected Results:**
- ✅ Warning dialog appears
- ✅ "This cannot be undone" message visible
- ✅ After confirming, all data cleared
- ✅ Dashboard shows no collections
- ✅ Calendar has no markers
- ✅ Settings reset to defaults

**Pass/Fail:** ___________

---

### 5. Notification Testing

#### Test: Scheduled Notification Counter
**Steps:**
1. Add 3 collections for future dates
2. Check Settings
3. Find "Scheduled Notifications" counter

**Expected Results:**
- ✅ Counter shows correct number (3)
- ✅ Updates when collections added/deleted
- ✅ Displays number in green badge

**Pass/Fail:** ___________

#### Test: Notification Delivery (Time-Sensitive)
**Steps:**
1. Add a collection for tomorrow
2. Set reminder to 0 days before
3. Wait for notification time

**Expected Results:**
- ✅ Notification appears at scheduled time
- ✅ Title: "Waste Collection Reminder"
- ✅ Body mentions waste type
- ✅ Tapping opens app

**Pass/Fail:** ___________
**Note:** This test requires waiting for the scheduled time

---

### 6. Data Persistence Testing

#### Test: App Restart Persistence
**Steps:**
1. Add 2-3 collections
2. Change settings (reminder time, days before)
3. Close app completely
4. Reopen app

**Expected Results:**
- ✅ All collections still visible
- ✅ Settings preserved
- ✅ Dashboard shows correct data
- ✅ Calendar markers intact

**Pass/Fail:** ___________

#### Test: Navigation State
**Steps:**
1. Navigate to Calendar
2. Close app
3. Reopen app

**Expected Results:**
- ✅ App opens to Dashboard (default)
- ✅ Can navigate to any tab
- ✅ Data intact on all screens

**Pass/Fail:** ___________

---

### 7. Edge Cases & Error Handling

#### Test: Empty States
**Steps:**
1. Clear all data
2. Check each screen

**Expected Results:**
- ✅ Dashboard: "No upcoming collections" with action button
- ✅ Calendar: "No collections scheduled yet"
- ✅ All screens display helpful messages

**Pass/Fail:** ___________

#### Test: Past Date Selection
**Steps:**
1. Open Calendar
2. Swipe to previous month
3. Try adding collection to past date

**Expected Results:**
- ✅ Can add to past dates (for record keeping)
- ✅ Past collections don't show in "upcoming"
- ✅ No errors occur

**Pass/Fail:** ___________

#### Test: Multiple Rapid Actions
**Steps:**
1. Rapidly tap multiple dates
2. Add collections quickly
3. Delete and re-add

**Expected Results:**
- ✅ No crashes or freezes
- ✅ All actions process correctly
- ✅ Data remains consistent

**Pass/Fail:** ___________

#### Test: Long Collection Lists
**Steps:**
1. Add 20+ collections
2. Scroll through lists
3. Check performance

**Expected Results:**
- ✅ Lists scroll smoothly
- ✅ All data displays correctly
- ✅ No lag or performance issues

**Pass/Fail:** ___________

---

### 8. UI/UX Testing

#### Test: Visual Consistency
**Steps:**
1. Navigate through all screens
2. Check colors, fonts, spacing

**Expected Results:**
- ✅ Consistent green primary color (#10b981)
- ✅ Clear font hierarchy
- ✅ Proper spacing and alignment
- ✅ Icons and emojis display correctly

**Pass/Fail:** ___________

#### Test: Touch Targets
**Steps:**
1. Try tapping all buttons and interactive elements
2. Use single finger, avoid stylus

**Expected Results:**
- ✅ All buttons respond to touch
- ✅ Touch targets are adequate size
- ✅ No accidental taps
- ✅ Feedback on button press

**Pass/Fail:** ___________

#### Test: Modals and Dialogs
**Steps:**
1. Open various modals (add collection, confirmations)
2. Try dismissing them different ways

**Expected Results:**
- ✅ Modals can be closed with X button
- ✅ Confirmation dialogs have Cancel option
- ✅ Background dimmed when modal open
- ✅ Smooth animations

**Pass/Fail:** ___________

---

### 9. Platform-Specific Testing

#### Test: Android Specific
**Steps:**
1. Test on Android device/emulator
2. Check back button behavior
3. Verify notification channels

**Expected Results:**
- ✅ Back button works correctly
- ✅ Notifications appear in system tray
- ✅ Notification channel created
- ✅ Can customize notification settings in system

**Pass/Fail:** ___________

#### Test: iOS Specific
**Steps:**
1. Test on iOS device/simulator
2. Check notification permissions
3. Verify safe areas

**Expected Results:**
- ✅ Notch/safe areas respected
- ✅ Notifications request permission properly
- ✅ Swipe gestures work
- ✅ Status bar displays correctly

**Pass/Fail:** ___________

---

### 10. Integration Testing

#### Test: Complete User Flow
**Steps:**
1. Fresh install
2. Add 3 different waste collections
3. Change settings
4. Delete one collection
5. Refresh dashboard
6. Check all screens

**Expected Results:**
- ✅ Smooth end-to-end experience
- ✅ Data syncs across screens
- ✅ All features work together
- ✅ No errors or crashes

**Pass/Fail:** ___________

---

## Test Summary

Total Tests: 30
Passed: ___________
Failed: ___________
Skipped: ___________

### Critical Issues Found:
```
1. [Issue description]
2. [Issue description]
```

### Minor Issues Found:
```
1. [Issue description]
2. [Issue description]
```

### Recommendations:
```
1. [Recommendation]
2. [Recommendation]
```

---

## Device Testing Matrix

| Device | OS | Screen Size | Status | Notes |
|--------|----|-----------|---------|-
| | | | [ ] Pass / [ ] Fail | |
| | | | [ ] Pass / [ ] Fail | |
| | | | [ ] Pass / [ ] Fail | |

---

## Sign-Off

Tester Name: _______________________
Date: _______________________
Signature: _______________________

---

**Note:** For best results, test on both Android and iOS devices with different screen sizes. Some features (like notifications) require testing on physical devices, not simulators.
