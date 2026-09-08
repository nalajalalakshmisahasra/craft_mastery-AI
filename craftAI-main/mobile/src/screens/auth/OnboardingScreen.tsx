import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PALETTE, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { StorageAdapter } from '../../adapters/storage';
import { ApiAdapter } from '../../adapters/api';
import { AuthUser } from '../../adapters/auth';
import { AuthStackParamList } from './WelcomeLanguageScreen';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Badge } from '../../components/ui/Badge';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'> & {
  onAuthenticated?: (user: AuthUser) => void;
};

export const OnboardingScreen: React.FC<Props> = ({ route, onAuthenticated }) => {
  const { t } = useLanguage();
  const { role, phone, name } = route.params;

  const [craftSpecialty, setCraftSpecialty] = useState(
    role === 'ARTISAN' ? t('defaultSpecialtyArtisan') : t('defaultSpecialtyCustomer')
  );
  const [location, setLocation] = useState(t('defaultLocation'));
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    const session = await StorageAdapter.getAuthSession();
    if (!session?.token) {
      setIsSaving(false);
      return;
    }
    try {
      // Preserve the verified identity and token while updating local onboarding state.
      await StorageAdapter.setOnboarded(phone);
      await StorageAdapter.setSpeechEnabled(voiceGuidance);
      await StorageAdapter.setAuthSession({
        phone,
        name,
        role,
        completedOnboarding: true,
        token: session.token,
      });
    } catch (err) {
      console.warn('Onboarding local save error:', err);
    }

    // Backend profile sync is best-effort and NEVER blocks entry: a temporary
    // API outage must not strand the user on this screen after local onboarding.
    // Fire-and-forget so navigation happens immediately after the local save.
    ApiAdapter.saveUser({
      phone,
      name,
      role,
      onboardingComplete: true,
      craftSpecialty,
      location,
    }).catch((err) => {
      console.warn('Onboarding backend sync note (continuing with local session):', err);
    });

    // Hand the completed session to RootNavigator so it swaps to the role tabs.
    onAuthenticated?.({
      uid: session.token.startsWith('dev:') ? `dev-uid-${phone}` : session.token,
      phone,
      name,
      role,
      completedOnboarding: true,
      token: session.token,
    });
    setIsSaving(false);
  };

  const suggestions =
    role === 'ARTISAN'
      ? [t('suggestionWood'), t('suggestionTextiles'), t('suggestionMetal'), t('suggestionPottery')]
      : [t('suggestionGifts'), t('suggestionDecor'), t('suggestionApparel'), t('suggestionBulk')];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step header section */}
        <Card style={styles.headerCard}>
          <Badge label={t('onboardStepBadge')} tone="primary" />
          <Text style={[TYPOGRAPHY.title1, styles.headerTitle]}>
            {role === 'ARTISAN' ? t('onboardArtisanTitle') : t('onboardCustomerTitle')}
          </Text>
          <Text style={TYPOGRAPHY.body}>{t('onboardWelcome', { name })}</Text>
        </Card>

        {/* Specialty section */}
        <Text style={[TYPOGRAPHY.caption, styles.sectionLabel]}>
          {role === 'ARTISAN' ? t('specialtyLabel') : t('interestsLabel')}
        </Text>
        <Card style={styles.formCard}>
          <TextField
            value={craftSpecialty}
            onChangeText={setCraftSpecialty}
            placeholder={t('specialtyPlaceholder')}
            accessibilityLabel={role === 'ARTISAN' ? t('specialtyLabel') : t('interestsLabel')}
          />
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={craftSpecialty === s}
                onPress={() => setCraftSpecialty(s)}
              />
            ))}
          </View>
        </Card>

        {/* Location section */}
        <Text style={[TYPOGRAPHY.caption, styles.sectionLabel]}>{t('locationLabel')}</Text>
        <Card style={styles.formCard}>
          <TextField
            value={location}
            onChangeText={setLocation}
            placeholder={t('locationPlaceholder')}
            accessibilityLabel={t('locationLabel')}
          />
        </Card>

        {/* Preferences section */}
        <Text style={[TYPOGRAPHY.caption, styles.sectionLabel]}>{t('preferencesLabel')}</Text>
        <Card style={styles.settingCard}>
          <View style={styles.settingText}>
            <Text style={TYPOGRAPHY.headline}>{t('voiceGuidance')}</Text>
            <Text style={TYPOGRAPHY.footnote}>{t('voiceGuidanceDesc')}</Text>
          </View>
          <Switch
            value={voiceGuidance}
            onValueChange={setVoiceGuidance}
            trackColor={{ false: PALETTE.surfaceBorder, true: PALETTE.primary }}
            thumbColor={PALETTE.textPrimary}
            accessibilityLabel={t('voiceGuidance')}
          />
        </Card>

        {/* Bottom CTA section — visually separated from the form */}
        <View style={styles.footer}>
          <Button
            title={t('finishBtn')}
            onPress={handleFinish}
            loading={isSaving}
            disabled={isSaving}
            accessibilityLabel={t('finishBtn')}
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
  headerCard: {
    padding: SPACING.lg,
  },
  headerTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  formCard: {
    padding: SPACING.lg,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  settingText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
});