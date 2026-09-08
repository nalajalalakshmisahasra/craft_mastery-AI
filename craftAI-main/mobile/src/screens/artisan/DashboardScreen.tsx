import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { AuthAdapter } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEMO_MODE, isDemoInquiry, isDemoProduct, productBelongsToUser, inquiryBelongsToUser } from '../../config/demo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';

interface Props {
  navigation: any;
  onLogout?: () => void;
  onSwitchRole?: (role: 'CUSTOMER') => void;
}

interface HealthState {
  connected: boolean;
  geminiActive: boolean;
  service?: string;
  error?: string;
}

export const DashboardScreen: React.FC<Props> = ({ navigation, onLogout, onSwitchRole }) => {
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthState | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Independent requests run in parallel (Promise.allSettled) so the shell
    // renders as soon as any data arrives instead of waiting on 4 chained
    // round-trips. Each result is rendered independently; failures surface
    // via the health note rather than hiding behind a single try/catch.
    const checkApiAndLoad = async () => {
      const [userRes, healthRes, prodsRes, inqsRes] = await Promise.allSettled([
        AuthAdapter.getCurrentUser(),
        ApiAdapter.checkHealth(),
        ApiAdapter.getProducts(),
        ApiAdapter.getInquiries(),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value) {
        setUserName(userRes.value.name);
      }

      if (healthRes.status === 'fulfilled') {
        const h = healthRes.value;
        setHealth({ connected: true, geminiActive: h.hasGeminiKey, service: h.service });
      } else {
        const reason: any = healthRes.reason;
        setHealth({ connected: false, geminiActive: false, error: reason?.message || String(reason) });
      }

      // Counts reflect ONLY the logged-in artisan's own records — never other
      // seed/demo members' products or inquiries.
      const user = userRes.status === 'fulfilled' ? userRes.value : null;
      const allProducts = prodsRes.status === 'fulfilled' ? prodsRes.value : [];
      const visibleProducts = allProducts.filter(
        (p: any) => (DEMO_MODE || !isDemoProduct(p)) && productBelongsToUser(p, user)
      );
      setProductsCount(visibleProducts.length);

      const ownedProductIds = new Set(visibleProducts.map((p: any) => p.id));
      const allInquiries = inqsRes.status === 'fulfilled' ? inqsRes.value : [];
      const visibleInquiries = allInquiries.filter(
        (i: any) => (DEMO_MODE || !isDemoInquiry(i)) && inquiryBelongsToUser(i, user, ownedProductIds)
      );
      setInquiriesCount(visibleInquiries.length);
      setLoaded(true);
    };
    checkApiAndLoad();
  }, []);

  const healthText = !health
    ? t('healthPinging')
    : health.connected
      ? health.geminiActive
        ? t('healthConnected', { service: health.service || '' })
        : t('healthNoKey', { service: health.service || '' })
      : t('healthNote', { message: health.error || '' });

  let aiBadgeLabel: string | null = null;
  let aiBadgeTone: 'ai' | 'neutral' = 'neutral';
  if (health?.connected && health.geminiActive) {
    aiBadgeLabel = t('aiActive');
    aiBadgeTone = 'ai';
  } else if (health?.connected) {
    aiBadgeLabel = t('aiOffline');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* 1. Identity section */}
        <View style={styles.identityRow}>
          <View style={styles.identityText}>
            <Badge label={t('workshopBadge')} tone="primary" />
            <Text style={[TYPOGRAPHY.title1, styles.greeting]}>{t('greeting', { name: userName || t('roleArtisan') })}</Text>
            <Text style={TYPOGRAPHY.footnote}>{t('workshopSubtitle')}</Text>
          </View>
          <Avatar name={userName} size={48} />
        </View>

        {/* 2. Hero / primary action section */}
        <Card elevated style={styles.heroCard}>
          <Text style={TYPOGRAPHY.display}>
            {`${t('heroLine1')}\n`}
            <Text style={styles.heroAccent}>{t('heroLine2')}</Text>
          </Text>
          <View style={styles.heroRule} />
          <Text style={TYPOGRAPHY.body}>{t('heroSupport2')}</Text>
          <Button
            title={t('addCraftBtn')}
            onPress={() => navigation.navigate('UploadWizard')}
            style={styles.heroButton}
            accessibilityLabel={t('addCraftBtn')}
          />
          {aiBadgeLabel ? (
            <View style={styles.aiRow}>
              <Badge tone={aiBadgeTone} label={aiBadgeLabel} />
            </View>
          ) : null}
        </Card>

        {/* 3. Business snapshot section */}
        <SectionHeader title={t('snapshotTitle')} />
        <View style={styles.statsRow}>
          <StatCard label={t('statListings')} value={productsCount ?? undefined} loading={!loaded} />
          <StatCard label={t('statInquiries')} value={inquiriesCount ?? undefined} loading={!loaded} />
        </View>
        {health ? (
          <Text
            style={[
              TYPOGRAPHY.footnote,
              styles.statusNote,
              !health.connected && styles.statusError,
            ]}
          >
            {healthText}
          </Text>
        ) : (
          <Text style={[TYPOGRAPHY.footnote, styles.statusNote]}>{healthText}</Text>
        )}

        {/* 4. Catalog / products section */}
        <SectionHeader
          title={t('catalogSection')}
          subtitle={loaded ? t('catalogSubtitle', { count: productsCount ?? 0 }) : t('catalogLoading')}
        />
        <Card
          onPress={() => navigation.navigate('Catalog')}
          accessibilityLabel="Open your catalog"
          style={styles.navCard}
        >
          <Text style={TYPOGRAPHY.body}>
            {loaded && productsCount === 0 ? t('catalogEmpty') : t('catalogBody')}
          </Text>
          <View style={styles.navCardFooter}>
            <Text style={styles.navLink}>{t('openCatalog')}</Text>
            <Text style={styles.chevron}>→</Text>
          </View>
        </Card>

        {/* 5. Inquiries / customer activity section */}
        <SectionHeader
          title={t('inquiriesSection')}
          subtitle={loaded ? t('inquiriesSubtitle', { count: inquiriesCount ?? 0 }) : t('inquiriesLoading')}
        />
        <Card
          onPress={() => navigation.navigate('Messages')}
          accessibilityLabel="Open translated inquiries"
          style={styles.navCard}
        >
          <Text style={TYPOGRAPHY.body}>
            {loaded && inquiriesCount === 0 ? t('inquiriesEmpty') : t('inquiriesBody')}
          </Text>
          <View style={styles.navCardFooter}>
            <Text style={styles.navLink}>{t('viewInquiries')}</Text>
            <Text style={styles.chevron}>→</Text>
          </View>
        </Card>

        {/* 7. Bottom action / navigation section */}
        <View style={styles.footer}>
          {onSwitchRole ? (
            <Button
              variant="secondary"
              title={t('switchBuyer')}
              onPress={() => onSwitchRole('CUSTOMER')}
              accessibilityLabel={t('switchBuyer')}
            />
          ) : null}
          {onLogout ? (
            <Button
              variant="destructive"
              title={t('signOut')}
              onPress={onLogout}
              accessibilityLabel={t('signOut')}
            />
          ) : null}
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    marginTop: SPACING.sm,
  },
  heroCard: {
    marginTop: SPACING.lg,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  heroAccent: {
    color: PALETTE.primary,
  },
  heroRule: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: PALETTE.primary,
  },
  heroButton: {
    marginTop: SPACING.sm,
  },
  aiRow: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  statusNote: {
    marginTop: SPACING.sm,
    color: PALETTE.textMuted,
  },
  statusError: {
    color: PALETTE.error,
  },
  navCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  navCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  navLink: {
    color: PALETTE.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    color: PALETTE.textMuted,
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
    gap: SPACING.sm,
  },
});