import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PALETTE, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Text label for the trailing action (e.g. "View all"). */
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel?: string;
}

/**
 * Native section header with an amber accent bar (heritage motif) and an
 * optional trailing action. The action text gets hitSlop so its effective
 * touch target meets the 44pt / 48dp minimum.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  accessibilityLabel,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.accent} />
      <View style={styles.textColumn}>
        <Text style={TYPOGRAPHY.headline} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[TYPOGRAPHY.footnote, styles.subtitle]}>{subtitle}</Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || actionLabel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={onAction}
          style={({ pressed }) => [styles.actionWrap, pressed && styles.actionPressed]}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: PALETTE.primary,
    marginRight: SPACING.sm,
  },
  textColumn: {
    flex: 1,
    marginRight: SPACING.md,
  },
  subtitle: {
    marginTop: SPACING.xs,
  },
  actionWrap: {
    minHeight: TOUCH_TARGET.minHeight,
    justifyContent: 'center',
  },
  actionPressed: {
    opacity: 0.7,
  },
  action: {
    color: PALETTE.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});