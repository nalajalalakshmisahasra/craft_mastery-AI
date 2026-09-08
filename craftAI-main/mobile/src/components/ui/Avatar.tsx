import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { StyleProp, ViewStyle } from 'react-native';
import { PALETTE, RADIUS } from '../../theme/tokens';

export interface AvatarProps {
  name: string;
  size?: number;
  /** Optional photo URI; falls back to initials when absent. */
  photoUri?: string | null;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((word) => word[0] ?? '').join('').toUpperCase();
}

/**
 * Native avatar circle. Shows a photo via expo-image when available, otherwise
 * renders the person's initials in the brand palette.
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 48,
  photoUri,
  style,
  accessibilityLabel,
}) => {
  const circleStyle = [styles.circle, { width: size, height: size, borderRadius: RADIUS.full }, style];

  return (
    <View
      style={circleStyle}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${name} avatar`}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel || `${name} avatar`}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]} numberOfLines={1}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: PALETTE.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.45)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: PALETTE.primaryLight,
    fontWeight: '700',
  },
});