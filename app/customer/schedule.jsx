import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import AppHeader from '../../components/app-header';
import { Colors } from '../../constants/customerTheme';
import { 
  subscribeToSchedulesByZone, 
  wasteTypeColors, 
  wasteTypeIcons,
  formatTimeRange 
} from '../../services/scheduleService';
import { getUserProfile } from '../../services/auth';

const ZONES = ['A', 'B', 'C', 'D', 'E'];

export default function Schedule() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulesMap, setSchedulesMap] = useState({});
  const [userZone, setUserZone] = useState('A');
  const [selectedZone, setSelectedZone] = useState('A'); // Zone filter

  // Load user zone
  useEffect(() => {
    loadUserZone();
  }, []);

  const loadUserZone = async () => {
    try {
      if (!user) return;
      
      const result = await getUserProfile(user.uid);
      if (result.success && result.user) {
        const zone = result.user.zone || 'A';
        setUserZone(zone);
        setSelectedZone(zone);
      }
    } catch (error) {
      console.error('Error loading user zone:', error);
    }
  };

  // Subscribe to schedules from Firestore
  useEffect(() => {
    if (!selectedZone) return;
    
    const unsubscribe = subscribeToSchedulesByZone(selectedZone, (fetchedSchedules) => {
      setSchedules(fetchedSchedules);
      
      // Build map of date -> schedule data
      const map = {};
      fetchedSchedules.forEach(schedule => {
        map[schedule.date] = schedule;
      });
      setSchedulesMap(map);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedZone]);

  const selectedSchedule = schedulesMap[selectedDate] || null;

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Build marked dates for calendar from schedules
  const markedDates = {};
  schedules.forEach((schedule) => {
    const dots = schedule.wasteTypes?.map((type) => ({
      key: type,
      color: wasteTypeColors[type] || '#16A34A',
    })) || [];

    markedDates[schedule.date] = {
      dots,
      marked: true,
    };
  });

  // Mark selected date
  if (markedDates[selectedDate]) {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = Colors.primary || '#16A34A';
  } else {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.primary || '#16A34A',
    };
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <AppHeader />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary || '#16A34A'} />
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader />

        {/* Zone Switcher */}
        <View style={styles.zoneSwitcher}>
          <Text style={styles.zoneSwitcherTitle}>
            View Zone: {selectedZone === userZone ? `${selectedZone} (Your Zone)` : selectedZone}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zoneScrollContent}
          >
            {ZONES.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.zoneFilterChip,
                  selectedZone === zone && styles.zoneFilterChipSelected,
                  zone === userZone && styles.zoneFilterChipUser,
                ]}
                onPress={() => {
                  setSelectedZone(zone);
                  setLoading(true);
                }}
              >
                <Text
                  style={[
                    styles.zoneFilterChipText,
                    selectedZone === zone && styles.zoneFilterChipTextSelected,
                  ]}
                >
                  Zone {zone}
                  {zone === userZone && ' 📍'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
              markedDates={markedDates}
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

          {/* --- Schedule Details Section --- */}
          <View style={styles.scheduleDetailsContainer}>
            <Text style={styles.scheduleDetailsTitle}>
              Collection Schedule for {formattedDate}
            </Text>
            
            {selectedSchedule ? (
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.infoLabel}>Area:</Text>
                  <Text style={styles.infoValue}>
                    {selectedSchedule.area} • Zone {selectedSchedule.zone}
                  </Text>
                </View>

                <View style={styles.scheduleInfo}>
                  <Text style={styles.infoLabel}>Collection Times:</Text>
                  {selectedSchedule.timeRanges?.map((range, idx) => (
                    <Text key={idx} style={styles.infoValue}>
                      ⏰ {formatTimeRange(range)}
                    </Text>
                  ))}
                </View>

                <View style={styles.scheduleInfo}>
                  <Text style={styles.infoLabel}>Waste Types:</Text>
                  <View style={styles.wasteTypesRow}>
                    {selectedSchedule.wasteTypes?.map((type) => (
                      <View key={type} style={styles.wasteTypeBadge}>
                        <Text style={styles.wasteTypeBadgeText}>
                          {wasteTypeIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.scheduleInfo}>
                  <Text style={styles.infoLabel}>Availability:</Text>
                  <Text style={styles.infoValue}>
                    {selectedSchedule.availableSlots} / {selectedSchedule.totalSlots} slots available
                  </Text>
                </View>

                {selectedSchedule.notes && (
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.infoLabel}>Notes:</Text>
                    <Text style={styles.infoValue}>{selectedSchedule.notes}</Text>
                  </View>
                )}

                <View style={styles.statusBanner}>
                  <Text style={styles.statusBannerText}>
                    ✅ Collection scheduled for this day
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noScheduleCard}>
                <Text style={styles.noScheduleIcon}>📭</Text>
                <Text style={styles.noScheduleText}>
                  No collection scheduled for this day
                </Text>
                <Text style={styles.noScheduleSubtext}>
                  Check other dates on the calendar for available collection schedules
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* --- Action Button --- */}
        {selectedSchedule && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.continueButton}
              disabled={selectedSchedule.availableSlots <= 0}
            >
              <Text style={styles.continueButtonText}>
                {selectedSchedule.availableSlots > 0 
                  ? 'Book Special Pickup' 
                  : 'Fully Booked'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
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
  scheduleDetailsContainer: { 
    paddingHorizontal: 16, 
    marginTop: 10 
  },
  scheduleDetailsTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    color: '#333' 
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scheduleInfo: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  wasteTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  wasteTypeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary || '#16A34A',
  },
  wasteTypeBadgeText: {
    fontSize: 14,
    color: Colors.primary || '#16A34A',
    fontWeight: '600',
  },
  statusBanner: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  statusBannerText: {
    fontSize: 14,
    color: Colors.primary || '#16A34A',
    fontWeight: '600',
    textAlign: 'center',
  },
  noScheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  noScheduleIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noScheduleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  noScheduleSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: { 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  continueButton: { 
    backgroundColor: Colors.primary || '#16A34A', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  continueButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  zoneSwitcher: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  zoneSwitcherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  zoneScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  zoneFilterChipSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: Colors.primary || '#16A34A',
  },
  zoneFilterChipUser: {
    borderStyle: 'dashed',
  },
  zoneFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  zoneFilterChipTextSelected: {
    color: Colors.primary || '#16A34A',
  },
});