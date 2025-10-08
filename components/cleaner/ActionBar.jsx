import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';

export default function ActionBar({ items = [] }) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => {
        const isPrimary = item.kind === 'primary';
        return (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={[styles.button, isPrimary && styles.primary]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isPrimary && styles.primaryText]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: Spacing.md,
    borderRadius: Radii.btn,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.role.cleaner,
    borderColor: Colors.role.cleaner,
  },
  label: {
    color: Colors.brand.teal,
    fontWeight: '700',
    fontSize: FontSizes.small,
  },
  primaryText: {
    color: Colors.text.white,
  },
});
