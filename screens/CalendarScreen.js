import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getCollectionDates, saveCollectionDates, getWasteTypes } from '../utils/storage';
import { scheduleNotification, cancelNotification } from '../utils/notifications';

export default function CalendarScreen() {
  const [collectionDates, setCollectionDates] = useState([]);
  const [wasteTypes, setWasteTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState(null);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateMarkedDates();
  }, [collectionDates, wasteTypes]);

  const loadData = async () => {
    const dates = await getCollectionDates();
    const types = await getWasteTypes();
    setCollectionDates(dates);
    setWasteTypes(types);
  };

  const updateMarkedDates = () => {
    const marked = {};
    collectionDates.forEach(collection => {
      const wasteType = wasteTypes.find(w => w.id === collection.wasteTypeId);
      marked[collection.date] = {
        marked: true,
        dotColor: wasteType?.color || '#10b981',
        selectedColor: wasteType?.color || '#10b981',
      };
    });
    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const addCollection = async () => {
    if (!selectedWasteType) {
      Alert.alert('Error', 'Please select a waste type');
      return;
    }

    const newCollection = {
      id: Date.now().toString(),
      date: selectedDate,
      wasteTypeId: selectedWasteType,
      notificationId: null,
    };

    const wasteType = wasteTypes.find(w => w.id === selectedWasteType);
    
    // Schedule notification
    const notificationId = await scheduleNotification(
      'Waste Collection Reminder',
      `${wasteType?.name || 'Waste'} collection tomorrow!`,
      new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 1),
      newCollection.id
    );
    
    newCollection.notificationId = notificationId;

    const updatedDates = [...collectionDates, newCollection];
    await saveCollectionDates(updatedDates);
    setCollectionDates(updatedDates);
    setModalVisible(false);
    setSelectedWasteType(null);
  };

  const deleteCollection = async (collection) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (collection.notificationId) {
              await cancelNotification(collection.notificationId);
            }
            const filtered = collectionDates.filter(d => d.id !== collection.id);
            await saveCollectionDates(filtered);
            setCollectionDates(filtered);
          },
        },
      ]
    );
  };

  const getCollectionsForSelectedDate = () => {
    return collectionDates.filter(c => c.date === selectedDate);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWasteTypeById = (id) => {
    return wasteTypes.find(w => w.id === id);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="p-4">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-800">Collection Calendar</Text>
            <Text className="text-gray-600 mt-1">Tap a date to add or view collections</Text>
          </View>

          {/* Calendar */}
          <View className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
            <Calendar
              onDayPress={onDayPress}
              markedDates={markedDates}
              theme={{
                todayTextColor: '#10b981',
                selectedDayBackgroundColor: '#10b981',
                selectedDayTextColor: '#ffffff',
                arrowColor: '#10b981',
              }}
            />
          </View>

          {/* Upcoming Collections List */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">All Scheduled Collections</Text>
            {collectionDates
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((collection) => {
                const wasteType = getWasteTypeById(collection.wasteTypeId);
                return (
                  <View 
                    key={collection.id} 
                    className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                  >
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: wasteType?.color + '20' }}
                    >
                      <Text className="text-2xl">{wasteType?.icon || '♻️'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold text-base">
                        {wasteType?.name || 'Unknown'}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {new Date(collection.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-red-100 rounded-lg p-2"
                      onPress={() => deleteCollection(collection)}
                    >
                      <Text className="text-red-600 font-semibold">Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            {collectionDates.length === 0 && (
              <View className="bg-white rounded-xl p-6">
                <Text className="text-gray-600 text-center">No collections scheduled yet</Text>
                <Text className="text-gray-500 text-center text-sm mt-2">
                  Tap a date on the calendar to add a collection
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Collection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Add Collection</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-gray-600 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-4">{formatDate(selectedDate)}</Text>

            {/* Existing Collections on This Date */}
            {getCollectionsForSelectedDate().length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Existing Collections:
                </Text>
                {getCollectionsForSelectedDate().map((collection) => {
                  const wasteType = getWasteTypeById(collection.wasteTypeId);
                  return (
                    <View key={collection.id} className="bg-gray-100 rounded-lg p-3 mb-2 flex-row items-center">
                      <Text className="text-xl mr-2">{wasteType?.icon}</Text>
                      <Text className="text-gray-800 flex-1">{wasteType?.name}</Text>
                      <TouchableOpacity onPress={() => deleteCollection(collection)}>
                        <Text className="text-red-600 font-semibold">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <Text className="text-sm font-semibold text-gray-700 mb-3">Select Waste Type:</Text>
            <ScrollView className="max-h-80">
              <View className="flex-row flex-wrap -mx-1">
                {wasteTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    className={`w-1/2 px-1 mb-3`}
                    onPress={() => setSelectedWasteType(type.id)}
                  >
                    <View 
                      className={`rounded-xl p-4 items-center ${
                        selectedWasteType === type.id ? 'border-2' : 'bg-white'
                      }`}
                      style={selectedWasteType === type.id ? { borderColor: type.color } : {}}
                    >
                      <Text className="text-3xl mb-2">{type.icon}</Text>
                      <Text className="text-gray-800 font-semibold text-center">
                        {type.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              className="bg-primary rounded-xl p-4 mt-4"
              onPress={addCollection}
            >
              <Text className="text-white text-center font-bold text-lg">Add Collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
