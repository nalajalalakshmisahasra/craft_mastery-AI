import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { AuthAdapter } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEMO_MODE, isDemoInquiry, inquiryBelongsToUser } from '../../config/demo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';

/** Tone map for the real status values only: PENDING → warning, IN_PROGRESS → primary (active), anything else → neutral. */
function statusTone(status: string): 'warning' | 'primary' | 'neutral' {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'warning';
  if (s === 'IN_PROGRESS') return 'primary';
  return 'neutral';
}

const InquiryRow: React.FC<{ item: any }> = ({ item }) => {
  const { t } = useLanguage();
  const messages = Array.isArray(item.messages) ? item.messages : [];
  const last = messages.length > 0 ? messages[messages.length - 1] : null;
  const preview = last
    ? last.translatedText || last.originalText
    : t('noMessagesYet');

  return (
    <Card style={styles.inquiryCard}>
      <View style={styles.inquiryTop}>
        <Avatar name={item.artisanName || t('artisanLabel')} size={40} />
        <View style={styles.inquiryTitleBlock}>
          <Text style={TYPOGRAPHY.headline} numberOfLines={2}>
            {item.productTitle}
          </Text>
          <Text style={TYPOGRAPHY.footnote} numberOfLines={1}>
            {t('artisanPrefix', { name: item.artisanName || t('artisanLabel') })} · {t('qtyLabel', { count: item.requestedQuantity || 1 })}
          </Text>
        </View>
      </View>

      {preview ? (
        <Text style={[TYPOGRAPHY.footnote, styles.inquiryPreview]} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}

      <View style={styles.inquiryFooter}>
        <Badge tone={statusTone(item.status || '')} label={item.status || 'PENDING'} />
      </View>
    </Card>
  );
};

export const InquiriesScreen: React.FC = () => {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInquiries = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [user, data] = await Promise.all([AuthAdapter.getCurrentUser(), ApiAdapter.getInquiries(refresh)]);
      // Customers see ONLY inquiries they created — never other customers'
      // requests presented as their own.
      const mine = (data || []).filter(
        (i: any) => (DEMO_MODE || !isDemoInquiry(i)) && inquiryBelongsToUser(i, user)
      );
      setInquiries(mine);
    } catch (err: any) {
      console.warn('Inquiries load error:', err);
      setLoadError(`Could not load your inquiries. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const pendingCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'PENDING').length;
  const inProgressCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const isLoadError = !loading && inquiries.length === 0 && Boolean(loadError);
  const isEmpty = !loading && inquiries.length === 0 && !loadError;

  const listHeader = (
    <>
      {/* 1. Page header */}
      <View style={styles.pageHeader}>
        <Badge label={t('inquiriesBadge')} tone="primary" />
        <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('inquiriesTitle')}</Text>
        <Text style={TYPOGRAPHY.body}>{t('inquiriesSub')}</Text>
      </View>

      {/* 2. Summary / status section — counts derived from real data */}
      {!loading && inquiries.length > 0 ? (
        <Card elevated style={styles.summaryCard}>            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={TYPOGRAPHY.caption}>{t('totalInquiries')}</Text>
                <Text style={[TYPOGRAPHY.statNumber, styles.summaryValue]}>{inquiries.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={TYPOGRAPHY.caption}>{t('inProgress')}</Text>
                <Text style={[TYPOGRAPHY.statNumber, styles.summaryValue]}>{inProgressCount}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={TYPOGRAPHY.caption}>{t('pending')}</Text>
                <Text style={[TYPOGRAPHY.statNumber, styles.summaryValue]}>{pendingCount}</Text>
              </View>
            </View>
        </Card>
      ) : null}

      {/* Section marker for the feed */}
      {!loading && inquiries.length > 0 ? (
        <SectionHeader title={t('requestsSection')} subtitle={t('requestsSubtitle', { count: inquiries.length })} />
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((key) => (
            <Card key={key} style={styles.inquiryCard}>
              <View style={styles.inquiryTop}>
                <Skeleton width={40} height={40} radius={RADIUS.full} />
                <View style={styles.inquiryTitleBlock}>
                  <Skeleton width="82%" height={15} />
                  <Skeleton width="55%" height={12} style={styles.skeletonGap} />
                </View>
              </View>
              <Skeleton width="100%" height={12} style={styles.skeletonGap} />
              <Skeleton width="34%" height={12} style={styles.skeletonGap} />
            </Card>
          ))}
        </View>
      );
    }

    if (isLoadError && loadError) {
      return (
        <ErrorState
          title={t('inquiriesErrorTitle')}
          message={loadError}
          retryLabel={t('retryBtn')}
          onRetry={loadInquiries}
        />
      );
    }

    return (
      <EmptyState
        icon={<Ionicons name="chatbox-ellipses-outline" size={28} color={PALETTE.primaryLight} />}
        title={t('inquiriesEmptyTitle')}
        message={t('inquiriesEmptyMessage')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.list}
        data={inquiries}
        keyExtractor={(item, index) => item.id || `inq-${index}`}
        refreshing={loading}
        onRefresh={() => loadInquiries(true)}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={[styles.listContent, (isEmpty || isLoadError) && styles.listContentCentered]}
        renderItem={({ item }) => <InquiryRow item={item} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  listContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pageHeader: {
    marginBottom: SPACING.xs,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  summaryCard: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
  },
  summaryValue: {
    marginTop: SPACING.xs,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: PALETTE.surfaceBorder,
    marginHorizontal: SPACING.md,
  },
  inquiryCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  inquiryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  inquiryTitleBlock: {
    flex: 1,
    gap: SPACING.xxs,
  },
  inquiryPreview: {
    color: PALETTE.textMuted,
  },
  inquiryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  skeletonList: {
    gap: SPACING.md,
  },
  skeletonGap: {
    marginTop: SPACING.xs,
  },
});