import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ImageAdapter, PickedImageResult } from '../../adapters/image';
import { ApiAdapter, PricingRecommendationResponse } from '../../adapters/api';
import { AuthAdapter } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorState } from '../../components/ui/ErrorState';
import { SpeechAdapter } from '../../adapters/speech';

interface UploadScreenProps {
  navigation?: any;
}

/** 5-stage progress indicator: Photo → Info → Pricing → Stock → Review */
const StepProgress: React.FC<{ currentIndex: number }> = ({ currentIndex }) => {
  const { t } = useLanguage();
  const steps = [
    t('stepCapture'),
    t('stepDescribe'),
    t('stepPricing') || 'Pricing',
    t('stepStock') || 'Stock',
    t('stepReview') || 'Review',
  ];

  return (
    <View
      style={styles.stepsRow}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps.length - 1, now: currentIndex }}
    >
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <React.Fragment key={label}>
            {i > 0 ? (
              <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />
            ) : null}
            <View
              style={[styles.stepPill, current && styles.stepPillCurrent]}
              accessible
              accessibilityLabel={`Step ${i + 1} of ${steps.length}: ${label} — ${
                done ? 'complete' : current ? 'current step' : 'upcoming'
              }`}
            >
              <View
                style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  current && styles.stepDotCurrent,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color={PALETTE.textInverse} />
                ) : (
                  <Text style={[styles.stepDotText, current && styles.stepDotTextCurrent]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepPillLabel, current && styles.stepPillLabelCurrent]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const PhotoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      style={styles.photoPreview}
      contentFit="cover"
      transition={0}
      accessibilityLabel={t('photoPreviewA11y')}
      onError={() => setFailed(true)}
    />
  );
};

