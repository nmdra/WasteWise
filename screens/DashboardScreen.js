import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { getCollectionDates, getWasteTypes } from '../utils/storage';

export default function DashboardScreen({ navigation }) {
  const [collectionDates, setCollectionDates] = useState([]);
  const [wasteTypes, setWasteTypes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCollection, setNextCollection] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const dates = await getCollectionDates();
    const types = await getWasteTypes();
    setCollectionDates(dates);
    setWasteTypes(types);
    
    // Find next upcoming collection
    const now = new Date();
    const upcoming = dates
      .filter(d => new Date(d.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    setNextCollection(upcoming);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDaysUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getUpcomingCollections = () => {
    const now = new Date();
    return collectionDates
      .filter(d => new Date(d.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const getWasteTypeById = (id) => {
    return wasteTypes.find(w => w.id === id);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-800">WasteWise</Text>
          <Text className="text-gray-600 mt-1">Manage your waste collection schedule</Text>
        </View>

        {/* Next Collection Card */}
        {nextCollection ? (
          <View className="bg-primary rounded-2xl p-6 mb-6 shadow-lg">
            <Text className="text-white text-lg font-semibold mb-2">Next Collection</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-4xl font-bold mb-1">
                  {getWasteTypeById(nextCollection.wasteTypeId)?.icon || '♻️'}
                </Text>
                <Text className="text-white text-xl font-semibold">
                  {getWasteTypeById(nextCollection.wasteTypeId)?.name || 'Unknown'}
                </Text>
                <Text className="text-white text-sm opacity-90 mt-1">
                  {formatDate(nextCollection.date)}
                </Text>
              </View>
              <View className="bg-white rounded-full w-20 h-20 items-center justify-center">
                <Text className="text-primary text-2xl font-bold">
                  {getDaysUntil(nextCollection.date)}
                </Text>
                <Text className="text-primary text-xs font-semibold">days</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-gray-200 rounded-2xl p-6 mb-6">
            <Text className="text-gray-600 text-center">No upcoming collections scheduled</Text>
            <TouchableOpacity 
              className="bg-primary rounded-lg p-3 mt-4"
              onPress={() => navigation.navigate('Calendar')}
            >
              <Text className="text-white text-center font-semibold">Add Collection Date</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Waste Types Overview */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Waste Types</Text>
          <View className="flex-row flex-wrap -mx-2">
            {wasteTypes.map((type) => (
              <View key={type.id} className="w-1/3 px-2 mb-4">
                <View className="bg-white rounded-xl p-4 items-center shadow-sm">
                  <Text className="text-4xl mb-2">{type.icon}</Text>
                  <Text className="text-gray-800 font-semibold text-center text-sm">
                    {type.name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Collections */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Upcoming Collections</Text>
          {getUpcomingCollections().length > 0 ? (
            getUpcomingCollections().map((collection, index) => {
              const wasteType = getWasteTypeById(collection.wasteTypeId);
              return (
                <View 
                  key={collection.id} 
                  className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: wasteType?.color + '20' }}
                  >
                    <Text className="text-2xl">{wasteType?.icon || '♻️'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base">
                      {wasteType?.name || 'Unknown'}
                    </Text>
                    <Text className="text-gray-600 text-sm">{formatDate(collection.date)}</Text>
                  </View>
                  <View className="bg-primary rounded-lg px-3 py-1">
                    <Text className="text-white font-semibold text-sm">
                      {getDaysUntil(collection.date)}d
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white rounded-xl p-6">
              <Text className="text-gray-600 text-center">No upcoming collections</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row -mx-2">
            <View className="flex-1 px-2">
              <TouchableOpacity 
                className="bg-secondary rounded-xl p-4 items-center"
                onPress={() => navigation.navigate('Calendar')}
              >
                <Text className="text-3xl mb-2">📅</Text>
                <Text className="text-white font-semibold">Calendar</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 px-2">
              <TouchableOpacity 
                className="bg-warning rounded-xl p-4 items-center"
                onPress={() => navigation.navigate('Settings')}
              >
                <Text className="text-3xl mb-2">⚙️</Text>
                <Text className="text-white font-semibold">Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
