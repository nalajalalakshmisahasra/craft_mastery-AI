import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PALETTE, RADIUS, SPACING } from '../../theme/tokens';

export type BadgeTone = 'primary' | 'success' | 'error' | 'warning' | 'neutral' | 'ai';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Optional leading icon node rendered at small size. */
  icon?: React.ReactNode;
}

const TONES: Record<BadgeTone, { background: string; foreground: string }> = {
  primary: { background: PALETTE.primaryMuted, foreground: PALETTE.primaryLight },
  success: { background: PALETTE.successMuted, foreground: PALETTE.success },
  error: { background: PALETTE.errorMuted, foreground: PALETTE.error },
  warning: { background: PALETTE.warningMuted, foreground: PALETTE.warning },
  neutral: { background: PALETTE.surfaceHighlight, foreground: PALETTE.textMuted },
  ai: { background: PALETTE.aiAccentMuted, foreground: PALETTE.aiAccent },
};

/**
 * Native informational badge/tag. Non-interactive; used for status, category
 * and AI-labeled metadata.
 */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral', icon }) => {
  const toneStyle = TONES[tone];

  return (
    <View style={[styles.base, { backgroundColor: toneStyle.background }]}>
      {icon ?? null}
      <Text style={[styles.label, { color: toneStyle.foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});