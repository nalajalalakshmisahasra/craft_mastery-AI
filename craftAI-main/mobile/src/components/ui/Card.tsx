import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native';
import { ELEVATION, PALETTE, RADIUS, SPACING } from '../../theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Raised elevation for sheets/highlighted cards. */
  elevated?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Extra accessibility state (e.g. selected) for pressable cards. */
  accessibilityState?: AccessibilityState;
}

/**
 * Native surface card. Renders as a Pressable when onPress is provided,
 * otherwise a plain View. Uses ELEVATION.card by default and ELEVATION.sheet
 * when elevated is true.
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  elevated = false,
  padding = SPACING.md,
  style,
  accessibilityLabel,
  accessibilityState,
}) => {
  const baseStyle = [
    styles.base,
    elevated ? ELEVATION.sheet : ELEVATION.card,
    { padding },
    style,
  ] as StyleProp<ViewStyle>;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        style={({ pressed }) => [baseStyle, pressed && styles.pressed]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  pressed: {
    opacity: 0.85,
  },
});