import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/customerTheme';

export default function KeyValue({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  label: {
    color: Colors.text.secondary,
    fontSize: FontSizes.small,
  },
  value: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: FontSizes.body,
  },
});
