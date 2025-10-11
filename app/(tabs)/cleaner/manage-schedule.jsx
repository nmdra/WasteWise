import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { createSchedule, wasteTypeIcons } from '../../../services/scheduleService';
import { createMainStopsForSchedule } from '../../../services/stopsService';

const ZONES = ['A', 'B', 'C', 'D', 'E'];

const WASTE_TYPES = [
  { id: 'plastic', label: 'Plastic', icon: '♻️' },
  { id: 'paper', label: 'Paper', icon: '📄' },
  { id: 'organic', label: 'Organic', icon: '🥬' },
  { id: 'glass', label: 'Glass', icon: '🫙' },
  { id: 'metal', label: 'Metal', icon: '🔩' },
  { id: 'other', label: 'Other', icon: '🗑️' },
];

export default function ManageSchedule() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [timeRanges, setTimeRanges] = useState([{ start: '09:00', end: '12:00' }]);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState(['plastic', 'paper', 'organic']);
  const [selectedZone, setSelectedZone] = useState('A');
  const [area, setArea] = useState('');
  const [totalSlots, setTotalSlots] = useState('20');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Main stops state
  const [mainStops, setMainStops] = useState([{ address: '', notes: '' }]);

  const today = new Date().toISOString().slice(0, 10);

  // Toggle waste type selection
  const toggleWasteType = (typeId) => {
    if (selectedWasteTypes.includes(typeId)) {
      setSelectedWasteTypes(selectedWasteTypes.filter((id) => id !== typeId));
    } else {
      setSelectedWasteTypes([...selectedWasteTypes, typeId]);
    }
  };

  // Add new time range
  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { start: '', end: '' }]);
  };

  // Remove time range
  const removeTimeRange = (index) => {
    const updated = timeRanges.filter((_, i) => i !== index);
    setTimeRanges(updated);
  };

  // Update time range
  const updateTimeRange = (index, field, value) => {
    const updated = [...timeRanges];
    updated[index][field] = value;
    setTimeRanges(updated);
  };

  // Main stops functions
  const addMainStop = () => {
    setMainStops([...mainStops, { address: '', notes: '' }]);
  };

  const removeMainStop = (index) => {
    const updated = mainStops.filter((_, i) => i !== index);
    setMainStops(updated);
  };

  const updateMainStop = (index, field, value) => {
    const updated = [...mainStops];
    updated[index][field] = value;
    setMainStops(updated);
  };

  // Save schedule to Firestore
  const handleSaveSchedule = async () => {
    console.log('=== SAVE SCHEDULE BUTTON CLICKED ===');
    
    // Check if user is logged in
    if (!user) {
      console.error('No user logged in!');
      Alert.alert('Error', 'You must be logged in to create a schedule.');
      return;
    }
    
    console.log('User authenticated:', user.uid, user.email);
    
    // Run validation and show inline errors
    const formValid = validateAndSetErrors();
    if (!formValid) {
      console.log('Form validation failed', errors);
      Alert.alert('Invalid Form', 'Please fix the highlighted fields before creating the schedule.');
      return;
    }

    try {
      setSaving(true);

      const scheduleData = {
        collectorId: user.uid,
        collectorName: user.displayName || user.email || 'Collector',
        zone: selectedZone,
        area: area.trim(),
        date: selectedDate,
        timeRanges,
        wasteTypes: selectedWasteTypes,
        totalSlots: parseInt(totalSlots) || 20,
        notes: notes.trim(),
      };

      console.log('Creating schedule with data:', scheduleData);
      const result = await createSchedule(scheduleData);
      const scheduleId = result.scheduleId || result;
      console.log('Schedule created successfully with ID:', scheduleId);

      // Create main stops if any are added
      const validMainStops = mainStops.filter(stop => stop.address.trim() !== '');
      if (validMainStops.length > 0) {
        console.log('Creating', validMainStops.length, 'main stops...');
        const stopsData = validMainStops.map(stop => ({
          ...stop,
          zone: selectedZone,
        }));
        await createMainStopsForSchedule(scheduleId, stopsData);
        console.log('Main stops created successfully');
      }

      Alert.alert(
        'Success',
        `Collection schedule created successfully!\nSchedule ID: ${scheduleId}\nMain Stops: ${validMainStops.length}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving schedule:', error);
      console.error('Error details:', error.code, error.message);
      Alert.alert(
        'Error', 
        `Failed to create schedule.\n\nError: ${error.message || error}\n\nPlease check your internet connection and Firestore permissions.`
      );
    } finally {
      setSaving(false);
    }
  };

  // Validation helpers (pure checks + state-updating runner)
  const getFieldError = (name, value) => {
    let message = '';
    switch (name) {
      case 'selectedDate':
        if (!value) message = 'Please select a collection date.';
        break;
      case 'wasteTypes':
        if (!value || value.length === 0) message = 'Select at least one waste type.';
        break;
      case 'area':
        if (!value || !value.trim()) message = 'Enter the area or neighborhood.';
        break;
      case 'timeRanges':
        for (let i = 0; i < value.length; i++) {
          const r = value[i];
          if (!r.start || !r.end) {
            message = `Time range ${i + 1} is incomplete.`;
            break;
          }
        }
        break;
      default:
        break;
    }
    return message;
  };

  const validateField = (name, value) => {
    const message = getFieldError(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
    return message === '';
  };

  // Validate and set errors (run on submit)
  const validateAndSetErrors = () => {
    const newErrors = {};
    newErrors.selectedDate = getFieldError('selectedDate', selectedDate);
    newErrors.wasteTypes = getFieldError('wasteTypes', selectedWasteTypes);
    newErrors.area = getFieldError('area', area);
    newErrors.timeRanges = getFieldError('timeRanges', timeRanges);

    // Validate main stops addresses (optional: ensure at least empty allowed)
    mainStops.forEach((stop, idx) => {
      const key = `mainStop_${idx}`;
      if (!stop.address || !stop.address.trim()) {
        newErrors[key] = 'Enter an address or remove this stop.';
      } else {
        newErrors[key] = '';
      }
    });

    setErrors(newErrors);
    return Object.values(newErrors).every((v) => !v);
  };

  // Pure check used during render (must NOT call setState)
  const isFormValidPure = () => {
    const sd = getFieldError('selectedDate', selectedDate);
    const wt = getFieldError('wasteTypes', selectedWasteTypes);
    const ar = getFieldError('area', area);
    const tr = getFieldError('timeRanges', timeRanges);
    // main stops not required for overall validity (they are optional)
    return !sd && !wt && !ar && !tr;
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>📅 Create Collection Schedule</Text>
          <Text style={styles.subtitle}>Set up a new waste collection schedule for your zone</Text>
        </View>

        {/* Calendar - Select Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Collection Date</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              current={today}
              minDate={today}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: Colors.primary || '#16A34A',
                },
              }}
              theme={{
                arrowColor: Colors.primary || '#16A34A',
                todayTextColor: Colors.primary || '#16A34A',
                selectedDayBackgroundColor: Colors.primary || '#16A34A',
                selectedDayTextColor: '#ffffff',
              }}
            />
          </View>
          {selectedDate && (
            <Text style={styles.selectedDateText}>
              Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {errors.selectedDate ? (
            <Text style={styles.errorText}>{errors.selectedDate}</Text>
          ) : null}
        </View>

        {/* Time Ranges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Ranges</Text>
          {timeRanges.map((range, index) => (
            <View key={index} style={styles.timeRangeRow}>
              <TextInput
                style={[styles.timeInput, errors.timeRanges ? styles.inputError : null]}
                placeholder="09:00"
                value={range.start}
                onChangeText={(value) => updateTimeRange(index, 'start', value)}
              />
              <Text style={styles.timeSeparator}>to</Text>
              <TextInput
                style={[styles.timeInput, errors.timeRanges ? styles.inputError : null]}
                placeholder="12:00"
                value={range.end}
                onChangeText={(value) => updateTimeRange(index, 'end', value)}
              />
              {timeRanges.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTimeRange(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addTimeRangeButton} onPress={addTimeRange}>
            <Text style={styles.addTimeRangeText}>+ Add Another Time Range</Text>
          </TouchableOpacity>
          {errors.timeRanges ? (
            <Text style={styles.errorText}>{errors.timeRanges}</Text>
          ) : null}
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Types</Text>
          <View style={styles.wasteTypesGrid}>
            {WASTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.wasteTypeChip,
                  selectedWasteTypes.includes(type.id) && styles.wasteTypeChipSelected,
                ]}
                onPress={() => toggleWasteType(type.id)}
              >
                <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.wasteTypeLabel,
                    selectedWasteTypes.includes(type.id) && styles.wasteTypeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Zone & Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone & Area</Text>
          
          <Text style={styles.inputLabel}>Zone</Text>
          <View style={styles.zonesRow}>
            {ZONES.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.zoneChip,
                  selectedZone === zone && styles.zoneChipSelected,
                ]}
                onPress={() => setSelectedZone(zone)}
              >
                <Text
                  style={[
                    styles.zoneChipText,
                    selectedZone === zone && styles.zoneChipTextSelected,
                  ]}
                >
                  {zone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Area / Neighborhood</Text>
          <TextInput
            style={[styles.input, errors.area ? styles.inputError : null]}
            placeholder="e.g., Downtown, Residential Area"
            value={area}
            onChangeText={(v) => {
              setArea(v);
              if (errors.area) validateField('area', v);
            }}
            onBlur={() => validateField('area', area)}
          />
          {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacity</Text>
          <Text style={styles.inputLabel}>Total Available Slots</Text>
          <TextInput
            style={styles.input}
            placeholder="20"
            keyboardType="number-pad"
            value={totalSlots}
            onChangeText={setTotalSlots}
          />
          <Text style={styles.helperText}>
            Number of customers that can book this schedule
          </Text>
        </View>

        {/* Main Stops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Main Collection Stops</Text>
          <Text style={styles.helperText}>
            Add key locations where you'll collect waste. Customer addresses will be added automatically.
          </Text>
          
          {mainStops.map((stop, index) => (
            <View key={index} style={styles.stopContainer}>
              <Text style={styles.stopLabel}>Stop {index + 1}</Text>
              
              <TextInput
                style={[styles.input, errors[`mainStop_${index}`] ? styles.inputError : null]}
                placeholder="Enter address (e.g., Main Street Market)"
                value={stop.address}
                onChangeText={(value) => {
                  updateMainStop(index, 'address', value);
                  if (errors[`mainStop_${index}`])
                    setErrors((p) => ({ ...p, [`mainStop_${index}`]: '' }));
                }}
              />
              {errors[`mainStop_${index}`] ? (
                <Text style={styles.errorText}>{errors[`mainStop_${index}`]}</Text>
              ) : null}
              
              <TextInput
                style={[styles.input, { marginTop: Spacing.sm }]}
                placeholder="Notes (optional)"
                value={stop.notes}
                onChangeText={(value) => updateMainStop(index, 'notes', value)}
              />
              
              {mainStops.length > 1 && (
                <TouchableOpacity
                  style={styles.removeStopButton}
                  onPress={() => removeMainStop(index)}
                >
                  <Text style={styles.removeStopButtonText}>Remove Stop</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity style={styles.addStopButton} onPress={addMainStop}>
            <Text style={styles.addStopText}>+ Add Another Stop</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any special instructions or information..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (saving || !isFormValidPure()) && styles.saveButtonDisabled,
            ]}
            onPress={() => {
              console.log('🔘 CREATE SCHEDULE BUTTON PRESSED!');
              handleSaveSchedule();
            }}
            disabled={saving || !isFormValidPure()}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Create Schedule</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  calendarContainer: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  selectedDateText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.primary || '#16A34A',
    fontWeight: '600',
    textAlign: 'center',
  },
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeInput: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
  },
  timeSeparator: {
    marginHorizontal: Spacing.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.state.error,
    borderRadius: Radii.small,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  addTimeRangeButton: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary || '#16A34A',
    borderRadius: Radii.small,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addTimeRangeText: {
    color: Colors.primary || '#16A34A',
    fontWeight: '600',
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  wasteTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: Radii.chip,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  wasteTypeChipSelected: {
    borderColor: Colors.primary || '#16A34A',
    backgroundColor: '#e8f5e9',
  },
  wasteTypeIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  wasteTypeLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wasteTypeLabelSelected: {
    color: Colors.primary || '#16A34A',
  },
  inputLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  zoneChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  zoneChipSelected: {
    borderColor: Colors.primary || '#16A34A',
    backgroundColor: '#e8f5e9',
  },
  zoneChipText: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  zoneChipTextSelected: {
    color: Colors.primary || '#16A34A',
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  footer: {
    padding: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary || '#16A34A',
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSizes.h3,
    fontWeight: '700',
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  stopContainer: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginTop: Spacing.md,
  },
  stopLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  removeStopButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.state.error,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  removeStopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addStopButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary || '#16A34A',
    borderRadius: Radii.small,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addStopText: {
    color: Colors.primary || '#16A34A',
    fontWeight: '600',
  },
  inputError: {
    borderColor: Colors.state.error || '#DC2626',
    borderWidth: 2,
  },
  errorText: {
    color: Colors.state.error || '#DC2626',
    marginTop: Spacing.xs,
    fontSize: FontSizes.small,
  },
});
