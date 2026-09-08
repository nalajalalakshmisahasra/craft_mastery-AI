import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/**
 * Native error state with an optional retry action. Use whenever an API call
 * or load fails so users always get feedback and a path forward.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try Again',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>

      <Text style={[TYPOGRAPHY.headline, styles.title]}>{title}</Text>

      <Text style={[TYPOGRAPHY.body, styles.message]}>{message}</Text>

      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          style={styles.retry}
          accessibilityLabel={retryLabel}
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.errorMuted,
    borderColor: PALETTE.error,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: SPACING.xs,
    color: PALETTE.textMuted,
  },
  retry: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
  },
});