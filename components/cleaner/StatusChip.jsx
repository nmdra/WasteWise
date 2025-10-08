import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';

const STATUS_MAP = {
  completed: { bg: '#DCFCE7', fg: Colors.state.success, label: 'Completed' },
  pending: { bg: '#FEF3C7', fg: Colors.state.warning, label: 'Pending' },
  missed: { bg: '#FEE2E2', fg: Colors.state.error, label: 'Missed' },
};

export default function StatusChip({ status }) {
  const preset = STATUS_MAP[status] || { bg: '#E2E8F0', fg: Colors.text.secondary, label: status };
  return (
    <View style={[styles.chip, { backgroundColor: preset.bg }]}>
      <Text style={[styles.text, { color: preset.fg }]}>{preset.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radii.chip,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  text: {
    fontWeight: '700',
    fontSize: FontSizes.tiny,
    textTransform: 'capitalize',
  },
});
