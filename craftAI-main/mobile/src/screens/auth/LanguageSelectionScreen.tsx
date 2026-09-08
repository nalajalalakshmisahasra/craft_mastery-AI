import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PALETTE, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { SpeechAdapter, MobileSupportedLanguage } from '../../adapters/speech';
import { useLanguage } from '../../i18n/LanguageContext';
import { StorageAdapter } from '../../adapters/storage';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { BRAND_ASSETS } from '../../config/assets';
import { WelcomeLanguageScreen, AuthStackParamList } from './WelcomeLanguageScreen';

export type FirstLaunchParamList = {
  LanguageSelection: undefined;
  WelcomeLanguage: undefined;
  PhoneAuth: undefined;
  Onboarding: { role: 'ARTISAN' | 'CUSTOMER'; phone: string; name: string };
};

type Props = NativeStackScreenProps<FirstLaunchParamList, 'LanguageSelection'>;

const LANGUAGES: { code: MobileSupportedLanguage; nativeName: string; name: string; flag: string }[] = [
  { code: 'te', nativeName: 'తెలుగు', name: 'Telugu', flag: '🇮🇳' },
  { code: 'hi', nativeName: 'हिन्दी', name: 'Hindi', flag: '🇮🇳' },
  { code: 'en', nativeName: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'ta', nativeName: 'தமிழ்', name: 'Tamil', flag: '🇮🇳' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', name: 'Kannada', flag: '🇮🇳' },
  { code: 'mr', nativeName: 'मराठी', name: 'Marathi', flag: '🇮🇳' },
  { code: 'bn', nativeName: 'বাংলা', name: 'Bengali', flag: '🇮🇳' },
  { code: 'ml', nativeName: 'മലയാളം', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'gu', nativeName: 'ગુજરાતી', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', name: 'Odia', flag: '🇮🇳' },
  { code: 'as', nativeName: 'অসমীয়া', name: 'Assamese', flag: '🇮🇳' },
  { code: 'ur', nativeName: 'اردو', name: 'Urdu', flag: '🇮🇳' },
];

const TELUGU_GREETING = 'క్రాఫ్ట్ మాస్టరీకి స్వాగతం';

/**
 * First-launch language selection flow:
 *   Logo/Splash  →  upward slide  →  Language selection  →  main auth flow.
 *
 * On relaunch, when a language is already persisted, skip straight to
 * WelcomeLanguage (the existing picker) so the user is never blocked.
 */
export const LanguageSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const { lang, setLang, t } = useLanguage();
  const speakRef = useRef<(() => void) | null>(null);
  const translateY = useRef(new Animated.Value(height)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Decide the launch path: persisted language → skip logo and go straight to
  // the existing picker. Otherwise show logo then animate up into language UI.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await StorageAdapter.getSelectedLanguage();
      if (!active) return;
      if (typeof saved === 'string' && LANGUAGES.some((l) => l.code === saved)) {
        // Already chose a language — skip first-launch logo flow entirely.
        navigation.replace('WelcomeLanguage');
        return;
      }
      // First launch: logo appears, then we fade in the language UI and slide
      // it up into place.
      setReady(true);
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 520,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 460,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (active) {
          speakRef.current = () => {
            const greeting = lang === 'en' ? t('welcomeGreeting') : TELUGU_GREETING;
            SpeechAdapter.speak(greeting, lang as MobileSupportedLanguage);
          };
          setSheetVisible(true);
        }
      });
    })();
    return () => {
      active = false;
    };
  }, [lang, navigation, t]);

  const handleSelect = useCallback(
    (code: MobileSupportedLanguage) => {
      setLang(code);
      StorageAdapter.setSelectedLanguage(code);
      const greeting = code === 'en' ? t('welcomeGreeting') : TELUGU_GREETING;
      SpeechAdapter.speak(greeting, code);
      navigation.replace('WelcomeLanguage');
    },
    [navigation, setLang, t],
  );

  const handleHear = useCallback(() => {
    const greeting = lang === 'en' ? t('welcomeGreeting') : TELUGU_GREETING;
    SpeechAdapter.speak(greeting, lang as MobileSupportedLanguage);
  }, [lang, t]);

  // Nothing to render until the first-launch decision completes.
  if (!ready) {
    return (
      <View style={styles.background}>
        <Image source={BRAND_ASSETS.logo} style={styles.logoInitial} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Logo splash that settles out as the language UI slides up. */}
      <Animated.Image
        source={BRAND_ASSETS.logo}
        style={[styles.logo, { opacity: logoOpacity }]}
        resizeMode="contain"
        accessibilityLabel="Craft Mastery Logo"
      />

      {/* Language selection UI, slid up from below on first launch. */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        pointerEvents={sheetVisible ? 'auto' : 'none'}
      >
        <View style={styles.sheetHeader}>
          <Text style={[TYPOGRAPHY.caption, styles.brandEyebrow]}>{t('brandEyebrow')}</Text>
          <Text style={[TYPOGRAPHY.displayHero, styles.heroLine1]}>{t('heroLine1')}</Text>
          <Text style={[TYPOGRAPHY.displayHero, styles.heroLine2, styles.heroAccent]}>{t('heroLine2')}</Text>
          <View style={styles.heroRule} />
          <Text style={[TYPOGRAPHY.body, styles.supporting]}>{t('heroSupport')}</Text>
        </View>

        <Button
          variant="ghost"
          title={t('hearWelcome')}
          onPress={handleHear}
          style={styles.hearButton}
          accessibilityLabel={t('hearWelcome')}
        />

        <Text style={[TYPOGRAPHY.caption, styles.langLabel]}>{t('selectLanguage')}</Text>
        <View style={styles.chipWrap}>
          {LANGUAGES.map((lng) => (
            <Chip
              key={lng.code}
              label={lng.nativeName}
              icon={<Text style={styles.chipFlag}>{lng.flag}</Text>}
              selected={lang === lng.code}
              accessibilityLabel={`${lng.nativeName} (${lng.name})`}
              onPress={() => handleSelect(lng.code)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={t('enterBtn')}
            onPress={() => {
              // Move into the existing phone-auth flow; language is already
              // persisted by handleSelect or the persisted-language path above.
              navigation.navigate('WelcomeLanguage');
            }}
            accessibilityLabel={t('enterBtn')}
            icon={
              <Text style={styles.enterArrow}>→</Text>
            }
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  logoInitial: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  logo: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignSelf: 'center',
    top: 120,
    resizeMode: 'contain',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    backgroundColor: PALETTE.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sheetHeader: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  brandEyebrow: {
    color: PALETTE.primaryLight,
    letterSpacing: 1,
  },
  heroLine1: {
    ...TYPOGRAPHY.displayHero,
    marginTop: SPACING.xs,
  },
  heroLine2: {
    ...TYPOGRAPHY.displayHero,
    color: PALETTE.primary,
  },
  heroAccent: {
    color: PALETTE.primary,
  },
  heroRule: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: PALETTE.primary,
    marginTop: SPACING.md,
  },
  supporting: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.sm,
    maxWidth: '95%',
  },
  hearButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: 0,
  },
  langLabel: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chipFlag: {
    fontSize: 13,
  },
  footer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  enterArrow: {
    color: PALETTE.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
