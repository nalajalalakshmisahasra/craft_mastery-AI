import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PALETTE, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { SpeechAdapter, MobileSupportedLanguage } from '../../adapters/speech';
import { useLanguage } from '../../i18n/LanguageContext';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';

export type AuthStackParamList = {
  HeroPitch: undefined;
  WelcomeLanguage: undefined;
  PhoneAuth: undefined;
  Onboarding: { role: 'ARTISAN' | 'CUSTOMER'; phone: string; name: string };
};

type Props = NativeStackScreenProps<AuthStackParamList, 'WelcomeLanguage'>;

const LANGUAGES: { code: MobileSupportedLanguage; name: string; nativeName: string; flag: string }[] = [
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
];

// Spoken greeting: English reads the English line; every other language keeps
// the original Telugu welcome phrase spoken in that language's voice (the
// historical behavior).
const TELUGU_GREETING = 'క్రాఫ్ట్ మాస్టరీకి స్వాగతం';

export const WelcomeLanguageScreen: React.FC<Props> = ({ navigation }) => {
  const { lang, setLang, t } = useLanguage();

  const handleSelect = (code: MobileSupportedLanguage) => {
    setLang(code);
    const greeting = code === 'en' ? t('welcomeGreeting') : TELUGU_GREETING;
    SpeechAdapter.speak(greeting, code);
  };

  const handleHearGreeting = () => {
    const greeting = lang === 'en' ? t('welcomeGreeting') : TELUGU_GREETING;
    SpeechAdapter.speak(greeting, lang as MobileSupportedLanguage);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Brand eyebrow */}
        <Text style={[TYPOGRAPHY.caption, styles.brand]}>{t('brandEyebrow')}</Text>

        {/* Hero */}
        <Text style={TYPOGRAPHY.displayHero}>
          {`${t('heroLine1')}\n`}
          <Text style={styles.heroAccent}>{t('heroLine2')}</Text>
        </Text>
        <View style={styles.heroRule} />
        <Text style={[TYPOGRAPHY.body, styles.supporting]}>{t('heroSupport')}</Text>

        {/* Secondary CTA: hear the welcome in your language */}
        <Button
          variant="ghost"
          title={t('hearWelcome')}
          onPress={handleHearGreeting}
          style={styles.hearButton}
          accessibilityLabel={t('hearWelcome')}
        />

        {/* Language selection */}
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

        {/* Primary CTA */}
        <View style={styles.footer}>
          <Button
            title={t('enterBtn')}
            onPress={() => navigation.navigate('PhoneAuth')}
            accessibilityLabel={t('enterBtn')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  brand: {
    color: PALETTE.primaryLight,
    letterSpacing: 1,
    marginBottom: SPACING.md,
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
    marginTop: 'auto',
    paddingTop: SPACING.lg,
  },
});