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
import { AuthAdapter, AuthUser } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEMO_MODE, isDemoInquiry, inquiryBelongsToUser, productBelongsToUser } from '../../config/demo';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';

/** One message bubble. Outgoing = artisan, incoming = customer/buyer. */
/** Memoized so typing a reply does not re-render every bubble in the thread. */
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
          {isOutgoing ? t('youArtisan') : message.senderName || t('buyerLabel')}
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

/** Full conversation thread. Falls back to the inquiry's opening message when empty. */
const ConversationThread: React.FC<{ inquiry: any }> = ({ inquiry }) => {
  const listRef = useRef<FlatList>(null);
  const messages = Array.isArray(inquiry.messages) ? inquiry.messages : [];
  const thread: any[] =
    messages.length > 0 ? messages : inquiry.initialMessage ? [{ senderRole: 'CUSTOMER', senderName: inquiry.customerName, originalText: inquiry.initialMessage, translatedText: '' }] : [];

  return (
    <FlatList
      ref={listRef}
      style={styles.thread}
      data={thread}
      keyExtractor={(item, index) => item.id || `msg-${index}`}
      contentContainerStyle={styles.threadContent}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      renderItem={({ item }) => (
        <MessageBubble message={item} isOutgoing={item.senderRole === 'ARTISAN'} />
      )}
    />
  );
};

