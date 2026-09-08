import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/**
 * Craft Mastery Mobile Design Tokens
 * Strictly calibrated for Expo React Native on physical iOS and Android devices.
 * Enforces native touch minimums, accessible contrasts, and culturally rooted aesthetics.
 */

export const PALETTE = {
  // Warm ivory, terracotta and muted amber create a grounded craft palette.
  primary: '#B85C38',
  primaryDark: '#8F4329',
  primaryLight: '#C58A3A',
  primaryMuted: 'rgba(184, 92, 56, 0.12)',
  primaryPressed: '#8F4329',

  // Light surface architecture keeps content and craft imagery prominent.
  background: '#FAF7F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFDF8',
  surfaceHighlight: '#F5EDE3',
  surfaceBorder: '#E8DED2',
  borderActive: '#B85C38',
  inputBg: '#FFFDF8',
  scrim: 'rgba(0, 0, 0, 0.6)', // Backdrop overlay for sheets/modals

  // Typographic tones maintain warm, readable contrast on light surfaces.
  textPrimary: '#3B2921',
  textSecondary: '#705C50',
  textMuted: '#8D786A',
  textInverse: '#FFFFFF',

  // Status Colors
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.15)',

  // Loading / Skeleton States
  skeletonBase: '#EEE4D8',
  skeletonHighlight: '#F8F2EA',

  // AI accent stays distinct while remaining within the earth-toned system.
  aiAccent: '#78604A',
  aiAccentMuted: 'rgba(120, 96, 74, 0.14)',
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Touch target minimums strictly enforced per platform guidelines:
 * iOS: 44×44 pt minimum
 * Android: 48×48 dp minimum
 */
export const TOUCH_TARGET = {
  minWidth: Platform.OS === 'ios' ? 44 : 48,
  minHeight: Platform.OS === 'ios' ? 44 : 48,
  padding: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
} as const;

/**
 * Native Typography Hierarchy
 * Uses system fonts (San Francisco on iOS, Roboto on Android) with appropriate line heights
 */
export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayHero: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    letterSpacing: 0.1,
  },
  display: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  statNumber: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  title1: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  title2: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  callout: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: PALETTE.textMuted,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: PALETTE.textMuted,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: PALETTE.textMuted,
    letterSpacing: 0.2,
  },
};

/**
 * Elevation & Shadow Scale
 * Android: elevation. iOS: soft layered shadows. Used by cards, sheets, and floating elements.
 */
export const ELEVATION = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
  }),
  sheet: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
  fab: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
  }),
} as const;

/**
 * Reusable Mobile Component Styles & Interactions
 */
export const COMPONENT_STYLES = StyleSheet.create({
  // Safe container
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  // Card base with tactile border
  card: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  // Primary Action Button (Meeting 48dp / 44pt touch minimums)
  primaryButton: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: PALETTE.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: PALETTE.textInverse,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Secondary Button
  secondaryButton: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: PALETTE.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

/**
 * Tactile touch feedback options for Pressable components
 */
export const PRESSABLE_CONFIG = {
  activeOpacity: 0.7,
  androidRipple: {
    color: 'rgba(184, 92, 56, 0.18)',
    borderless: false,
  },
};
