import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  message?: string;
  /** Optional icon node (e.g. an Ionicons glyph or emoji). */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Compact variant for small in-list spaces. */
  compact?: boolean;
}

/**
 * Native empty-state view with optional primary action. Use whenever a list
 * or screen has no data, so users never hit a silent blank area.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon ? (
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>{icon}</View>
      ) : null}

      <Text style={[TYPOGRAPHY.headline, styles.title]}>{title}</Text>

      {message ? <Text style={[TYPOGRAPHY.body, styles.message]}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.action}
          accessibilityLabel={actionLabel}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCompact: {
    padding: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surfaceHighlight,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconCircleCompact: {
    width: 48,
    height: 48,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: SPACING.xs,
    color: PALETTE.textMuted,
  },
  action: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
  },
});