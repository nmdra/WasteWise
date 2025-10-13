import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AppHeader from '../../components/app-header';
import { Colors } from '../../constants/customerTheme';

// --- Mock Data generator for Time Slots ---
// Creates sample slots for today + next 3 days so calendar shows mock availability
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function generateMockSlots() {
  const base = new Date();
  const slots = {};
  for (let i = 0; i < 4; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    const key = isoDate(day);

    // simple pattern: alternate booked/available slots
    const daySlots = [
      { time: '09:00 AM', status: i % 2 === 0 ? 'Available' : 'Booked' },
      { time: '10:00 AM', status: 'Booked' },
      { time: '11:00 AM', status: 'Available' },
      { time: '01:00 PM', status: 'Available' },
      { time: '02:00 PM', status: i % 3 === 0 ? 'Booked' : 'Available' },
      { time: '03:00 PM', status: 'Available' },
    ];

    slots[key] = daySlots;
  }

  return slots;
}

const timeSlotsData = generateMockSlots();

export default function Schedule() {
  // default to today (ISO yyyy-mm-dd)
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(null);

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const availableSlots = timeSlotsData[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader />

        {/* Header is shown via AppHeader; no top tabs here */}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* --- Calendar Section --- */}
          <View style={styles.calendarContainer}>
            <Calendar
              current={today}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setSelectedTime(null);
              }}
              // build markedDates from mock data: show a green dot for days with any Available slots
              markedDates={(() => {
                const md = {};
                Object.keys(timeSlotsData).forEach((d) => {
                  const slots = timeSlotsData[d] || [];
                  const hasAvailable = slots.some((s) => s.status === 'Available');
                  md[d] = {
                    dots: hasAvailable ? [{ key: 'avail', color: Colors.primary || '#16A34A' }] : [{ key: 'booked', color: '#BDBDBD' }],
                  };
                });
                // ensure selected date is marked as selected
                md[selectedDate] = md[selectedDate] || { dots: [] };
                md[selectedDate].selected = true;
                md[selectedDate].selectedColor = Colors.primary || '#16A34A';
                return md;
              })()}
              markingType={'multi-dot'}
              theme={{
                arrowColor: Colors.primary || '#16A34A',
                todayTextColor: Colors.primary || '#16A34A',
                dayTextColor: '#333',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: Colors.primary || '#16A34A',
                selectedDayTextColor: '#ffffff',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>

          {/* --- Available Time Slots Section --- */}
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.timeSlotsTitle}>Available Time Slots for {formattedDate}</Text>
            <View style={styles.timeSlotsGrid}>
              {availableSlots.length > 0 ? (
                availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      slot.status === 'Booked' ? styles.timeSlotBooked : {},
                      selectedTime === slot.time ? styles.timeSlotSelected : {},
                    ]}
                    disabled={slot.status === 'Booked'}
                    onPress={() => setSelectedTime(slot.time)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        slot.status === 'Booked' ? styles.timeSlotTextBooked : {},
                        selectedTime === slot.time ? styles.timeSlotTextSelected : {},
                      ]}
                    >
                      {slot.time}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      slot.status === 'Available' ? styles.statusAvailable : styles.statusBooked,
                    ]}>
                      <Text style={styles.statusText}>{slot.status}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noSlotsText}>No available slots for this day.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* --- Continue Button --- */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} disabled={!selectedTime}>
            <Text style={styles.continueButtonText}>{selectedTime ? `Continue (${selectedTime})` : 'Select a time'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  /* top tabs removed */
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeSlotsContainer: { paddingHorizontal: 16, marginTop: 10 },
  timeSlotsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeSlotBooked: { backgroundColor: '#f8f8f8' },
  timeSlotSelected: { borderColor: Colors.primary || '#16A34A', backgroundColor: '#e8f5e9' },
  timeSlotText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  timeSlotTextBooked: { color: '#aaa' },
  timeSlotTextSelected: { color: Colors.primary || '#16A34A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusAvailable: { backgroundColor: '#e0f2e1' },
  statusBooked: { backgroundColor: '#f0f0f0' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#666' },
  noSlotsText: { textAlign: 'center', width: '100%', color: '#888', marginTop: 20 },
  footer: { padding: 16, backgroundColor: '#fff' },
  continueButton: { backgroundColor: Colors.primary || '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});