export const MessagesScreen: React.FC = () => {
  const { t, lang } = useLanguage();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  // The reply composer starts empty — never prefilled with a sample reply.
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);

  const loadInquiries = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [user, data, prods] = await Promise.all([
        AuthAdapter.getCurrentUser(),
        ApiAdapter.getInquiries(refresh),
        ApiAdapter.getProducts(refresh),
      ]);
      setSessionUser(user);

      // The inbox shows ONLY inquiries addressed to the logged-in artisan —
      // never other members' conversations presented as the current user's.
      const ownedProductIds = new Set(
        (prods || []).filter((p: any) => productBelongsToUser(p, user)).map((p: any) => p.id)
      );
      const mine = (data || []).filter(
        (i: any) => (DEMO_MODE || !isDemoInquiry(i)) && inquiryBelongsToUser(i, user, ownedProductIds)
      );
      setInquiries(mine);
      if (mine.length > 0 && !selectedInquiry) {
        setSelectedInquiry(mine[0]);
      }
    } catch (err: any) {
      console.warn('Inquiries load error:', err);
      setLoadError(`Could not load your messages. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;

    setIsSending(true);
    setStatusError(false);
    setStatus(t('translatingStatus'));
    try {
      const updated = await ApiAdapter.replyToInquiry(selectedInquiry.id, {
        senderRole: 'ARTISAN',
        // Replies are attributed to the logged-in artisan (backend falls back
        // to the inquiry's artisan name when the session name is unavailable).
        senderName: sessionUser?.name || selectedInquiry.artisanName || '',
        originalText: replyText,
        originalLang: lang,
      });
      setSelectedInquiry(updated);
      setReplyText('');
      setStatus(t('sentStatus'));
      loadInquiries(true);
    } catch (err: any) {
      setStatus(t('sendError', { message: err.message || String(err) }));
      setStatusError(true);
    } finally {
      setIsSending(false);
    }
  };

  const isError = !loading && inquiries.length === 0 && Boolean(loadError);
  const isInboxEmpty = !loading && inquiries.length === 0 && !loadError;
  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;

  const statusColor = statusError ? PALETTE.error : isSending ? PALETTE.aiAccent : PALETTE.primaryLight;

  /* ── Conversation view (a conversation is open) ────────────────────────── */
  if (selectedInquiry) {
    const inquiry = selectedInquiry;
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Back to inbox */}
          <View style={styles.convoTopBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('backToInbox')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setSelectedInquiry(null)}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={20} color={PALETTE.primaryLight} />
              <Text style={styles.backLabel}>{t('backToInbox')}</Text>
            </Pressable>
          </View>

          {/* Conversation context */}
          <Card style={styles.convoContext}>
            <View style={styles.convoContextRow}>
              <Avatar name={inquiry.customerName || 'Buyer'} size={40} />
              <View style={styles.convoContextText}>
                <Text style={TYPOGRAPHY.headline} numberOfLines={1}>
                  {inquiry.productTitle}
                </Text>
                <Text style={TYPOGRAPHY.footnote} numberOfLines={1}>
                  {inquiry.customerName} ({inquiry.customerLanguage || 'en'}) · {t('qtyLabel', { count: inquiry.requestedQuantity || 1 })}
                </Text>
              </View>
              <Badge
                tone={inquiry.status === 'IN_PROGRESS' ? 'primary' : 'warning'}
                label={inquiry.status || 'PENDING'}
              />
            </View>
          </Card>

          {/* Thread */}
          <ConversationThread inquiry={inquiry} />

          {/* Composer */}
          <View style={styles.composer}>
            {status ? (
              <Text style={[TYPOGRAPHY.footnote, styles.composerStatus, { color: statusColor }]}>
                {status}
              </Text>
            ) : null}
            <View style={styles.composerRow}>
              <TextInput
                accessibilityLabel={t('replyPlaceholder')}
                style={styles.composerInput}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                placeholder={t('replyPlaceholder')}
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

  /* ── Inbox view (no conversation open) ──────────────────────────────────── */
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((key) => (
            <Card key={key} style={styles.inboxRowCard}>
              <View style={styles.inboxRow}>
                <Skeleton width={40} height={40} radius={RADIUS.full} />
                <View style={styles.inboxRowText}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="50%" height={12} style={styles.skeletonSub} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      );
    }

    if (isError && loadError) {
      return (
        <ErrorState
          title={t('messagesErrorTitle')}
          message={loadError}
          retryLabel={t('retryBtn')}
          onRetry={loadInquiries}
        />
      );
    }

    return (
      <EmptyState
        icon={<Ionicons name="chatbubbles-outline" size={28} color={PALETTE.primaryLight} />}
        title={t('inboxEmptyTitle')}
        message={t('inboxEmptyMessage')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 1. Page header */}
        <View style={styles.pageHeader}>
          <Badge label={t('inboxBadge')} tone="primary" />
          <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('messagesTitle')}</Text>
          <Text style={TYPOGRAPHY.body}>{t('messagesSub')}</Text>
        </View>

        {/* 2. Inbox summary */}
        {!loading && inquiries.length > 0 ? (
          <Card elevated style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={TYPOGRAPHY.caption}>{t('conversationsStat')}</Text>
                <Text style={[TYPOGRAPHY.statNumber, styles.summaryValue]}>{inquiries.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={TYPOGRAPHY.caption}>{t('needingReply')}</Text>
                <Text style={[TYPOGRAPHY.statNumber, styles.summaryValue]}>{pendingCount}</Text>
              </View>
            </View>
            <Text style={TYPOGRAPHY.footnote}>{t('autoTranslateNote')}</Text>
          </Card>
        ) : null}

        {/* 3. Conversation list */}
        {!loading && inquiries.length > 0 ? <SectionHeader title={t('conversationsSection')} /> : null}
        <FlatList
          data={inquiries}
          keyExtractor={(item, index) => item.id || `inbox-${index}`}
          contentContainerStyle={[styles.list, (isInboxEmpty || isError) && styles.listGrow]}
          ListEmptyComponent={renderEmpty()}
          renderItem={({ item }) => {
            const messages = Array.isArray(item.messages) ? item.messages : [];
            const last = messages.length > 0 ? messages[messages.length - 1] : null;
            const preview =
              last?.translatedText ||
              last?.originalText ||
              item.initialMessage ||
              t('inquiryPending');
            return (
              <Card
                onPress={() => setSelectedInquiry(item)}
                accessibilityLabel={`Open conversation about ${item.productTitle} from ${item.customerName}`}
                style={styles.inboxRowCard}
              >
                <View style={styles.inboxRow}>
                  <Avatar name={item.customerName || 'Buyer'} size={40} />
                  <View style={styles.inboxRowText}>
                    <Text style={TYPOGRAPHY.headline} numberOfLines={1}>
                      {item.productTitle}
                    </Text>
                    <Text style={TYPOGRAPHY.footnote} numberOfLines={1}>
                      {item.customerName} · {t('qtyLabel', { count: item.requestedQuantity || 1 })}
                    </Text>
                    <Text style={[TYPOGRAPHY.footnote, styles.inboxPreview]} numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={PALETTE.textMuted} />
                </View>
              </Card>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  pageHeader: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  summaryCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
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
    marginHorizontal: SPACING.lg,
  },
  list: {
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  listGrow: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inboxRowCard: {
    padding: SPACING.md,
  },
  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  inboxRowText: {
    flex: 1,
    gap: SPACING.xxs,
  },
  inboxPreview: {
    color: PALETTE.textMuted,
  },
  skeletonList: {
    gap: SPACING.sm,
  },
  skeletonSub: {
    marginTop: SPACING.xs,
  },
  convoTopBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: TOUCH_TARGET.minHeight,
  },
  backLabel: {
    color: PALETTE.primaryLight,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  convoContext: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  convoContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  convoContextText: {
    flex: 1,
    gap: SPACING.xxs,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  bubbleRow: {
    width: '100%',
  },
  bubbleRowIncoming: {
    alignItems: 'flex-start',
  },
  bubbleRowOutgoing: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xxs,
  },
  bubbleIncoming: {
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
  },
  bubbleOutgoing: {
    backgroundColor: PALETTE.primaryMuted,
    borderColor: PALETTE.primary,
    borderWidth: 1,
  },
  bubbleSender: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: PALETTE.textMuted,
  },
  bubbleText: {
    color: PALETTE.textPrimary,
  },
  bubbleOriginal: {
    color: PALETTE.textMuted,
  },
  composer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
    backgroundColor: PALETTE.background,
    gap: SPACING.xs,
  },
  composerStatus: {
    color: PALETTE.primaryLight,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  composerInput: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    maxHeight: 110,
    backgroundColor: PALETTE.inputBg,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: PALETTE.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  composerButton: {
    minWidth: 84,
    paddingHorizontal: SPACING.md,
  },
});