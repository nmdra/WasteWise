import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';

export default function StatCard({ title, value, subtitle, icon, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    minHeight: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text.muted,
    fontSize: FontSizes.small,
    marginBottom: Spacing.xs,
  },
  value: {
    color: Colors.text.primary,
    fontSize: FontSizes.h3,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xs,
  },
});
