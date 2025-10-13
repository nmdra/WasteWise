import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { getSettings, saveSettings, clearAllData, getWasteTypes, saveWasteTypes } from '../utils/storage';
import { requestPermissions, cancelAllNotifications, getAllScheduledNotifications } from '../utils/notifications';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    reminderTime: '08:00',
    reminderDaysBefore: 1,
    theme: 'light',
  });
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadScheduledNotifications();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getSettings();
    setSettings(savedSettings);
  };

  const loadScheduledNotifications = async () => {
    const notifications = await getAllScheduledNotifications();
    setScheduledCount(notifications.length);
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);

    if (key === 'notificationsEnabled' && value) {
      await requestPermissions();
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await cancelAllNotifications();
            Alert.alert('Success', 'All data has been cleared');
            loadSettings();
            setScheduledCount(0);
          },
        },
      ]
    );
  };

  const handleResetWasteTypes = () => {
    Alert.alert(
      'Reset Waste Types',
      'Reset waste types to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            const defaultTypes = [
              { id: '1', name: 'Organic', color: '#10b981', icon: '🌱' },
              { id: '2', name: 'Plastic', color: '#3b82f6', icon: '♻️' },
              { id: '3', name: 'Glass', color: '#06b6d4', icon: '🫙' },
              { id: '4', name: 'Paper', color: '#f59e0b', icon: '📄' },
              { id: '5', name: 'Metal', color: '#6366f1', icon: '🔧' },
              { id: '6', name: 'Electronic', color: '#8b5cf6', icon: '💻' },
            ];
            await saveWasteTypes(defaultTypes);
            Alert.alert('Success', 'Waste types have been reset');
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800">Settings</Text>
          <Text className="text-gray-600 mt-1">Manage your preferences</Text>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Notifications</Text>
          
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">Enable Notifications</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Receive reminders for waste collection
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settings.notificationsEnabled ? '#ffffff' : '#f4f4f5'}
              />
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-800 font-semibold">Scheduled Notifications</Text>
              <View className="bg-primary rounded-full px-3 py-1">
                <Text className="text-white font-bold">{scheduledCount}</Text>
              </View>
            </View>
            <Text className="text-gray-600 text-sm">
              Number of upcoming notification reminders
            </Text>
          </View>
        </View>

        {/* Reminder Settings */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Reminder Settings</Text>
          
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <Text className="text-gray-800 font-semibold text-base mb-2">Reminder Time</Text>
            <Text className="text-gray-600 text-sm mb-3">
              Default notification time: {settings.reminderTime}
            </Text>
            <View className="flex-row">
              {['06:00', '08:00', '10:00', '12:00', '18:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  className={`flex-1 rounded-lg p-2 mx-1 ${
                    settings.reminderTime === time ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  onPress={() => updateSetting('reminderTime', time)}
                >
                  <Text 
                    className={`text-center font-semibold text-xs ${
                      settings.reminderTime === time ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-800 font-semibold text-base mb-2">Days Before</Text>
            <Text className="text-gray-600 text-sm mb-3">
              Get reminded {settings.reminderDaysBefore} day(s) before collection
            </Text>
            <View className="flex-row">
              {[0, 1, 2, 3].map((days) => (
                <TouchableOpacity
                  key={days}
                  className={`flex-1 rounded-lg p-3 mx-1 ${
                    settings.reminderDaysBefore === days ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  onPress={() => updateSetting('reminderDaysBefore', days)}
                >
                  <Text 
                    className={`text-center font-semibold ${
                      settings.reminderDaysBefore === days ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {days === 0 ? 'Same Day' : `${days}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Data Management</Text>
          
          <TouchableOpacity 
            className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            onPress={handleResetWasteTypes}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Text className="text-xl">♻️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">Reset Waste Types</Text>
                <Text className="text-gray-600 text-sm">Restore default waste categories</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 shadow-sm"
            onPress={handleClearData}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Text className="text-xl">🗑️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-red-600 font-semibold text-base">Clear All Data</Text>
                <Text className="text-gray-600 text-sm">Delete all collections and settings</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">About</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="items-center mb-3">
              <Text className="text-4xl mb-2">♻️</Text>
              <Text className="text-xl font-bold text-gray-800">WasteWise</Text>
              <Text className="text-gray-600 text-sm">Version 1.0.0</Text>
            </View>
            <Text className="text-gray-600 text-center text-sm leading-5">
              Smart waste management for a cleaner tomorrow. Track collection schedules, 
              manage waste types, and never miss a collection day.
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View className="mb-6">
          <View className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-200">
            <Text className="text-blue-800 font-semibold mb-1">💡 Tip</Text>
            <Text className="text-blue-700 text-sm">
              Enable notifications to get timely reminders about your waste collection schedule.
            </Text>
          </View>

          <View className="bg-green-50 rounded-xl p-4 border border-green-200">
            <Text className="text-green-800 font-semibold mb-1">🌍 Eco Fact</Text>
            <Text className="text-green-700 text-sm">
              Proper waste sorting can increase recycling rates by up to 50%!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
