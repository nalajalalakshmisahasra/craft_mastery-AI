import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { AuthAdapter, type AuthUser } from '../../adapters/auth';
import { DEMO_MODE, isDemoInquiry, inquiryBelongsToUser } from '../../config/demo';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';

/** Tone map for the real status values: PENDING → warning, IN_PROGRESS → primary, anything else → neutral. */
function statusTone(status: string): 'warning' | 'primary' | 'neutral' {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'warning';
  if (s === 'IN_PROGRESS') return 'primary';
  return 'neutral';
}

const MessageBubble = React.memo(({ message, isOutgoing }: { message: any; isOutgoing: boolean }) => {
  const { t } = useLanguage();
  const original = message.originalText || '';
  const translated = message.translatedText || '';
  const displayText = translated || original;
  const hasTranslation = Boolean(translated) && translated !== original;

  return (
    <View style={[styles.bubbleRow, isOutgoing ? styles.bubbleRowOutgoing : styles.bubbleRowIncoming]}>
      <View style={[styles.bubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
        <Text style={styles.bubbleSender} numberOfLines={1}>
          {isOutgoing ? t('buyerYou') : message.senderName || t('artisanLabel')}
        </Text>
        <Text style={[TYPOGRAPHY.body, styles.bubbleText]}>{displayText}</Text>
        {hasTranslation ? (
          <Text style={[TYPOGRAPHY.footnote, styles.bubbleOriginal]} numberOfLines={3}>
            {t('originalPrefix', { text: original })}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const InquiryRow: React.FC<{ item: any; onPress: () => void }> = ({ item, onPress }) => {
  const { t } = useLanguage();
  const messages = Array.isArray(item.messages) ? item.messages : [];
  const last = messages.length > 0 ? messages[messages.length - 1] : null;
  const preview = last
    ? last.translatedText || last.originalText
    : t('noMessagesYet');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.productTitle}, ${item.artisanName || t('artisanLabel')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.inquiryCardWrap, pressed && styles.inquiryCardPressed]}
    >
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
          <View style={styles.viewConvoAction}>
            <Text style={styles.viewConvoLabel}>{t('viewDetailsBtn')}</Text>
            <Ionicons name="chevron-forward" size={14} color={PALETTE.primaryLight} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

export const InquiriesScreen: React.FC<{ route?: { params?: { inquiryId?: string } } }> = ({
  route,
}) => {
  const { t, lang } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Conversation View State ──────────────────────────────────────
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadInquiries = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [user, data] = await Promise.all([AuthAdapter.getCurrentUser(), ApiAdapter.getInquiries(refresh)]);
      setSessionUser(user);
      // Customers see ONLY inquiries they created
      const mine = (data || []).filter(
        (i: any) => (DEMO_MODE || !isDemoInquiry(i)) && inquiryBelongsToUser(i, user)
      );
      setInquiries(mine);

      // Auto-select if route.params.inquiryId is set
      const paramId = route?.params?.inquiryId;
      if (paramId) {
        const found = mine.find((x: any) => x.id === paramId);
        if (found) {
          setSelectedInquiry(found);
        }
      }
    } catch (err: any) {
      console.warn('Inquiries load error:', err);
      setLoadError(`Could not load your inquiries. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [route?.params?.inquiryId]);

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;

    setIsSending(true);
    setStatusError(false);
    setStatus(t('translatingStatus'));
    try {
      const updated = await ApiAdapter.replyToInquiry(selectedInquiry.id, {
        senderRole: 'CUSTOMER',
        senderName: sessionUser?.name || selectedInquiry.customerName || 'Customer',
        originalText: replyText.trim(),
        originalLang: lang,
      });
      setSelectedInquiry(updated);
      setReplyText('');
      setStatus(t('sentStatus'));
      loadInquiries(true);
    } catch (err: any) {
      console.warn('Send reply error:', err);
      setStatus(t('sendError', { message: err.message || String(err) }));
      setStatusError(true);
    } finally {
      setIsSending(false);
    }
  };

  const pendingCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'PENDING').length;
  const inProgressCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const isLoadError = !loading && inquiries.length === 0 && Boolean(loadError);
  const isEmpty = !loading && inquiries.length === 0 && !loadError;

  /* ── Conversation View (when an inquiry is opened) ────────────────── */
  if (selectedInquiry) {
    const messages = Array.isArray(selectedInquiry.messages) ? selectedInquiry.messages : [];
    const statusColor = statusError ? PALETTE.error : PALETTE.primaryLight;

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('backToInquiries')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setSelectedInquiry(null)}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color={PALETTE.primaryLight} />
              <Text style={styles.backLabel}>{t('backToInquiries')}</Text>
            </Pressable>

            <Badge
              tone={statusTone(selectedInquiry.status || '')}
              label={selectedInquiry.status || 'PENDING'}
            />
          </View>

          {/* Product context strip */}
          <View style={styles.productStrip}>
            <Avatar name={selectedInquiry.artisanName || t('artisanLabel')} size={36} />
            <View style={styles.productStripText}>
              <Text style={TYPOGRAPHY.headline} numberOfLines={1}>
                {selectedInquiry.productTitle}
              </Text>
              <Text style={TYPOGRAPHY.caption} numberOfLines={1}>
                {t('artisanPrefix', { name: selectedInquiry.artisanName || t('artisanLabel') })} · {t('qtyLabel', { count: selectedInquiry.requestedQuantity || 1 })}
              </Text>
            </View>
          </View>

          {/* Messages Thread */}
          <FlatList
            ref={listRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            data={messages}
            keyExtractor={(m, idx) => m.id || `msg-${idx}`}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isOutgoing = (item.senderRole || '').toUpperCase() === 'CUSTOMER' || (item.senderRole || '').toUpperCase() !== 'ARTISAN';
              return <MessageBubble message={item} isOutgoing={isOutgoing} />;
            }}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="chatbubble-outline" size={24} color={PALETTE.primaryLight} />}
                title={t('noMessagesYet')}
                message={t('autoTranslateNote')}
              />
            }
          />

          {/* Composer */}
          <View style={styles.composer}>
            {status ? (
              <Text style={[TYPOGRAPHY.footnote, styles.composerStatus, { color: statusColor }]}>
                {status}
              </Text>
            ) : null}
            <View style={styles.composerRow}>
              <TextInput
                accessibilityLabel={t('replyToArtisanPlaceholder')}
                style={styles.composerInput}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                placeholder={t('replyToArtisanPlaceholder')}
                placeholderTextColor={PALETTE.textMuted}
              />
              <Button
                title={isSending ? '' : t('sendBtn')}
                onPress={handleSendReply}
                loading={isSending}
                disabled={isSending || !replyText.trim()}
                accessibilityLabel={t('sendBtn')}
                style={styles.composerButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* ── Inquiries List View ────────────────────────────────────────── */
  const listHeader = (
    <>
      {/* 1. Page header */}
      <View style={styles.pageHeader}>
        <Badge label={t('inquiriesBadge')} tone="primary" />
        <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('inquiriesTitle')}</Text>
        <Text style={TYPOGRAPHY.body}>{t('inquiriesSub')}</Text>
      </View>

      {/* 2. Summary / status section */}
      {!loading && inquiries.length > 0 ? (
        <Card elevated style={styles.summaryCard}>
          <View style={styles.summaryRow}>
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

      {/* Section marker */}
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
        renderItem={({ item }) => (
          <InquiryRow item={item} onPress={() => setSelectedInquiry(item)} />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  container: {
    flex: 1,
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
  inquiryCardWrap: {
    borderRadius: RADIUS.lg,
  },
  inquiryCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
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
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  viewConvoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  viewConvoLabel: {
    ...TYPOGRAPHY.caption,
    color: PALETTE.primaryLight,
    fontWeight: '600',
  },
  skeletonList: {
    gap: SPACING.md,
  },
  skeletonGap: {
    marginTop: SPACING.xs,
  },
  // ── Conversation view styles ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.surfaceBorder,
    backgroundColor: PALETTE.surface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    minHeight: TOUCH_TARGET.minHeight,
    paddingVertical: SPACING.xs,
  },
  backLabel: {
    ...TYPOGRAPHY.body,
    color: PALETTE.primaryLight,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  productStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: PALETTE.surface,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.surfaceBorder,
  },
  productStripText: {
    flex: 1,
    gap: 2,
  },
  messagesList: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleRowOutgoing: {
    justifyContent: 'flex-end',
  },
  bubbleRowIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xxs,
  },
  bubbleOutgoing: {
    backgroundColor: PALETTE.primaryMuted,
    borderBottomRightRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  bubbleIncoming: {
    backgroundColor: PALETTE.surface,
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
  },
  bubbleSender: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: PALETTE.textMuted,
  },
  bubbleText: {
    color: PALETTE.textPrimary,
    lineHeight: 20,
  },
  bubbleOriginal: {
    fontStyle: 'italic',
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  composer: {
    padding: SPACING.sm,
    backgroundColor: PALETTE.surface,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
    gap: SPACING.xs,
  },
  composerStatus: {
    paddingHorizontal: SPACING.xs,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    color: PALETTE.textPrimary,
    fontSize: 14,
  },
  composerButton: {
    minHeight: 44,
    minWidth: 70,
  },
});
