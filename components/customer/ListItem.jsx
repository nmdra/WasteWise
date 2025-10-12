import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';

export default function ListItem({ 
  leftIcon, 
  title, 
  subtitle, 
  rightText, 
  rightIcon, 
  onPress,
  badge,
  badgeColor 
}) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {leftIcon && <Text style={styles.leftIcon}>{leftIcon}</Text>}
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColor || Colors.brand.lightGreen }]}>
              <Text style={[styles.badgeText, { color: badgeColor ? Colors.text.white : Colors.brand.green }]}>
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {rightIcon && <Text style={styles.rightIcon}>{rightIcon}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  leftIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  badgeText: {
    fontSize: FontSizes.tiny,
    fontWeight: '600',
  },
  rightText: {
    fontSize: FontSizes.small,
    color: Colors.text.muted,
    marginLeft: Spacing.sm,
  },
  rightIcon: {
    fontSize: 20,
    color: Colors.text.muted,
    marginLeft: Spacing.sm,
  },
});
