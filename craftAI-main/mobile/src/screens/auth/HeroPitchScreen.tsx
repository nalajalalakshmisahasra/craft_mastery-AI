import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from './WelcomeLanguageScreen';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StorageAdapter } from '../../adapters/storage';
import { BRAND_ASSETS } from '../../config/assets';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<AuthStackParamList, 'HeroPitch'>;

const TOTAL_SLIDES = 5;

export const HeroPitchScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  // Handle momentum scroll end for native horizontal swipe tracking
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / windowWidth);
    if (page >= 0 && page < TOTAL_SLIDES && page !== activeSlide) {
      setActiveSlide(page);
    }
  };

  const goToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < TOTAL_SLIDES) {
      setActiveSlide(slideIndex);
      scrollRef.current?.scrollTo({
        x: slideIndex * windowWidth,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (activeSlide < TOTAL_SLIDES - 1) {
      goToSlide(activeSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (activeSlide > 0) {
      goToSlide(activeSlide - 1);
    }
  };

  const handleSkip = () => {
    // Jump to the FAQ & Get Started screen so users can quickly finish
    goToSlide(TOTAL_SLIDES - 1);
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      // Persist the first-launch flag so returning users proceed straight to login/onboarding
      await StorageAdapter.setHasSeenHero(true);
    } catch (err) {
      console.warn('[HeroPitchScreen] Failed to set hasSeenHero flag:', err);
    } finally {
      // Navigate to the existing WelcomeLanguage screen
      navigation.replace('WelcomeLanguage');
    }
  };

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  // ── Render Header Controls ──────────────────────────────────────────
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        {/* Back navigation button if not on the first slide */}
        <View style={styles.headerSideSlot}>
          {activeSlide > 0 ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={t('pitchBack')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={20} color={PALETTE.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>

        {/* Five Progress Dots / Pill Indicators */}
        <View style={styles.indicatorContainer} accessibilityRole="progressbar">
          {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => {
            const isCurrent = idx === activeSlide;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => goToSlide(idx)}
                accessibilityLabel={t('pitchStepIndicator', {
                  current: idx + 1,
                  total: TOTAL_SLIDES,
                })}
                style={[
                  styles.dot,
                  isCurrent ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>

        {/* Skip button on slides 0 to 3 */}
        <View style={styles.headerSideSlot}>
          {activeSlide < TOTAL_SLIDES - 1 ? (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={t('pitchSkip')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[TYPOGRAPHY.caption, styles.skipText]}>{t('pitchSkip')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>
      </View>
    );
  };

  // ── Slide 1: Hero ───────────────────────────────────────────────────
  const renderSlide1Hero = () => {
    return (
      <View style={[styles.slideOuter, { width: windowWidth }]}>
        <ScrollView
          style={styles.slideScroll}
          contentContainerStyle={styles.slideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Official Emblem Logo container */}
          <View style={styles.logoFrame}>
            <Image
              source={BRAND_ASSETS.logo}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Craft Mastery Official Logo"
            />
          </View>

          {/* Eyebrow badge */}
          <View style={styles.eyebrowBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.eyebrowText]}>
              {t('pitchHeroEyebrow')}
            </Text>
          </View>

          {/* Hero Headlines */}
          <Text style={[TYPOGRAPHY.displayHero, styles.heroHeadline]}>
            {t('pitchHeroHeadline1')}
            {'\n'}
            <Text style={styles.heroAccent}>{t('pitchHeroHeadline2')}</Text>
          </Text>

          {/* Artisanal Terracotta Divider */}
          <View style={styles.heroRule} />

          {/* Supporting Copy */}
          <Text style={[TYPOGRAPHY.body, styles.heroSupportText]}>
            {t('pitchHeroSupport')}
          </Text>

          {/* Emotional connection card */}
          <Card style={styles.heritageCard}>
            <View style={styles.heritageIconRow}>
              <Ionicons name="sparkles" size={18} color={PALETTE.primary} />
              <Text style={[TYPOGRAPHY.callout, styles.heritageCardTitle]}>
                Heritage Meets Digital Connection
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.caption, styles.heritageCardBody]}>
              Bridging centuries of authentic craft with customers who cherish original art.
            </Text>
          </Card>
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footerContainer}>
          <Button
            title={t('pitchHeroCta')}
            onPress={handleNext}
            accessibilityLabel={t('pitchHeroCta')}
            icon={<Ionicons name="arrow-forward" size={18} color={PALETTE.background} />}
          />
        </View>
      </View>
    );
  };

  // ── Slide 2: Why Craft Mastery? ────────────────────────────────────
  const renderSlide2Why = () => {
    return (
      <View style={[styles.slideOuter, { width: windowWidth }]}>
        <ScrollView
          style={styles.slideScroll}
          contentContainerStyle={styles.slideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eyebrowBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.eyebrowText]}>
              {t('pitchWhyEyebrow')}
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.display, styles.slideTitle]}>
            {t('pitchWhyHeadline')}
          </Text>

          <Text style={[TYPOGRAPHY.body, styles.slideLead]}>
            {t('pitchWhyLead')}
          </Text>

          {/* Three Focused Mission Pillar Cards */}
          <View style={styles.cardsStack}>
            <Card style={styles.whyCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="globe-outline" size={20} color={PALETTE.primaryLight} />
                </View>
                <Text style={[TYPOGRAPHY.title2, styles.whyCardTitle]}>
                  {t('pitchWhyPoint1Title')}
                </Text>
              </View>
              <Text style={[TYPOGRAPHY.callout, styles.whyCardBody]}>
                {t('pitchWhyPoint1Body')}
              </Text>
            </Card>

            <Card style={styles.whyCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="people-outline" size={20} color={PALETTE.primaryLight} />
                </View>
                <Text style={[TYPOGRAPHY.title2, styles.whyCardTitle]}>
                  {t('pitchWhyPoint2Title')}
                </Text>
              </View>
              <Text style={[TYPOGRAPHY.callout, styles.whyCardBody]}>
                {t('pitchWhyPoint2Body')}
              </Text>
            </Card>

            <Card style={styles.whyCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="sparkles-outline" size={20} color={PALETTE.primaryLight} />
                </View>
                <Text style={[TYPOGRAPHY.title2, styles.whyCardTitle]}>
                  {t('pitchWhyPoint3Title')}
                </Text>
              </View>
              <Text style={[TYPOGRAPHY.callout, styles.whyCardBody]}>
                {t('pitchWhyPoint3Body')}
              </Text>
            </Card>
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <Button
            title={t('pitchWhyCta')}
            onPress={handleNext}
            accessibilityLabel={t('pitchWhyCta')}
            icon={<Ionicons name="arrow-forward" size={18} color={PALETTE.background} />}
          />
        </View>
      </View>
    );
  };

  // ── Slide 3: How It Works ──────────────────────────────────────────
  const renderSlide3How = () => {
    return (
      <View style={[styles.slideOuter, { width: windowWidth }]}>
        <ScrollView
          style={styles.slideScroll}
          contentContainerStyle={styles.slideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eyebrowBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.eyebrowText]}>
              {t('pitchHowEyebrow')}
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.display, styles.slideTitle]}>
            {t('pitchHowHeadline')}
          </Text>

          {/* Sequence Breadcrumb */}
          <View style={styles.sequenceBanner}>
            <Text style={[TYPOGRAPHY.caption, styles.sequenceText]}>
              {t('pitchHowSequence')}
            </Text>
          </View>

          {/* Four Stepped Cards */}
          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Ionicons name="mic-outline" size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[TYPOGRAPHY.headline, styles.stepTitle]}>
                  {t('pitchStep1Title')}
                </Text>
                <Text style={[TYPOGRAPHY.callout, styles.stepBody]}>
                  {t('pitchStep1Body')}
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Ionicons name="language-outline" size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[TYPOGRAPHY.headline, styles.stepTitle]}>
                  {t('pitchStep2Title')}
                </Text>
                <Text style={[TYPOGRAPHY.callout, styles.stepBody]}>
                  {t('pitchStep2Body')}
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[TYPOGRAPHY.headline, styles.stepTitle]}>
                  {t('pitchStep3Title')}
                </Text>
                <Text style={[TYPOGRAPHY.callout, styles.stepBody]}>
                  {t('pitchStep3Body')}
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Ionicons name="heart-outline" size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[TYPOGRAPHY.headline, styles.stepTitle]}>
                  {t('pitchStep4Title')}
                </Text>
                <Text style={[TYPOGRAPHY.callout, styles.stepBody]}>
                  {t('pitchStep4Body')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <Button
            title={t('pitchHowCta')}
            onPress={handleNext}
            accessibilityLabel={t('pitchHowCta')}
            icon={<Ionicons name="arrow-forward" size={18} color={PALETTE.background} />}
          />
        </View>
      </View>
    );
  };

  // ── Slide 4: Impact ────────────────────────────────────────────────
  const renderSlide4Impact = () => {
    return (
      <View style={[styles.slideOuter, { width: windowWidth }]}>
        <ScrollView
          style={styles.slideScroll}
          contentContainerStyle={styles.slideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eyebrowBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.eyebrowText]}>
              {t('pitchImpactEyebrow')}
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.display, styles.slideTitle]}>
            {t('pitchImpactHeadline')}
          </Text>

          <Text style={[TYPOGRAPHY.body, styles.slideLead]}>
            {t('pitchImpactLead')}
          </Text>

          {/* Four Impact Pillars Grid */}
          <View style={styles.impactGrid}>
            <Card style={styles.impactCard}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="ribbon-outline" size={22} color={PALETTE.primaryLight} />
              </View>
              <Text style={[TYPOGRAPHY.headline, styles.impactCardTitle]}>
                {t('pitchPillar1Title')}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.impactCardBody]}>
                {t('pitchPillar1Body')}
              </Text>
            </Card>

            <Card style={styles.impactCard}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="library-outline" size={22} color={PALETTE.primaryLight} />
              </View>
              <Text style={[TYPOGRAPHY.headline, styles.impactCardTitle]}>
                {t('pitchPillar2Title')}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.impactCardBody]}>
                {t('pitchPillar2Body')}
              </Text>
            </Card>

            <Card style={styles.impactCard}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="git-network-outline" size={22} color={PALETTE.primaryLight} />
              </View>
              <Text style={[TYPOGRAPHY.headline, styles.impactCardTitle]}>
                {t('pitchPillar3Title')}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.impactCardBody]}>
                {t('pitchPillar3Body')}
              </Text>
            </Card>

            <Card style={styles.impactCard}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="cube-outline" size={22} color={PALETTE.primaryLight} />
              </View>
              <Text style={[TYPOGRAPHY.headline, styles.impactCardTitle]}>
                {t('pitchPillar4Title')}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.impactCardBody]}>
                {t('pitchPillar4Body')}
              </Text>
            </Card>
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <Button
            title={t('pitchImpactCta')}
            onPress={handleNext}
            accessibilityLabel={t('pitchImpactCta')}
            icon={<Ionicons name="arrow-forward" size={18} color={PALETTE.background} />}
          />
        </View>
      </View>
    );
  };

  // ── Slide 5: FAQ & Get Started ─────────────────────────────────────
  const renderSlide5Faq = () => {
    const faqs = [
      { q: t('pitchFaqQ1'), a: t('pitchFaqA1') },
      { q: t('pitchFaqQ2'), a: t('pitchFaqA2') },
      { q: t('pitchFaqQ3'), a: t('pitchFaqA3') },
      { q: t('pitchFaqQ4'), a: t('pitchFaqA4') },
      { q: t('pitchFaqQ5'), a: t('pitchFaqA5') },
    ];

    return (
      <View style={[styles.slideOuter, { width: windowWidth }]}>
        <ScrollView
          style={styles.slideScroll}
          contentContainerStyle={styles.slideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eyebrowBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.eyebrowText]}>
              {t('pitchFaqEyebrow')}
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.display, styles.slideTitle]}>
            {t('pitchFaqHeadline')}
          </Text>

          <Text style={[TYPOGRAPHY.body, styles.slideLead]}>
            {t('pitchFaqLead')}
          </Text>

          {/* 5 Expandable Native Accordion Items */}
          <View style={styles.faqList}>
            {faqs.map((item, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    onPress={() => toggleFaq(idx)}
                    style={styles.faqHeader}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    accessibilityLabel={item.q}
                  >
                    <Text style={[TYPOGRAPHY.headline, styles.faqQuestion]}>
                      {item.q}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isExpanded ? PALETTE.primary : PALETTE.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <View style={styles.faqDivider} />
                      <Text style={[TYPOGRAPHY.callout, styles.faqAnswer]}>
                        {item.a}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Final Completion CTA: Get Started */}
        <View style={styles.footerContainer}>
          <Button
            title={t('pitchGetStarted')}
            onPress={handleComplete}
            loading={isCompleting}
            accessibilityLabel={t('pitchGetStarted')}
            icon={<Ionicons name="sparkles" size={18} color={PALETTE.background} />}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {renderHeader()}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {renderSlide1Hero()}
        {renderSlide2Why()}
        {renderSlide3How()}
        {renderSlide4Impact()}
        {renderSlide5Faq()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.surfaceBorder,
    backgroundColor: PALETTE.background,
  },
  headerSideSlot: {
    width: 60,
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 60,
  },
  headerButton: {
    minHeight: TOUCH_TARGET.minHeight,
    justifyContent: 'center',
  },
  skipText: {
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
    backgroundColor: PALETTE.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: PALETTE.surfaceBorder,
  },
  pager: {
    flex: 1,
  },
  slideOuter: {
    flex: 1,
    justifyContent: 'space-between',
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  logoFrame: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: RADIUS.xl,
    backgroundColor: '#FFFFFF',
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: PALETTE.surfaceBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  eyebrowText: {
    color: PALETTE.primaryLight,
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeadline: {
    lineHeight: 38,
  },
  heroAccent: {
    color: PALETTE.primary,
  },
  heroRule: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: PALETTE.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroSupportText: {
    color: PALETTE.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  heritageCard: {
    marginTop: SPACING.sm,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
  },
  heritageIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  heritageCardTitle: {
    color: PALETTE.textPrimary,
    fontWeight: '600',
  },
  heritageCardBody: {
    color: PALETTE.textMuted,
    lineHeight: 18,
  },
  slideTitle: {
    color: PALETTE.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  slideLead: {
    color: PALETTE.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  cardsStack: {
    gap: SPACING.md,
  },
  whyCard: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
  },
  whyCardTitle: {
    color: PALETTE.textPrimary,
    flex: 1,
    fontSize: 17,
  },
  whyCardBody: {
    color: PALETTE.textMuted,
    lineHeight: 20,
    marginTop: 2,
  },
  sequenceBanner: {
    backgroundColor: PALETTE.surfaceElevated,
    borderColor: PALETTE.primaryDark,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sequenceText: {
    color: PALETTE.primaryLight,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    color: PALETTE.textPrimary,
    marginBottom: SPACING.xs - 2,
  },
  stepBody: {
    color: PALETTE.textSecondary,
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 18,
    backgroundColor: PALETTE.surfaceBorder,
    marginLeft: 17,
    marginVertical: 4,
  },
  impactGrid: {
    gap: SPACING.md,
  },
  impactCard: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  impactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
  },
  impactCardTitle: {
    color: PALETTE.textPrimary,
    marginBottom: SPACING.xs,
  },
  impactCardBody: {
    color: PALETTE.textSecondary,
    lineHeight: 19,
  },
  faqList: {
    gap: SPACING.md,
  },
  faqCard: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: TOUCH_TARGET.minHeight,
  },
  faqQuestion: {
    color: PALETTE.textPrimary,
    flex: 1,
    paddingRight: SPACING.md,
    fontSize: 15,
  },
  faqBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  faqDivider: {
    height: 1,
    backgroundColor: PALETTE.surfaceBorder,
    marginBottom: SPACING.sm,
  },
  faqAnswer: {
    color: PALETTE.textSecondary,
    lineHeight: 22,
  },
  footerContainer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
    backgroundColor: PALETTE.background,
  },
});