/** Structured rendering of the craft info extraction result */
const ExtractionResultView: React.FC<{ result: any; onRetry: () => void }> = ({
  result,
  onRetry,
}) => {
  const { t } = useLanguage();
  if (result.error) {
    return (
      <ErrorState
        title={t('aiErrorTitle')}
        message={result.error}
        retryLabel={t('retryBtn')}
        onRetry={onRetry}
      />
    );
  }

  const data = result.extractedData;
  const missing = Array.isArray(result.missingFields) ? result.missingFields : [];
  const features = Array.isArray(data?.features) ? data.features : [];

  const FIELDS: { key: string; label: string }[] = [
    { key: 'productName', label: t('fieldProductName') },
    { key: 'category', label: t('fieldCategory') },
    { key: 'material', label: t('fieldMaterial') },
    { key: 'craftTechnique', label: t('fieldTechnique') },
    { key: 'dimensions', label: t('fieldDimensions') },
    { key: 'weight', label: t('fieldWeight') },
    { key: 'timeToMake', label: t('fieldTimeToMake') },
  ];

  return (
    <View style={styles.aiResult}>
      {!result.isComplete && missing.length > 0 ? (
        <View style={styles.followUpCard}>
          <Text style={[TYPOGRAPHY.caption, styles.aiAccentText]}>{t('missingTitle')}</Text>
          <Text style={[TYPOGRAPHY.body, styles.followUpText]}>
            {result.followUpQuestion || t('missingDefault')}
          </Text>
          <View style={styles.badgeRow}>
            {missing.map((m: string) => (
              <Badge key={m} label={m} tone="warning" />
            ))}
          </View>
        </View>
      ) : null}

      {data ? (
        <View style={styles.fieldList}>
          {FIELDS.map((field) => {
            const value = data[field.key];
            if (value === undefined || value === null || value === '') return null;
            return (
              <View key={field.key} style={styles.fieldBlock}>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>{field.label.toUpperCase()}</Text>
                <Text style={TYPOGRAPHY.body}>{String(value)}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {features.length > 0 ? (
        <View style={styles.featureRow}>
          {features.map((f: string, i: number) => (
            <Badge key={`${f}-${i}`} label={f} tone="ai" />
          ))}
        </View>
      ) : null}

      <Text style={[TYPOGRAPHY.footnote, styles.aiDisclaimer]}>{t('aiDisclaimer')}</Text>
    </View>
  );
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const { t, lang } = useLanguage();

  // Step 1: Photo
  const [selectedImage, setSelectedImage] = useState<PickedImageResult | null>(null);

  // Step 2: Description & Craft Info
  const [voiceNote, setVoiceNote] = useState('');
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSpeakingDescription, setIsSpeakingDescription] = useState(false);

  // Editable overrides for extracted attributes
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');

  // Step 3: AI Pricing
  const [pricingResult, setPricingResult] = useState<PricingRecommendationResponse | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState('');

  // Step 4: Stock & Contact
  const [stockQuantity, setStockQuantity] = useState('15');
  const [artisanPhone, setArtisanPhone] = useState('+91 98480 12345');
  const [artisanRegion, setArtisanRegion] = useState('Andhra Pradesh / Telangana');
  const [customizationAvailable, setCustomizationAvailable] = useState(true);

  // Step 5: Publish & State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<any | null>(null);

  // Load artisan phone from current user session on mount
  useEffect(() => {
    let active = true;
    AuthAdapter.getCurrentUser().then((user) => {
      if (active && user?.phone) {
        setArtisanPhone(user.phone.startsWith('+') ? user.phone : `+91 ${user.phone}`);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Handlers for Step 1: Photo
  const handleCamera = async () => {
    const result = await ImageAdapter.captureFromCamera();
    if (!result.cancelled) {
      setSelectedImage(result);
    }
  };

  const handleGallery = async () => {
    const result = await ImageAdapter.pickFromGallery();
    if (!result.cancelled) {
      setSelectedImage(result);
    }
  };

  // Handlers for Step 2: Info Extraction
  const handleAnalyzeWithAi = async () => {
    if (!voiceNote.trim()) return;
    setIsExtracting(true);
    try {
      const result = await ApiAdapter.extractCraftInfo(voiceNote, lang);
      setExtractionResult(result);
      if (result.extractedData?.productName) {
        setCustomTitle(result.extractedData.productName);
      }
      if (result.extractedData?.category) {
        setCustomCategory(result.extractedData.category);
      }
      if (result.extractedData?.material) {
        setCustomMaterial(result.extractedData.material);
      }
    } catch (err: any) {
      setExtractionResult({ error: err.message || 'AI extraction failed' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSpeakDescription = async () => {
    if (!voiceNote.trim()) return;
    setIsSpeakingDescription(true);
    await SpeechAdapter.speak(voiceNote, lang as any, () => setIsSpeakingDescription(false));
  };

  const handleVoiceInput = () => {
    Alert.alert(
      t('yourDescription'),
      'Voice transcription is not available in this native build. Please type the description, or use the web app for browser speech recognition.'
    );
  };

  // Handler for Step 3: AI Pricing
  const handleGetPricing = async () => {
    setIsPricingLoading(true);
    setPricingError(null);
    try {
      const productData = {
        productName: customTitle || extractionResult?.extractedData?.productName || 'Authentic Craft',
        category: customCategory || extractionResult?.extractedData?.category || 'Handicrafts',
        material: customMaterial || extractionResult?.extractedData?.material || 'Handcrafted Material',
        craftTechnique: extractionResult?.extractedData?.craftTechnique || 'Traditional Handcraft',
        dimensions: extractionResult?.extractedData?.dimensions || 'Approx 10-12 inches',
        weight: extractionResult?.extractedData?.weight || '500g',
        timeToMake: extractionResult?.extractedData?.timeToMake || '3-5 days',
        features: extractionResult?.extractedData?.features || [],
      };
      const rec = await ApiAdapter.getPricingRecommendation(productData, lang);
      setPricingResult(rec);
      if (rec?.recommendedPrice) {
        setFinalPrice(String(rec.recommendedPrice));
      }
    } catch (err: any) {
      setPricingError(err.message || 'Pricing recommendation failed');
    } finally {
      setIsPricingLoading(false);
    }
  };

  // Handler for Step 5: Publish Product
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);

    const priceNum = Number(finalPrice) > 0 ? Number(finalPrice) : (pricingResult?.recommendedPrice || 1200);
    const stockNum = Number(stockQuantity) >= 0 ? Number(stockQuantity) : 10;

    const productPayload: any = {
      title: customTitle.trim() || extractionResult?.extractedData?.productName || 'Authentic Handcrafted Piece',
      shortDescription: extractionResult?.extractedData?.material
        ? `Authentic ${extractionResult.extractedData.material} craft made with traditional techniques.`
        : 'Authentic handmade craft made with traditional techniques.',
      fullDescription: voiceNote.trim() || 'Authentic handcrafted piece crafted with traditional expertise.',
      category: customCategory.trim() || extractionResult?.extractedData?.category || 'Handicrafts',
      material: customMaterial.trim() || extractionResult?.extractedData?.material || 'Natural Handcrafted Materials',
      craftTechnique: extractionResult?.extractedData?.craftTechnique || 'Traditional Handcraft',
      dimensions: extractionResult?.extractedData?.dimensions || 'Approx 10-12 inches',
      weight: extractionResult?.extractedData?.weight || '500g',
      timeToMake: extractionResult?.extractedData?.timeToMake || '3-5 days',
      region: artisanRegion || 'Andhra Pradesh / Telangana',
      originalImageUrl: selectedImage?.base64 || '',
      enhancedImageUrl: selectedImage?.base64 || '',
      suggestedPriceMin: pricingResult?.suggestedPriceMin ?? Math.round(priceNum * 0.85),
      suggestedPriceMax: pricingResult?.suggestedPriceMax ?? Math.round(priceNum * 1.25),
      recommendedPrice: pricingResult?.recommendedPrice ?? priceNum,
      finalPrice: priceNum,
      pricingReason: pricingResult?.pricingReason || 'Fair artisanal price based on materials and craftsmanship hours.',
      stockQuantity: stockNum,
      customizationAvailable: customizationAvailable,
      status: 'PUBLISHED',
    };

    try {
      const created = await ApiAdapter.createProduct(productPayload);
      setPublishedProduct(created);
      setIsSuccess(true);
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish craft listing');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handler to reset and add another craft
  const handleReset = () => {
    setSelectedImage(null);
    setVoiceNote('');
    setExtractionResult(null);
    setCustomTitle('');
    setCustomCategory('');
    setCustomMaterial('');
    setPricingResult(null);
    setFinalPrice('');
    setStockQuantity('15');
    setIsSuccess(false);
    setPublishedProduct(null);
    setPublishError(null);
  };

  // Progress index calculation:
  const hasPhoto = Boolean(selectedImage?.uri);
  const hasInfo = Boolean(extractionResult?.extractedData || voiceNote.trim());
  const hasPricing = Boolean(pricingResult);
  const hasStock = Boolean(stockQuantity && artisanPhone);

  const currentIndex = isSuccess
    ? 4
    : hasPricing && hasStock
    ? 4
    : hasPricing
    ? 3
    : hasInfo
    ? 2
    : hasPhoto
    ? 1
    : 0;

  // Active product title for display
  const displayTitle = customTitle || extractionResult?.extractedData?.productName || 'Handcrafted Piece';
  const displayCategory = customCategory || extractionResult?.extractedData?.category || 'Handicrafts';
  const displayMaterial = customMaterial || extractionResult?.extractedData?.material || 'Natural Materials';

  // If published successfully, show the full celebration card
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.successWrapper}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color={PALETTE.success} />
            </View>
            <Badge label={t('publishSuccessTitle') || 'Craft Published'} tone="success" />
            <Text style={[TYPOGRAPHY.title1, styles.successTitle]}>
              {t('publishSuccessTitle') || 'Craft Published Successfully!'}
            </Text>
            <Text style={[TYPOGRAPHY.body, styles.successSubtitle]}>
              {t('publishSuccessSubtitle') ||
                'Your authentic craft is now live on the marketplace for verified buyers.'}
            </Text>

            <Card style={styles.successCard}>
              {selectedImage?.uri ? (
                <Image source={{ uri: selectedImage.uri }} style={styles.successThumb} contentFit="cover" />
              ) : null}
              <View style={styles.successDetails}>
                <Text style={TYPOGRAPHY.headline}>{displayTitle}</Text>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>{displayCategory}</Text>
                <View style={styles.successMetaRow}>
                  <Badge label={`₹${finalPrice || pricingResult?.recommendedPrice}`} tone="primary" />
                  <Badge label={`${stockQuantity} in stock`} tone="neutral" />
                </View>
              </View>
            </Card>

            <View style={styles.successActions}>
              {navigation ? (
                <Button
                  title={t('viewInCatalogBtn') || 'View in My Crafts'}
                  onPress={() => navigation.navigate('Catalog')}
                  variant="primary"
                  style={styles.fullButton}
                  accessibilityLabel="View in Catalog"
                />
              ) : null}
              <Button
                title={t('addAnotherCraftBtn') || 'Add Another Craft'}
                onPress={handleReset}
                variant="secondary"
                style={styles.fullButton}
                accessibilityLabel="Add Another Craft"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Badge label={t('studioBadge')} tone="primary" />
          <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('addCraftTitle')}</Text>
          <Text style={TYPOGRAPHY.body}>{t('uploadSubtitle')}</Text>
        </View>

        {/* Step progress bar */}
        <View style={styles.stepsWrap}>
          <StepProgress currentIndex={currentIndex} />
        </View>

        {/* ── STEP 1: PHOTO CAPTURE ────────────────────────────── */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>{t('step1Label')}</Text>
        <Card style={styles.stepCard}>
          {hasPhoto && selectedImage ? (
            <>
              <PhotoPreview uri={selectedImage.uri} />
              <View style={styles.photoStatusRow}>
                <Badge tone="success" label={t('photoAttached')} />
              </View>
              <Text style={TYPOGRAPHY.footnote}>{selectedImage.uri}</Text>
              <View style={styles.captureButtons}>
                <Button
                  variant="secondary"
                  title="📷 Change Camera"
                  onPress={handleCamera}
                  style={styles.captureButton}
                />
                <Button
                  variant="secondary"
                  title="🖼️ Change Gallery"
                  onPress={handleGallery}
                  style={styles.captureButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.captureEmpty}>
                <View style={styles.captureIconCircle}>
                  <Ionicons name="camera-outline" size={26} color={PALETTE.primaryLight} />
                </View>
                <Text style={TYPOGRAPHY.headline}>{t('captureTitle')}</Text>
                <Text style={TYPOGRAPHY.footnote}>{t('captureHint')}</Text>
              </View>

              <View style={styles.captureButtons}>
                <Button
                  variant="secondary"
                  title={t('cameraBtn')}
                  onPress={handleCamera}
                  style={styles.captureButton}
                  accessibilityLabel={t('cameraBtn')}
                />
                <Button
                  variant="secondary"
                  title={t('galleryBtn')}
                  onPress={handleGallery}
                  style={styles.captureButton}
                  accessibilityLabel={t('galleryBtn')}
                />
              </View>
            </>
          )}
        </Card>

        {/* ── STEP 2: CRAFT INFO & ATTRIBUTES ──────────────────── */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>{t('step2Label')}</Text>
        <Card style={styles.stepCard}>
          <TextField
            label={t('yourDescription')}
            value={voiceNote}
            onChangeText={setVoiceNote}
            multiline
            numberOfLines={4}
            placeholder={t('descPlaceholder')}
            helper={t('descHelper')}
            accessibilityLabel={t('yourDescription')}
          />
          <View style={styles.voiceActions}>
            <Pressable
              onPress={handleVoiceInput}
              style={styles.voiceAction}
              accessibilityRole="button"
              accessibilityLabel="Use voice input"
            >
              <Ionicons name="mic-outline" size={20} color={PALETTE.primaryLight} />
              <Text style={styles.voiceActionText}>Voice input</Text>
            </Pressable>
            <Pressable
              onPress={handleSpeakDescription}
              disabled={!voiceNote.trim() || isSpeakingDescription}
              style={[
                styles.voiceAction,
                (!voiceNote.trim() || isSpeakingDescription) && styles.voiceActionDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Listen to description"
            >
              <Ionicons
                name={isSpeakingDescription ? 'volume-high' : 'volume-medium-outline'}
                size={20}
                color={PALETTE.primaryLight}
              />
              <Text style={styles.voiceActionText}>Listen</Text>
            </Pressable>
          </View>

          {/* AI extraction block */}
          <View style={styles.divider} />
          <View style={styles.aiHeaderRow}>
            <Badge tone="ai" label={t('aiAssisted')} />
          </View>

          {isExtracting ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={PALETTE.aiAccent} />
              <Text style={TYPOGRAPHY.body}>{t('aiProcessing')}</Text>
            </View>
          ) : extractionResult ? (
            <>
              <ExtractionResultView result={extractionResult} onRetry={handleAnalyzeWithAi} />

              {/* Editable attribute overrides */}
              <View style={styles.overrideFields}>
                <TextField
                  label={t('fieldProductName')}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="e.g. Handcrafted Brass Diya"
                />
                <TextField
                  label={t('fieldCategory')}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="e.g. Metalwork, Textiles, Pottery"
                />
                <TextField
                  label={t('fieldMaterial')}
                  value={customMaterial}
                  onChangeText={setCustomMaterial}
                  placeholder="e.g. Pure Bell Metal, Silk"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={TYPOGRAPHY.body}>{t('aiIdle')}</Text>
              <Button
                title={t('extractBtn')}
                onPress={handleAnalyzeWithAi}
                disabled={isExtracting || !voiceNote.trim()}
                style={styles.aiButton}
                accessibilityLabel={t('extractBtn')}
              />
            </>
          )}
        </Card>

        {/* ── STEP 3: AI FAIR PRICING ──────────────────────────── */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>
          {t('step4Label') || 'STEP 3 — FAIR PRICING'}
        </Text>
        <Card style={styles.stepCard}>
          <View style={styles.aiHeaderRow}>
            <Badge tone="ai" label="AI DYNAMIC PRICING" />
          </View>
          <Text style={TYPOGRAPHY.headline}>
            {t('pricingTitle') || 'AI Fair Pricing Recommendation'}
          </Text>
          <Text style={[TYPOGRAPHY.footnote, styles.fieldLabel]}>
            {t('pricingSubtitle') ||
              'Protects artisans from exploitation with fair wholesale floor and retail ceiling.'}
          </Text>

          {isPricingLoading ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={PALETTE.primary} />
              <Text style={TYPOGRAPHY.body}>
                {t('pricingCalculating') || 'Calculating fair artisan price with Gemini...'}
              </Text>
            </View>
          ) : pricingError ? (
            <ErrorState
              title="Pricing calculation failed"
              message={pricingError}
              retryLabel={t('retryBtn')}
              onRetry={handleGetPricing}
            />
          ) : pricingResult ? (
            <View style={styles.pricingContent}>
              {/* 3 Price Pillars: Min, Sweet-spot, Max */}
              <View style={styles.pricePillarsRow}>
                <View style={styles.pricePillar}>
                  <Text style={[TYPOGRAPHY.caption, styles.pillarLabel]}>
                    {t('minPriceLabel') || 'Wholesale (Min)'}
                  </Text>
                  <Text style={[TYPOGRAPHY.title2, styles.pillarPrice]}>
                    ₹{pricingResult.suggestedPriceMin}
                  </Text>
                  <Text style={[TYPOGRAPHY.footnote, styles.pillarSub]}>Floor</Text>
                </View>

                <View style={[styles.pricePillar, styles.pricePillarRecommended]}>
                  <Badge label="Sweet-Spot" tone="primary" />
                  <Text style={[TYPOGRAPHY.title1, styles.recommendedPriceText]}>
                    ₹{pricingResult.recommendedPrice}
                  </Text>
                  <Text style={[TYPOGRAPHY.footnote, styles.recommendedSub]}>Recommended</Text>
                </View>

                <View style={styles.pricePillar}>
                  <Text style={[TYPOGRAPHY.caption, styles.pillarLabel]}>
                    {t('maxPriceLabel') || 'Retail (Max)'}
                  </Text>
                  <Text style={[TYPOGRAPHY.title2, styles.pillarPrice]}>
                    ₹{pricingResult.suggestedPriceMax}
                  </Text>
                  <Text style={[TYPOGRAPHY.footnote, styles.pillarSub]}>Ceiling</Text>
                </View>
              </View>

              {/* AI Rationale Box */}
              <View style={styles.rationaleBox}>
                <View style={styles.rationaleHeader}>
                  <Ionicons name="sparkles" size={16} color={PALETTE.aiAccent} />
                  <Text style={[TYPOGRAPHY.caption, styles.rationaleTitle]}>
                    {t('pricingReasonLabel') || 'AI PRICING RATIONALE'}
                  </Text>
                </View>
                <Text style={[TYPOGRAPHY.body, styles.rationaleText]}>
                  {pricingResult.pricingReason}
                </Text>
              </View>

              {/* Final Listing Price Input */}
              <View style={styles.finalPriceField}>
                <TextField
                  label={t('customPriceLabel') || 'Final Listing Price (₹)'}
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                  keyboardType="numeric"
                  placeholder={String(pricingResult.recommendedPrice)}
                  helper={
                    t('customPriceHelper') ||
                    'Pre-filled with AI recommendation. You may adjust your price anytime.'
                  }
                />
              </View>
            </View>
          ) : (
            <View style={styles.pricingPrompt}>
              <Text style={TYPOGRAPHY.body}>
                {hasInfo
                  ? 'Ready to calculate fair pricing based on materials, craft technique, and handwork hours.'
                  : 'Complete craft description first to calculate an accurate fair price.'}
              </Text>
              <Button
                title={t('getPricingBtn') || '✨ Get AI Fair Pricing'}
                onPress={handleGetPricing}
                disabled={isPricingLoading || !hasInfo}
                style={styles.aiButton}
                accessibilityLabel="Get AI Fair Pricing"
              />
            </View>
          )}
        </Card>

        {/* ── STEP 4: STOCK & CONTACT ──────────────────────────── */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>
          {t('step5Label') || 'STEP 4 — STOCK & CONTACT'}
        </Text>
        <Card style={styles.stepCard}>
          <Text style={TYPOGRAPHY.headline}>
            {t('stockTitle') || 'Inventory & Direct Contact'}
          </Text>
          <Text style={[TYPOGRAPHY.footnote, styles.fieldLabel]}>
            {t('stockSubtitle') ||
              'Specify available units and contact number for buyer inquiries.'}
          </Text>

          <View style={styles.stockRow}>
            <View style={styles.stockInputWrap}>
              <TextField
                label={t('stockCountLabel') || 'Available Stock (Quantity)'}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>
            <View style={styles.stockChips}>
              {['5', '10', '25', '50'].map((qty) => (
                <Pressable
                  key={qty}
                  onPress={() => setStockQuantity(qty)}
                  style={[
                    styles.stockChip,
                    stockQuantity === qty && styles.stockChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stockChipText,
                      stockQuantity === qty && styles.stockChipTextActive,
                    ]}
                  >
                    {qty}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextField
            label={t('artisanContactLabel') || 'Contact Phone Number'}
            value={artisanPhone}
            onChangeText={setArtisanPhone}
            keyboardType="phone-pad"
            placeholder="+91 98480 12345"
            helper="Buyers can contact you directly via translated SMS / WhatsApp inquiries."
          />

          <TextField
            label={t('regionOriginLabel') || 'Craft Region / Origin'}
            value={artisanRegion}
            onChangeText={setArtisanRegion}
            placeholder="Andhra Pradesh / Telangana"
          />

          <Pressable
            onPress={() => setCustomizationAvailable(!customizationAvailable)}
            style={styles.customizationToggle}
          >
            <Ionicons
              name={customizationAvailable ? 'checkbox' : 'square-outline'}
              size={22}
              color={customizationAvailable ? PALETTE.primary : PALETTE.textMuted}
            />
            <Text style={[TYPOGRAPHY.body, styles.customizationText]}>
              {t('customizationBadge') || 'Accept custom orders and bulk inquiries'}
            </Text>
          </Pressable>
        </Card>

        {/* ── STEP 5: REVIEW & PUBLISH ─────────────────────────── */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>
          {t('step6Label') || 'STEP 5 — REVIEW & PUBLISH'}
        </Text>
        <Card style={styles.stepCard}>
          <Text style={TYPOGRAPHY.headline}>
            {t('reviewTitle') || 'Review Craft Details'}
          </Text>
          <Text style={[TYPOGRAPHY.footnote, styles.fieldLabel]}>
            {t('reviewSubtitle') ||
              'Confirm all details before publishing to the live marketplace.'}
          </Text>

          {/* Summary review panel */}
          <View style={styles.reviewPanel}>
            <View style={styles.reviewRow}>
              {selectedImage?.uri ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.reviewThumb}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.reviewThumb, styles.reviewThumbPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color={PALETTE.textMuted} />
                </View>
              )}
              <View style={styles.reviewInfo}>
                <Text style={TYPOGRAPHY.headline} numberOfLines={2}>
                  {displayTitle}
                </Text>
                <Text style={[TYPOGRAPHY.footnote, styles.fieldLabel]}>{displayCategory}</Text>
                <Text style={[TYPOGRAPHY.body, styles.reviewPrice]}>
                  ₹{finalPrice || pricingResult?.recommendedPrice || '---'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewDetailGrid}>
              <View style={styles.reviewDetailItem}>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>MATERIAL</Text>
                <Text style={TYPOGRAPHY.body} numberOfLines={1}>{displayMaterial}</Text>
              </View>
              <View style={styles.reviewDetailItem}>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>STOCK</Text>
                <Text style={TYPOGRAPHY.body}>{stockQuantity || 1} units</Text>
              </View>
              <View style={styles.reviewDetailItem}>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>PHONE</Text>
                <Text style={TYPOGRAPHY.body} numberOfLines={1}>{artisanPhone}</Text>
              </View>
              <View style={styles.reviewDetailItem}>
                <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>REGION</Text>
                <Text style={TYPOGRAPHY.body} numberOfLines={1}>{artisanRegion}</Text>
              </View>
            </View>

            {pricingResult ? (
              <View style={styles.reviewPriceRangeRow}>
                <Badge label={`Min ₹${pricingResult.suggestedPriceMin}`} tone="neutral" />
                <Badge label={`Sweet-Spot ₹${pricingResult.recommendedPrice}`} tone="primary" />
                <Badge label={`Max ₹${pricingResult.suggestedPriceMax}`} tone="neutral" />
              </View>
            ) : null}
          </View>

          {publishError ? (
            <ErrorState
              title={t('publishErrorTitle') || 'Failed to publish craft'}
              message={publishError}
              retryLabel={t('retryBtn')}
              onRetry={handlePublish}
            />
          ) : null}

          <Button
            title={
              isPublishing
                ? t('publishingCraft') || 'Publishing craft...'
                : t('publishCraftBtn') || '🚀 Publish Craft to Marketplace'
            }
            onPress={handlePublish}
            loading={isPublishing}
            disabled={isPublishing || !hasPhoto}
            variant="primary"
            style={styles.publishButton}
            accessibilityLabel="Publish Craft"
          />

          {!hasPhoto ? (
            <Text style={[TYPOGRAPHY.footnote, styles.warningText]}>
              Please attach a craft photo (Step 1) before publishing.
            </Text>
          ) : null}
        </Card>
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  pageHeader: {
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  stepsWrap: {
    marginBottom: SPACING.lg,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepConnector: {
    width: 10,
    height: 2,
    backgroundColor: PALETTE.surfaceBorder,
    marginHorizontal: SPACING.xxs,
  },
  stepConnectorDone: {
    backgroundColor: PALETTE.primary,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
  },
  stepPillCurrent: {
    backgroundColor: PALETTE.surfaceHighlight,
    borderColor: PALETTE.primary,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surfaceElevated,
  },
  stepDotDone: {
    backgroundColor: PALETTE.primary,
  },
  stepDotCurrent: {
    backgroundColor: PALETTE.primary,
  },
  stepDotText: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textMuted,
  },
  stepDotTextCurrent: {
    color: PALETTE.textInverse,
  },
  stepPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  stepPillLabelCurrent: {
    color: PALETTE.primaryLight,
  },
  stepLabel: {
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  stepCard: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  voiceActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  voiceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    backgroundColor: PALETTE.surfaceHighlight,
  },
  voiceActionDisabled: {
    opacity: 0.45,
  },
  voiceActionText: {
    color: PALETTE.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surfaceElevated,
  },
  photoStatusRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  captureEmpty: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  captureIconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primaryMuted,
    marginBottom: SPACING.sm,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  captureButton: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.surfaceBorder,
    marginVertical: SPACING.xs,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  aiButton: {
    marginTop: SPACING.sm,
  },
  aiResult: {
    gap: SPACING.md,
  },
  followUpCard: {
    padding: SPACING.md,
    backgroundColor: PALETTE.aiAccentMuted,
    borderColor: PALETTE.aiAccent,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  aiAccentText: {
    color: PALETTE.aiAccent,
  },
  followUpText: {
    color: PALETTE.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  fieldList: {
    gap: SPACING.md,
  },
  fieldBlock: {
    gap: SPACING.xxs,
  },
  fieldLabel: {
    color: PALETTE.textMuted,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  aiDisclaimer: {
    color: PALETTE.textMuted,
  },
  overrideFields: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  pricingContent: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  pricePillarsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pricePillar: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surfaceHighlight,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  pricePillarRecommended: {
    backgroundColor: PALETTE.surfaceElevated,
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
  },
  pillarLabel: {
    fontSize: 10,
    color: PALETTE.textMuted,
    textAlign: 'center',
  },
  pillarPrice: {
    color: PALETTE.textPrimary,
    fontWeight: '700',
  },
  pillarSub: {
    fontSize: 10,
    color: PALETTE.textMuted,
  },
  recommendedPriceText: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  recommendedSub: {
    fontSize: 10,
    color: PALETTE.primary,
    fontWeight: '600',
  },
  rationaleBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.aiAccentMuted,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    gap: SPACING.xs,
  },
  rationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rationaleTitle: {
    color: PALETTE.aiAccent,
    fontWeight: '700',
  },
  rationaleText: {
    color: PALETTE.textPrimary,
    lineHeight: 20,
  },
  finalPriceField: {
    marginTop: SPACING.xs,
  },
  pricingPrompt: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
  },
  stockInputWrap: {
    flex: 1,
  },
  stockChips: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  stockChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: PALETTE.surfaceHighlight,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
  },
  stockChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  stockChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  stockChipTextActive: {
    color: PALETTE.textInverse,
  },
  customizationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  customizationText: {
    color: PALETTE.textPrimary,
    flex: 1,
  },
  reviewPanel: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surfaceHighlight,
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    gap: SPACING.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  reviewThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
    backgroundColor: PALETTE.surfaceElevated,
  },
  reviewThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInfo: {
    flex: 1,
    gap: SPACING.xxs,
  },
  reviewPrice: {
    color: PALETTE.primary,
    fontWeight: '700',
    marginTop: SPACING.xxs,
  },
  reviewDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  reviewDetailItem: {
    width: '45%',
    gap: 2,
  },
  reviewPriceRangeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  publishButton: {
    marginTop: SPACING.md,
  },
  warningText: {
    color: PALETTE.warning,
    textAlign: 'center',
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  successTitle: {
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  successSubtitle: {
    textAlign: 'center',
    color: PALETTE.textSecondary,
    maxWidth: 320,
  },
  successCard: {
    width: '100%',
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  successThumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
  },
  successDetails: {
    flex: 1,
    gap: SPACING.xxs,
  },
  successMetaRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  successActions: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  fullButton: {
    width: '100%',
  },
});
