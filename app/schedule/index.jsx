import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDateISO, formatHumanDate, addDays } from '../../utils/date';

export default function ScheduleIndex() {
  const router = useRouter();
  const todayISO = useMemo(() => formatDateISO(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayISO);

  // Generate a simple 60-day window for selection (no external calendar deps)
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      const d = addDays(new Date(), i);
      arr.push({
        iso: formatDateISO(d),
        labelTop: d.toLocaleString(undefined, { month: 'short' }),
        labelMid: d.getDate(),
        labelBot: d.toLocaleString(undefined, { weekday: 'short' }),
      });
    }
    return arr;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Collection</Text>

      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
      >
        {days.map((d) => {
          const isSelected = d.iso === selectedDate;
          return (
            <Pressable
              key={d.iso}
              onPress={() => setSelectedDate(d.iso)}
              style={[
                styles.pill,
                isSelected && styles.pillSelected,
              ]}
            >
              <Text style={[styles.pillTop, isSelected && styles.pillSelectedText]}>
                {d.labelTop}
              </Text>
              <Text style={[styles.pillMid, isSelected && styles.pillSelectedText]}>
                {d.labelMid}
              </Text>
              <Text style={[styles.pillBot, isSelected && styles.pillSelectedText]}>
                {d.labelBot}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectedDateText}>
          Selected: {formatHumanDate(selectedDate)}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push(`/schedule/select?date=${encodeURIComponent(selectedDate)}`)}
        >
          <Text style={styles.primaryBtnText}>View Time Slots</Text>
        </Pressable>
      </View>
    </View>
  );
}

const GREEN = '#2e7d32';
const LIGHT = '#f3f5ef';
const BORDER = '#dfe5d7';
const TEXT = '#243024';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 24, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: TEXT, marginVertical: 8 },
  pillsContainer: { paddingRight: 8 },
  pill: {
    width: 72,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pillSelected: {
    backgroundColor: LIGHT,
    borderColor: GREEN,
  },
  pillTop: { fontSize: 12, color: TEXT, opacity: 0.7 },
  pillMid: { fontSize: 22, fontWeight: '700', color: TEXT },
  pillBot: { fontSize: 12, color: TEXT, opacity: 0.7 },
  pillSelectedText: { color: GREEN },
  footer: { marginTop: 'auto', paddingVertical: 16 },
  selectedDateText: { fontSize: 14, color: TEXT, marginBottom: 8 },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});