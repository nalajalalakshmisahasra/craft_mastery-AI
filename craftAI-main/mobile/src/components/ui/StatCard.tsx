import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ELEVATION, PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Skeleton } from './Skeleton';

export interface StatCardProps {
  label: string;
  value?: string | number;
  sublabel?: string;
  /** Optional right-aligned icon node. */
  icon?: React.ReactNode;
  loading?: boolean;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Native metric card for dashboards. Renders skeleton blocks while loading
 * so the layout never collapses or flashes.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  loading = false,
  accentColor = PALETTE.primaryLight,
  style,
  accessibilityLabel,
}) => {
  return (
    <View
      style={[styles.card, style]}
      accessible
      accessibilityLabel={accessibilityLabel || `${label}: ${loading ? 'Loading' : value ?? '-'}`}
    >
      <View style={styles.content}>
        <View style={styles.textColumn}>
          <Text style={TYPOGRAPHY.caption} numberOfLines={1}>
            {label}
          </Text>

          {loading ? (
            <>
              <Skeleton width={72} height={30} style={styles.skeletonValue} />
              {sublabel ? <Skeleton width="70%" height={12} style={styles.skeletonSub} /> : null}
            </>
          ) : (
            <>
              <Text style={[TYPOGRAPHY.statNumber, { color: accentColor }]} numberOfLines={1}>
                {value ?? '-'}
              </Text>
              {sublabel ? (
                <Text style={TYPOGRAPHY.footnote} numberOfLines={1}>
                  {sublabel}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...(ELEVATION.card as object),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonValue: {
    marginTop: SPACING.xs,
  },
  skeletonSub: {
    marginTop: SPACING.xs,
  },
});