import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { SpeechAdapter } from '../../adapters/speech';
import { useLanguage } from '../../i18n/LanguageContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Avatar } from '../../components/ui/Avatar';

interface Props {
  route: {
    params: {
      product: any;
    };
  };
  navigation: any;
}

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { product } = route.params;
  const { t, lang } = useLanguage();

  // ── Image State ──────────────────────────────────────────────────
  const [imageFailed, setImageFailed] = useState(false);
  const imageUri = product?.enhancedImageUrl || product?.originalImageUrl;
  const price = product?.finalPrice ?? product?.recommendedPrice ?? '—';
  const stock = product?.stockQuantity ?? 1;

  // ── AI Order Guidance State ──────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Send Inquiry Modal State ─────────────────────────────────────
  const [isInquiryModalVisible, setIsInquiryModalVisible] = useState(false);
  const [inquiryQuantity, setInquiryQuantity] = useState<number>(100);
  const [inquiryNote, setInquiryNote] = useState<string>(t('inquiryDefaultNote'));
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);

  // ── AI Guidance Handler ──────────────────────────────────────────
  const handleAskAi = async (questionText: string) => {
    if (!questionText.trim()) return;
    setAiLoading(true);
    setAiGuidance(null);
    setSuggestedAction(null);

    try {
      const res = await ApiAdapter.getOrderGuidance(questionText, product, lang);
      const answer = res?.guidance || res?.answer || res?.text || '';
      setAiGuidance(answer);
      if (res?.suggestedAction) {
        setSuggestedAction(res.suggestedAction);
      }
    } catch (err: any) {
      console.warn('AI guidance error:', err);
      setAiGuidance(
        lang === 'te'
          ? 'మీరు ఈ కళాకృతి కోసం నేరుగా విచారణ పంపవచ్చు. కళాకారుడు బల్క్ ఆర్డర్లకు ప్రత్యేక ధర అందిస్తారు.'
          : 'You can order this craft directly or contact the artisan for bulk wholesale pricing.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleSpeech = async () => {
    if (!aiGuidance) return;
    if (isSpeaking) {
      await SpeechAdapter.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await SpeechAdapter.speak(aiGuidance, (lang as any) || 'en', () => {
        setIsSpeaking(false);
      });
    }
  };

  // ── Send Inquiry Handler ─────────────────────────────────────────
  const handleSendInquiry = async () => {
    if (!inquiryNote.trim()) {
      setInquiryError(t('inquiryNoteLabel'));
      return;
    }

    setIsSendingInquiry(true);
    setInquiryError(null);

    try {
      const payload = {
        productId: product.id,
        productTitle: product.title,
        productImage: imageUri,
        artisanId: product.artisanId,
        artisanPhone: product.artisanPhone,
        artisanName: product.artisanName,
        customerLanguage: lang,
        artisanLanguage: product.artisanLanguage || 'te',
        requestedQuantity: Number(inquiryQuantity) || 1,
        initialMessage: inquiryNote.trim(),
      };

      const result = await ApiAdapter.createInquiry(payload);
      const newId = result?.inquiry?.id || result?.id || null;
      setCreatedInquiryId(newId);
      setInquirySuccess(true);
    } catch (err: any) {
      console.warn('Inquiry send error:', err);
      setInquiryError(err.message || 'Failed to send inquiry to artisan.');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleNavigateToInquiries = () => {
    setIsInquiryModalVisible(false);
    setInquirySuccess(false);
    // Navigate to Inquiries tab
    navigation.getParent()?.navigate('Inquiries', { inquiryId: createdInquiryId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top App Bar ────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('backToMarket')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={PALETTE.primaryLight} />
          <Text style={styles.backLabel}>{t('backToMarket')}</Text>
        </Pressable>

        <Badge
          label={product?.category ? String(product.category).split('(')[0].trim() : t('handicrafts')}
          tone="neutral"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Photo ───────────────────────────────────────────── */}
        <View style={styles.photoContainer}>
          {imageUri && !imageFailed ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.heroPhoto}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons name="image-outline" size={56} color={PALETTE.textMuted} />
              <Text style={styles.photoFallbackText}>{product?.title || t('untitledCraft')}</Text>
            </View>
          )}

          <View style={styles.photoBadgeWrap}>
            <Badge
              label={t('piecesAvailable', { count: stock })}
              tone={stock > 5 ? 'primary' : 'warning'}
            />
          </View>
        </View>

        {/* ── Product Header Block ─────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <Text style={[TYPOGRAPHY.title1, styles.productTitle]}>
            {product?.title || t('untitledCraft')}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{price.toLocaleString?.() ?? price}</Text>
            <Text style={styles.priceSubtitle}>
              ({t('stockBadge')}: {stock})
            </Text>
          </View>

          {/* Description */}
          <Card style={styles.descCard}>
            <Text style={[TYPOGRAPHY.body, styles.descText]}>
              {product?.fullDescription || product?.shortDescription || t('marketDescFallback')}
            </Text>
          </Card>
        </View>

        {/* ── Authentic Specifications Grid ───────────────────────── */}
        <View style={styles.specsSection}>
          <Text style={[TYPOGRAPHY.caption, styles.sectionHeaderLabel]}>
            {t('snapshotTitle')}
          </Text>

          <View style={styles.specsGrid}>
            <Card style={styles.specCard}>
              <Text style={[TYPOGRAPHY.caption, styles.specLabel]}>{t('materialLabel')}</Text>
              <Text style={styles.specValue} numberOfLines={2}>
                {product?.material || 'Natural Eco Materials'}
              </Text>
            </Card>

            <Card style={styles.specCard}>
              <Text style={[TYPOGRAPHY.caption, styles.specLabel]}>{t('techniqueLabel')}</Text>
              <Text style={styles.specValue} numberOfLines={2}>
                {product?.craftTechnique || 'Heritage Handcrafted'}
              </Text>
            </Card>

            <Card style={styles.specCard}>
              <Text style={[TYPOGRAPHY.caption, styles.specLabel]}>{t('dimensionsLabel')}</Text>
              <Text style={styles.specValue} numberOfLines={2}>
                {product?.dimensions || 'Standard Artisan Size'}
              </Text>
            </Card>

            <Card style={styles.specCard}>
              <Text style={[TYPOGRAPHY.caption, styles.specLabel]}>{t('craftTimeLabel')}</Text>
              <Text style={styles.specValue} numberOfLines={2}>
                {product?.timeToMake || 'Handmade with patience'}
              </Text>
            </Card>
          </View>
        </View>

        {/* ── Master Artisan Profile Card ─────────────────────────── */}
        <Card elevated style={styles.artisanCard}>
          <View style={styles.artisanRow}>
            <Avatar name={product?.artisanName || t('masterMaker')} size={48} />
            <View style={styles.artisanInfo}>
              <View style={styles.artisanTitleRow}>
                <Text style={TYPOGRAPHY.headline} numberOfLines={1}>
                  {product?.artisanName || t('masterMaker')}
                </Text>
                <Badge label={t('verifiedArtisan')} tone="ai" />
              </View>
              <Text style={[TYPOGRAPHY.footnote, styles.artisanRegion]}>
                <Ionicons name="location-sharp" size={12} color={PALETTE.primaryLight} />{' '}
                {product?.region || t('indiaLabel')}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── ✨ Ask AI Order Guidance Section ────────────────────── */}
        <Card elevated style={styles.aiGuidanceCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBadge}>
              <Ionicons name="sparkles" size={18} color={PALETTE.aiAccent} />
            </View>
            <View style={styles.aiHeaderTextWrap}>
              <Text style={styles.aiHeaderTitle}>{t('askAiTitle')}</Text>
              <Text style={styles.aiHeaderSub}>{t('askAiSub')}</Text>
            </View>
          </View>

          {/* Quick Intent Chips */}
          <View style={styles.aiChipsWrap}>
            <Chip
              label={t('howToOrderPrompt')}
              selected={false}
              onPress={() => handleAskAi(t('howToOrderPrompt'))}
            />
            <Chip
              label={t('contactArtisanPrompt')}
              selected={false}
              onPress={() => handleAskAi(t('contactArtisanPrompt'))}
            />
            <Chip
              label={t('bulkOrderPrompt')}
              selected={false}
              onPress={() => handleAskAi(t('bulkOrderPrompt'))}
            />
          </View>

          {/* Custom Question Input */}
          <View style={styles.aiInputRow}>
            <TextInput
              style={styles.aiInput}
              value={customQuestion}
              onChangeText={setCustomQuestion}
              placeholder={t('customQuestionPlaceholder')}
              placeholderTextColor={PALETTE.textMuted}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (customQuestion.trim()) {
                  handleAskAi(customQuestion);
                  setCustomQuestion('');
                }
              }}
            />
            <Button
              title={t('askAiActionBtn')}
              onPress={() => {
                if (customQuestion.trim()) {
                  handleAskAi(customQuestion);
                  setCustomQuestion('');
                }
              }}
              variant="secondary"
              disabled={!customQuestion.trim() || aiLoading}
              style={styles.aiAskBtn}
            />
          </View>

          {/* AI Thinking / Response */}
          {aiLoading ? (
            <View style={styles.aiThinkingBox}>
              <ActivityIndicator size="small" color={PALETTE.aiAccent} />
              <Text style={styles.aiThinkingText}>{t('aiThinking')}</Text>
            </View>
          ) : aiGuidance ? (
            <View style={styles.aiResponseBox}>
              <View style={styles.aiResponseTop}>
                <Badge label={t('aiActive')} tone="ai" />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleToggleSpeech}
                  style={styles.ttsButton}
                >
                  <Ionicons
                    name={isSpeaking ? 'volume-mute' : 'volume-high'}
                    size={16}
                    color={PALETTE.aiAccent}
                  />
                  <Text style={styles.ttsButtonText}>
                    {isSpeaking ? t('stopListeningBtn') : t('listenBtn')}
                  </Text>
                </Pressable>
              </View>

              <Text style={[TYPOGRAPHY.body, styles.aiResponseText]}>{aiGuidance}</Text>

              {suggestedAction === 'CONTACT_ARTISAN' || suggestedAction === 'ORDER' ? (
                <Button
                  title={t('aiGuidanceActionInquire')}
                  onPress={() => setIsInquiryModalVisible(true)}
                  icon={<Ionicons name="chatbox-ellipses" size={16} color={PALETTE.textInverse} />}
                  style={styles.suggestedActionBtn}
                />
              ) : null}
            </View>
          ) : null}
        </Card>

        {/* Bottom Spacing so content isn't covered by sticky action bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Bottom CTA Bar ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={TYPOGRAPHY.caption}>{t('stockBadge')}</Text>
          <Text style={styles.bottomPrice}>₹{price.toLocaleString?.() ?? price}</Text>
        </View>

        <Button
          title={t('sendInquiryBtn')}
          onPress={() => setIsInquiryModalVisible(true)}
          icon={<Ionicons name="chatbubble-ellipses-outline" size={18} color={PALETTE.textInverse} />}
          style={styles.primaryCta}
        />
      </View>

      {/* ── Send Inquiry Modal / Bottom Sheet ──────────────────────── */}
      <Modal
        visible={isInquiryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isSendingInquiry) setIsInquiryModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBlock}>
                <Text style={TYPOGRAPHY.headline}>{t('inquiryModalTitle')}</Text>
                <Text style={[TYPOGRAPHY.caption, styles.modalHeaderSub]}>
                  {t('inquiryModalSub')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsInquiryModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={PALETTE.textMuted} />
              </Pressable>
            </View>

            {inquirySuccess ? (
              /* Success State */
              <View style={styles.successState}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={54} color={PALETTE.success} />
                </View>
                <Text style={[TYPOGRAPHY.title2, styles.successTitle]}>
                  {t('inquirySentSuccess')}
                </Text>
                <Text style={[TYPOGRAPHY.body, styles.successBody]}>
                  {t('inquirySuccessMessage')}
                </Text>

                <View style={styles.successActions}>
                  <Button
                    title={t('viewMyInquiries')}
                    onPress={handleNavigateToInquiries}
                    style={styles.successPrimaryBtn}
                  />
                  <Button
                    title={t('closeBtn')}
                    onPress={() => {
                      setIsInquiryModalVisible(false);
                      setInquirySuccess(false);
                    }}
                    variant="ghost"
                  />
                </View>
              </View>
            ) : (
              /* Form State */
              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalForm}
              >
                {/* Product Context Mini Card */}
                <Card style={styles.modalProductCard}>
                  <Text style={TYPOGRAPHY.headline} numberOfLines={1}>
                    {product?.title}
                  </Text>
                  <Text style={TYPOGRAPHY.footnote}>
                    {t('artisanPrefix', { name: product?.artisanName || t('masterMaker') })}
                  </Text>
                </Card>

                {/* Quantity Selector */}
                <View style={styles.formGroup}>
                  <Text style={[TYPOGRAPHY.caption, styles.formLabel]}>{t('quantityLabel')}</Text>
                  <View style={styles.quantityChips}>
                    {[10, 25, 50, 100, 250].map((qty) => (
                      <Chip
                        key={qty}
                        label={`${qty}`}
                        selected={inquiryQuantity === qty}
                        onPress={() => setInquiryQuantity(qty)}
                      />
                    ))}
                  </View>
                  <TextInput
                    style={styles.quantityInput}
                    value={String(inquiryQuantity)}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      setInquiryQuantity(isNaN(num) ? 1 : num);
                    }}
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={PALETTE.textMuted}
                  />
                </View>

                {/* Message / Requirements Input */}
                <View style={styles.formGroup}>
                  <Text style={[TYPOGRAPHY.caption, styles.formLabel]}>
                    {t('inquiryNoteLabel')}
                  </Text>
                  <TextInput
                    style={styles.inquiryTextInput}
                    value={inquiryNote}
                    onChangeText={setInquiryNote}
                    placeholder={t('inquiryDefaultNote')}
                    placeholderTextColor={PALETTE.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {inquiryError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={PALETTE.error} />
                    <Text style={styles.errorText}>{inquiryError}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <Button
                  title={t('sendInquiryBtn')}
                  onPress={handleSendInquiry}
                  loading={isSendingInquiry}
                  icon={<Ionicons name="send" size={16} color={PALETTE.textInverse} />}
                  style={styles.modalSubmitBtn}
                />
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  photoContainer: {
    width: '100%',
    height: 280,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    position: 'relative',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surface,
    padding: SPACING.md,
  },
  photoFallbackText: {
    ...TYPOGRAPHY.headline,
    color: PALETTE.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  photoBadgeWrap: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
  },
  headerBlock: {
    gap: SPACING.xs,
  },
  productTitle: {
    color: PALETTE.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.primaryLight,
  },
  priceSubtitle: {
    ...TYPOGRAPHY.caption,
    color: PALETTE.textMuted,
  },
  descCard: {
    marginTop: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: PALETTE.surface,
  },
  descText: {
    lineHeight: 22,
    color: PALETTE.textSecondary,
  },
  specsSection: {
    gap: SPACING.xs,
  },
  sectionHeaderLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: PALETTE.textMuted,
    marginBottom: SPACING.xxs,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specCard: {
    flex: 1,
    minWidth: '46%',
    padding: SPACING.sm,
    gap: SPACING.xxs,
  },
  specLabel: {
    textTransform: 'uppercase',
    color: PALETTE.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  specValue: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '700',
    color: PALETTE.primaryLight,
  },
  artisanCard: {
    padding: SPACING.md,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  artisanInfo: {
    flex: 1,
    gap: SPACING.xxs,
  },
  artisanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  artisanRegion: {
    color: PALETTE.textMuted,
  },
  aiGuidanceCard: {
    padding: SPACING.md,
    backgroundColor: '#1c1511',
    borderColor: '#38281e',
    gap: SPACING.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderTextWrap: {
    flex: 1,
  },
  aiHeaderTitle: {
    ...TYPOGRAPHY.headline,
    color: PALETTE.primaryLight,
  },
  aiHeaderSub: {
    ...TYPOGRAPHY.caption,
    color: PALETTE.textMuted,
  },
  aiChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xxs,
  },
  aiInput: {
    flex: 1,
    height: 42,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    color: PALETTE.textPrimary,
    fontSize: 13,
  },
  aiAskBtn: {
    minHeight: 42,
    paddingHorizontal: SPACING.md,
  },
  aiThinkingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.md,
  },
  aiThinkingText: {
    ...TYPOGRAPHY.footnote,
    color: PALETTE.textMuted,
  },
  aiResponseBox: {
    padding: SPACING.md,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  aiResponseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  ttsButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.aiAccent,
  },
  aiResponseText: {
    lineHeight: 20,
    color: PALETTE.textPrimary,
  },
  suggestedActionBtn: {
    marginTop: SPACING.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: PALETTE.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  bottomBarInfo: {
    gap: 2,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.primaryLight,
  },
  primaryCta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.surfaceBorder,
  },
  modalHeaderTitleBlock: {
    flex: 1,
    gap: SPACING.xxs,
  },
  modalHeaderSub: {
    color: PALETTE.textMuted,
  },
  modalCloseBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    minWidth: TOUCH_TARGET.minWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalForm: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  modalProductCard: {
    padding: SPACING.sm,
    backgroundColor: PALETTE.background,
  },
  formGroup: {
    gap: SPACING.xs,
  },
  formLabel: {
    textTransform: 'uppercase',
    color: PALETTE.textMuted,
    fontWeight: '700',
  },
  quantityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  quantityInput: {
    height: 44,
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    color: PALETTE.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  inquiryTextInput: {
    minHeight: 90,
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    color: PALETTE.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: PALETTE.errorMuted,
    borderRadius: RADIUS.md,
  },
  errorText: {
    ...TYPOGRAPHY.footnote,
    color: PALETTE.error,
    flex: 1,
  },
  modalSubmitBtn: {
    marginTop: SPACING.xs,
  },
  successState: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  successIconWrap: {
    marginBottom: SPACING.xs,
  },
  successTitle: {
    textAlign: 'center',
    color: PALETTE.textPrimary,
  },
  successBody: {
    textAlign: 'center',
    color: PALETTE.textSecondary,
    lineHeight: 22,
  },
  successActions: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  successPrimaryBtn: {
    width: '100%',
  },
});
