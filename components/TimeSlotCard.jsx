import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

const BORDER = '#dfe5d7';
const TEXT = '#243024';
const GREEN = '#2e7d32';
const BOOKED = '#ececec';

export default function TimeSlotCard({ slot, selected, onPress }) {
  const disabled = slot.status === 'booked';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        disabled && { backgroundColor: BOOKED, borderColor: BOOKED },
        selected && { borderColor: GREEN, backgroundColor: '#f3f5ef' },
      ]}
    >
      <Text style={[styles.time, disabled && { opacity: 0.6 }]} numberOfLines={2}>
        {slot.start} {'\n'} {slot.end}
      </Text>

      <View style={styles.tagsRow}>
        <Tag
          text={slot.status === 'available' ? 'Available' : 'Booked'}
          color={slot.status === 'available' ? GREEN : '#9e9e9e'}
          light
        />
        <Tag text={slot.priority} color={priorityColor(slot.priority)} />
      </View>
    </Pressable>
  );
}

function Tag({ text, color, light }) {
  return (
    <View style={[
      styles.tag,
      { borderColor: color, backgroundColor: light ? '#fff' : '#f4f4f4' }
    ]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

function priorityColor(p) {
  switch (p) {
    case 'High': return '#d32f2f';
    case 'Medium': return '#f9a825';
    default: return '#1976d2';
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  time: { fontSize: 16, fontWeight: '700', color: TEXT },
  tagsRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
});