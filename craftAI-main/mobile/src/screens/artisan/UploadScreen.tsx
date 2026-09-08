import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ImageAdapter, PickedImageResult } from '../../adapters/image';
import { ApiAdapter } from '../../adapters/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorState } from '../../components/ui/ErrorState';
import { SpeechAdapter } from '../../adapters/speech';

/** Compact native progress pills: done (amber fill) → current (outline) → upcoming (muted). */
const StepProgress: React.FC<{ currentIndex: number }> = ({ currentIndex }) => {
  const { t } = useLanguage();
  const steps = [t('stepCapture'), t('stepDescribe'), t('stepAiDraft')];
  return (
    <View style={styles.stepsRow} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length - 1, now: currentIndex }}>
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <React.Fragment key={label}>
            {i > 0 ? <View style={[styles.stepConnector, done && styles.stepConnectorDone]} /> : null}
            <View
              style={[styles.stepPill, current && styles.stepPillCurrent]}
              accessible
              accessibilityLabel={`Step ${i + 1} of ${steps.length}: ${label} — ${
                done ? 'complete' : current ? 'current step' : 'upcoming'
              }`}
            >
              <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                {done ? (
                  <Ionicons name="checkmark" size={12} color={PALETTE.textInverse} />
                ) : (
                  <Text style={[styles.stepDotText, current && styles.stepDotTextCurrent]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepPillLabel, current && styles.stepPillLabelCurrent]} numberOfLines={1}>
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

/** Structured, honest rendering of the existing extract-info API response. */
const ExtractionResult: React.FC<{ result: any; onRetry: () => void }> = ({ result, onRetry }) => {
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

export const UploadScreen: React.FC = () => {
  const { t, lang } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<PickedImageResult | null>(null);
  // The description starts empty — never prefilled with a sample/demo craft.
  const [voiceNote, setVoiceNote] = useState('');
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeakingDescription, setIsSpeakingDescription] = useState(false);

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

  const handleAnalyzeWithAi = async () => {
    setIsProcessing(true);
    try {
      const result = await ApiAdapter.extractCraftInfo(voiceNote, lang);
      setExtractionResult(result);
    } catch (err: any) {
      setExtractionResult({ error: err.message });
    } finally {
      setIsProcessing(false);
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

  const hasPhoto = Boolean(selectedImage?.uri);
  const currentIndex = hasPhoto ? (isProcessing || extractionResult ? 2 : 1) : 0;

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

        {/* Step indicator */}
        <View style={styles.stepsWrap}>
          <StepProgress currentIndex={currentIndex} />
        </View>

        {/* STEP 1 — CAPTURE */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>{t('step1Label')}</Text>
        <Card style={styles.stepCard}>
          {hasPhoto && selectedImage ? (
            <>
              <PhotoPreview uri={selectedImage.uri} />
              <View style={styles.photoStatusRow}>
                <Badge tone="success" label={t('photoAttached')} />
              </View>
              <Text style={TYPOGRAPHY.footnote}>
                {selectedImage.uri}
              </Text>
            </>
          ) : (
            <View style={styles.captureEmpty}>
              <View style={styles.captureIconCircle}>
                <Ionicons name="camera-outline" size={26} color={PALETTE.primaryLight} />
              </View>
              <Text style={TYPOGRAPHY.headline}>{t('captureTitle')}</Text>
              <Text style={TYPOGRAPHY.footnote}>{t('captureHint')}</Text>
            </View>
          )}

          <View style={styles.captureButtons}>
            <Button variant="secondary" title={t('cameraBtn')} onPress={handleCamera} style={styles.captureButton} accessibilityLabel={t('cameraBtn')} />
            <Button variant="secondary" title={t('galleryBtn')} onPress={handleGallery} style={styles.captureButton} accessibilityLabel={t('galleryBtn')} />
          </View>
        </Card>

        {/* STEP 2 — DESCRIBE */}
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
              style={[styles.voiceAction, (!voiceNote.trim() || isSpeakingDescription) && styles.voiceActionDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Listen to description"
            >
              <Ionicons name={isSpeakingDescription ? 'volume-high' : 'volume-medium-outline'} size={20} color={PALETTE.primaryLight} />
              <Text style={styles.voiceActionText}>Listen</Text>
            </Pressable>
          </View>
        </Card>

        {/* STEP 3 — AI DRAFT */}
        <Text style={[TYPOGRAPHY.caption, styles.stepLabel]}>{t('step3Label')}</Text>
        <Card style={styles.stepCard}>
          <View style={styles.aiHeaderRow}>
            <Badge tone="ai" label={t('aiAssisted')} />
          </View>

          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={PALETTE.aiAccent} />
              <Text style={TYPOGRAPHY.body}>{t('aiProcessing')}</Text>
            </View>
          ) : extractionResult ? (
            <ExtractionResult result={extractionResult} onRetry={handleAnalyzeWithAi} />
          ) : (
            <>
              <Text style={TYPOGRAPHY.body}>{t('aiIdle')}</Text>
              <Button
                title={t('extractBtn')}
                onPress={handleAnalyzeWithAi}
                disabled={isProcessing || !voiceNote.trim()}
                style={styles.aiButton}
                accessibilityLabel={t('extractBtn')}
              />
            </>
          )}
        </Card>

        {/* Honest foundation note */}
        <Text style={[TYPOGRAPHY.footnote, styles.foundationNote]}>{t('foundationNote')}</Text>
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
    paddingBottom: SPACING.xxl,
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
    width: 14,
    height: 2,
    backgroundColor: PALETTE.surfaceBorder,
    marginHorizontal: SPACING.xs,
  },
  stepConnectorDone: {
    backgroundColor: PALETTE.primary,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
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
    width: 18,
    height: 18,
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
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textMuted,
  },
  stepDotTextCurrent: {
    color: PALETTE.textInverse,
  },
  stepPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  stepPillLabelCurrent: {
    color: PALETTE.primaryLight,
  },
  stepLabel: {
    marginBottom: SPACING.sm,
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
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  foundationNote: {
    textAlign: 'center',
    color: PALETTE.textMuted,
  },
});