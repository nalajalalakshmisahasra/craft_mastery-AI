import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, PRESSABLE_CONFIG } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading icon node (e.g. an Ionicons glyph). */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

interface VariantStyle {
  container: ViewStyle;
  text: TextStyle;
  spinnerColor: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    container: { backgroundColor: PALETTE.primary },
    text: { color: PALETTE.textInverse, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
    spinnerColor: PALETTE.textInverse,
  },
  secondary: {
    container: { backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.surfaceBorder },
    text: { color: PALETTE.textPrimary, fontSize: 14, fontWeight: '600' },
    spinnerColor: PALETTE.textPrimary,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: PALETTE.primaryLight, fontSize: 14, fontWeight: '600' },
    spinnerColor: PALETTE.primaryLight,
  },
  destructive: {
    container: { backgroundColor: PALETTE.errorMuted, borderWidth: 1, borderColor: PALETTE.error },
    text: { color: PALETTE.error, fontSize: 14, fontWeight: '600' },
    spinnerColor: PALETTE.error,
  },
};

/**
 * Native action button. Meets 44pt (iOS) / 48dp (Android) touch minimums,
 * supports loading (spinner replaces label) and disabled states, and keeps
 * accessibility role/state wired for assistive tech.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      android_ripple={PRESSABLE_CONFIG.androidRipple}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.spinnerColor} />
      ) : (
        <>
          {icon ?? null}
          <Text style={variantStyle.text}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET.minHeight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  pressed: {
    opacity: PRESSABLE_CONFIG.activeOpacity,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});