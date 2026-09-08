import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PALETTE, RADIUS, SPACING } from '../../theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Optional leading icon node (e.g. an Ionicons glyph). */
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * Native selectable chip. The visual height is compact (32dp) but hitSlop
 * expands the effective touch target to the 44pt / 48dp minimum.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  disabled = false,
  onPress,
  icon,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
    >
      {icon ?? null}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: PALETTE.surfaceHighlight,
    borderColor: PALETTE.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  labelSelected: {
    color: PALETTE.primaryLight,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});