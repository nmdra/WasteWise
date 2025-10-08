import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, ghost, danger
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.bg.light;
    switch (variant) {
      case 'primary': return Colors.brand.green;
      case 'secondary': return Colors.brand.teal;
      case 'danger': return Colors.state.error;
      case 'ghost': return 'transparent';
      default: return Colors.brand.green;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.text.muted;
    switch (variant) {
      case 'ghost': return Colors.brand.green;
      default: return Colors.text.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return Spacing.sm;
      case 'large': return Spacing.lg;
      default: return Spacing.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: getPadding(),
          paddingHorizontal: getPadding() * 1.5,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? Colors.line : 'transparent',
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.btn,
    gap: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  icon: {
    fontSize: 18,
  },
});
