import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Sliders, 
  Phone, 
  Eye, 
  Volume2
} from 'lucide-react';
import { CraftProduct, SupportedLanguage, ArtisanStep, IncompleteInfoCheck } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText } from '../utils/speech';
import { enhanceCraftImage, EnhancementStats } from '../utils/imageEnhance';
import { apiFetch } from '../utils/api';

interface ArtisanUploadWizardProps {
  currentLang: SupportedLanguage;
  artisanName: string;
  artisanPhone: string;
  onComplete: (product: CraftProduct) => void;
  onCancel: () => void;
  speechEnabled: boolean;
}

// Sample craft images for quick testing
const getSamplePresets = (lang: SupportedLanguage) => [
  {
    name: lang === 'te' ? 'కొండపల్లి చెక్క బొమ్మ' : 'Kondapalli Wooden Doll',
    url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
    descriptionSample: lang === 'te' 
      ? 'ఇది చేతితో చేసిన కొండపల్లి చెక్క బొమ్మ. పొనికి చెక్కతో మరియు సహజ కూరగాయల రంగులతో 4 రోజులు కష్టపడి తయారు చేశాము. దీని ఎత్తు 10 అంగుళాలు.'
      : 'This is a handcrafted Kondapalli wooden doll made from Poniki softwood and natural vegetable dyes over 4 days. Height is 10 inches.',
  },
  {
    name: lang === 'te' ? 'బిద్రీ పాత్ర' : 'Bidriware Silver Inlay Vase',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
    descriptionSample: lang === 'te'
      ? 'ఇది జింక్ మరియు రాగి మిశ్రమంతో చేసిన ప్రాచీన బిద్రీ పాత్ర. దీనిపై స్వచ్ఛమైన వెండి తీగలతో చేతితో అందమైన పువ్వుల నమూనాలు పొదిగాము. బరువు 800 గ్రాములు.'
      : 'This is an authentic Bidriware vase cast from zinc and copper alloy with pure silver inlay wirework. Weighs 800 grams.',
  },
  {
    name: lang === 'te' ? 'కలంకారీ చేనేత వస్త్రం' : 'Kalamkari Hand Painted Fabric',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
    descriptionSample: lang === 'te'
      ? 'ఇది సహజసిద్ధమైన వెదురు కలంతో చేతితో చిత్రించిన పవిత్రమైన కలంకారీ చేనేత వస్త్రం. స్వచ్ఛమైన కాటన్ వస్త్రంపై దానిమ్మ తొక్క, నీలిమందు రంగులతో 10 రోజులు శ్రమించి గీశాను.'
      : 'This is a sacred Kalamkari textile hand-painted using natural bamboo pens and organic plant dyes onto pure handwoven cotton.',
  }
];

export const ArtisanUploadWizard: React.FC<ArtisanUploadWizardProps> = ({
  currentLang,
  artisanName,
  artisanPhone,
  onComplete,
  onCancel,
  speechEnabled,
}) => {
  const t = useTranslation(currentLang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Flow State
  const [step, setStep] = useState<ArtisanStep>('PHOTO_CAPTURE');

  // Step 1 & 2: Images
  const [originalImage, setOriginalImage] = useState<string>('');
  const [enhancedImage, setEnhancedImage] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementStats, setEnhancementStats] = useState<EnhancementStats | null>(null);
  const [showCompareMode, setShowCompareMode] = useState<'ENHANCED' | 'ORIGINAL' | 'SIDE_BY_SIDE'>('ENHANCED');

  // Step 3: Voice / Text info & Missing info detection
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isAnalyzingInfo, setIsAnalyzingInfo] = useState(false);
  const [incompleteCheck, setIncompleteCheck] = useState<IncompleteInfoCheck | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  // Step 4: AI Description & Pricing
  const [targetCustomerLang, setTargetCustomerLang] = useState<SupportedLanguage>('en');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedShortDesc, setGeneratedShortDesc] = useState('');
  const [generatedFullDesc, setGeneratedFullDesc] = useState('');
  
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [suggestedPriceMin, setSuggestedPriceMin] = useState(1200);
  const [suggestedPriceMax, setSuggestedPriceMax] = useState(1600);
  const [recommendedPrice, setRecommendedPrice] = useState(1350);
  const [finalPrice, setFinalPrice] = useState(1350);
  const [pricingReason, setPricingReason] = useState('');
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [isUsingCustomPrice, setIsUsingCustomPrice] = useState(false);

  // Step 5: Mobile Number & Contact details
  const [contactPhone, setContactPhone] = useState(artisanPhone || '+91 98480 12345');
  const [stockQuantity, setStockQuantity] = useState(15);
  const [isPublishing, setIsPublishing] = useState(false);

  // Speech guidance on step transition
  useEffect(() => {
    if (!speechEnabled) return;

    if (step === 'PHOTO_CAPTURE') {
      speakText(`${t.stepPhoto}: ${t.photoPrompt}`, currentLang);
    } else if (step === 'VOICE_INFO') {
      speakText(`${t.stepInfo}: ${t.voiceInfoPrompt}`, currentLang);
    } else if (step === 'PRICING') {
      speakText(`${t.stepPrice}: ${t.pricingExplanation}`, currentLang);
    }
  }, [step, currentLang, speechEnabled, t]);

  // Handler for Image Selection
  const handleSelectImage = async (imageSrc: string) => {
    setOriginalImage(imageSrc);
    setIsEnhancing(true);
    setStep('IMAGE_ENHANCE');

    try {
      const { enhancedDataUrl, stats } = await enhanceCraftImage(imageSrc);
      setEnhancedImage(enhancedDataUrl);
      setEnhancementStats(stats);
    } catch (err) {
      console.warn('Enhancement error, falling back to original:', err);
      setEnhancedImage(imageSrc);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      handleSelectImage(result);
    };
    reader.readAsDataURL(file);
  };

  // Handler for Voice Recording
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Voice transcription is not supported on this device. Please type the description below.');
      return;
    }

    try {
      setSpeechError('');
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = {
        te: 'te-IN',
        hi: 'hi-IN',
        en: 'en-IN',
        ta: 'ta-IN',
        kn: 'kn-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        ml: 'ml-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        as: 'as-IN',
        ur: 'ur-IN',
      };
      recognition.lang = langMap[currentLang] || 'te-IN';
      recognition.continuous = true;
      // Commit only final browser recognition results so interim updates cannot duplicate text.
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setVoiceTranscript((prev) => (prev ? prev + ' ' + current : current));
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error:', event.error);
        setSpeechError(
          event.error === 'not-allowed'
            ? 'Microphone permission was denied. Please allow microphone access or type the description.'
            : 'Voice transcription failed. Please try again or type the description.'
        );
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setSpeechError('Voice transcription could not start. Please type the description instead.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  // Analyze Product Information with Gemini
  const handleAnalyzeProductInfo = async () => {
    if (!voiceTranscript.trim()) return;

    setIsAnalyzingInfo(true);
    try {
      const combinedStatement = followUpAnswer
        ? `${voiceTranscript}. Additional clarification: ${followUpAnswer}`
        : voiceTranscript;

      const res = await apiFetch('/api/ai/extract-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: combinedStatement,
          language: currentLang,
          conversationHistory,
        }),
      });

      const data: IncompleteInfoCheck = await res.json();
      setIncompleteCheck(data);

      // If missing info, alert the artisan and speak the question
      if (!data.isComplete) {
        if (speechEnabled && data.followUpQuestion) {
          speakText(data.followUpQuestion, currentLang);
        }
      } else {
        // Information is complete! Move to AI Description and Pricing
        handleGenerateDescriptionAndPricing(data.extractedData);
      }
    } catch (err) {
      console.error('Error analyzing product info:', err);
    } finally {
      setIsAnalyzingInfo(false);
    }
  };

  // Submit answer to follow up question
  const handleSubmitFollowUp = async () => {
    if (!followUpAnswer.trim()) return;

    const newHistory = [
      ...conversationHistory,
      { role: 'assistant', content: incompleteCheck?.followUpQuestion || '' },
      { role: 'user', content: followUpAnswer },
    ];
    setConversationHistory(newHistory);
    setVoiceTranscript((prev) => `${prev}. ${followUpAnswer}`);
    setFollowUpAnswer('');

    // Re-check completeness
    handleAnalyzeProductInfo();
  };

  // Generate Professional Multilingual Description & AI Pricing
  const handleGenerateDescriptionAndPricing = async (extractedData: any) => {
    setIsGeneratingDesc(true);
    setIsGeneratingPrice(true);
    setStep('DESCRIPTION_GEN');

    try {
      // 1. Generate Description in target language (e.g. English or Hindi)
      const descRes = await apiFetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData: extractedData,
          artisanLanguage: currentLang,
          targetLanguage: targetCustomerLang,
        }),
      });
      const descData = await descRes.json();
      setGeneratedTitle(descData.title);
      setGeneratedShortDesc(descData.shortDescription);
      setGeneratedFullDesc(descData.fullDescription);

      // 2. Pricing Recommendation
      const priceRes = await apiFetch('/api/ai/pricing-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData: extractedData,
          language: currentLang,
        }),
      });
      const priceData = await priceRes.json();
      setSuggestedPriceMin(priceData.suggestedPriceMin);
      setSuggestedPriceMax(priceData.suggestedPriceMax);
      setRecommendedPrice(priceData.recommendedPrice);
      setFinalPrice(priceData.recommendedPrice);
      setPricingReason(priceData.pricingReason);

      setStep('PRICING');
    } catch (err) {
      console.error('Error generating description and pricing:', err);
      setStep('PRICING');
    } finally {
      setIsGeneratingDesc(false);
      setIsGeneratingPrice(false);
    }
  };

  // Final Publish Handler
  const handlePublish = async () => {
    setIsPublishing(true);

    const newProduct: CraftProduct = {
      id: `prod-${Date.now()}`,
      artisanId: 'art-001',
      artisanName: artisanName || 'రామయ్య ఆచారి (Ramayya)',
      artisanPhone: contactPhone,
      artisanLanguage: currentLang,
      title: generatedTitle || incompleteCheck?.extractedData?.productName || 'Handcrafted Masterpiece',
      shortDescription: generatedShortDesc || 'Authentic handmade craft made with traditional techniques.',
      fullDescription: generatedFullDesc || voiceTranscript,
      category: incompleteCheck?.extractedData?.category || 'Handicrafts',
      material: incompleteCheck?.extractedData?.material || 'Natural Handcrafted Materials',
      craftTechnique: incompleteCheck?.extractedData?.craftTechnique || 'Traditional Handcraft',
      dimensions: incompleteCheck?.extractedData?.dimensions || 'Approx 10-12 inches',
      weight: incompleteCheck?.extractedData?.weight || '500g',
      timeToMake: incompleteCheck?.extractedData?.timeToMake || '4-5 days',
      region: 'Andhra Pradesh / Telangana',
      originalImageUrl: originalImage,
      enhancedImageUrl: enhancedImage || originalImage,
      suggestedPriceMin,
      suggestedPriceMax,
      recommendedPrice,
      finalPrice: isUsingCustomPrice && customPriceInput ? Number(customPriceInput) : finalPrice,
      pricingReason,
      stockQuantity,
      status: 'PUBLISHED',
      customizationAvailable: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      // Confetti effect!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setStep('SUCCESS');
      setTimeout(() => {
        onComplete(newProduct);
      }, 2200);
    } catch (err) {
      console.error('Publish error:', err);
      onComplete(newProduct);
    } finally {
      setIsPublishing(false);
    }
  };

  // Step Progress Bar indicator
  const stepsList = [
    { key: 'PHOTO_CAPTURE', label: t.stepPhoto },
    { key: 'IMAGE_ENHANCE', label: t.stepEnhance },
    { key: 'VOICE_INFO', label: t.stepInfo },
    { key: 'PRICING', label: t.stepPrice },
    { key: 'PREVIEW', label: t.stepPublish },
  ];

  const currentStepIdx = Math.min(
    stepsList.findIndex((s) => s.key === step) !== -1
      ? stepsList.findIndex((s) => s.key === step)
      : step === 'DESCRIPTION_GEN'
      ? 3
      : step === 'CONTACT_VERIFY'
      ? 4
      : 0,
    4
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Header & Cancel */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2d231d] mb-6">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            {t.stepByStepUploadTitle}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
            {t.uploadProductBtn}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-200 hover:text-amber-100 bg-[#221813] border border-[#382b22] hover:bg-[#2c2018] transition shadow-sm"
        >
          {t.cancelBtn}
        </button>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#2d2017] -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${(currentStepIdx / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((st, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={st.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                      : isCurrent
                      ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 shadow-md font-bold'
                      : 'bg-[#221813] text-stone-400 border border-[#382b22]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 text-stone-950 stroke-[3]" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 transition ${
                    isCurrent ? 'text-amber-300 font-bold' : 'text-stone-400'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: PHOTO CAPTURE */}
      {step === 'PHOTO_CAPTURE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          <div className="text-center max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-500/40 text-amber-300 flex items-center justify-center mb-3 shadow-md">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-200 font-serif">
              {t.photoPrompt}
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              {t.photoOptimizedDesc}
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* Take Photo / Upload */}
            <button
              id="upload-btn-camera"
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-2xl border border-[#382b22] bg-[#221813] hover:bg-[#2a1e17] hover:border-amber-500/80 text-stone-100 flex flex-col items-center justify-center gap-2 transition group shadow-md"
            >
              <Camera className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-sm font-bold font-serif text-amber-200">{t.takePhotoBtn}</span>
              <span className="text-[11px] text-stone-400">{t.cameraOrGallery}</span>
            </button>

            {/* Gallery select */}
            <button
              id="upload-btn-gallery"
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-2xl border border-[#382b22] bg-[#221813] hover:bg-[#2a1e17] hover:border-amber-500/80 text-stone-100 flex flex-col items-center justify-center gap-2 transition group shadow-md"
            >
              <ImageIcon className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-sm font-bold font-serif text-amber-200">{t.chooseGalleryBtn}</span>
              <span className="text-[11px] text-stone-400">{t.fileUploadLabel}</span>
            </button>
          </div>

          {/* Preset Craft selection for instant testing */}
          <div className="pt-6 border-t border-[#2d231d]">
            <p className="text-xs font-semibold text-amber-300 mb-3 text-center uppercase tracking-wider">
              {t.sampleCraftPrompt}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {getSamplePresets(currentLang).map((preset, idx) => (
                <button
                  key={idx}
                  id={`preset-craft-${idx}`}
                  onClick={() => {
                    handleSelectImage(preset.url);
                    setVoiceTranscript(preset.descriptionSample);
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#221813] border border-[#382b22] hover:border-amber-500 text-left transition group shadow-sm"
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition border border-[#382b22]"
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-stone-200 truncate font-serif">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-amber-400 truncate font-semibold">
                      {t.choosePresetBtn}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: AI IMAGE ENHANCEMENT */}
      {step === 'IMAGE_ENHANCE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                <h3 className="text-lg sm:text-xl font-bold font-serif text-amber-200">
                  {isEnhancing ? t.enhancingTitle : t.enhancedSuccess}
                </h3>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                {t.photoOptimizedDesc}
              </p>
            </div>

            {/* View Switcher: Enhanced vs Original vs Side-by-side */}
            <div className="flex bg-[#120e0b] p-1 rounded-xl border border-[#382b22] text-xs font-semibold">
              <button
                onClick={() => setShowCompareMode('ENHANCED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  showCompareMode === 'ENHANCED' ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.enhancedLabel}
              </button>
              <button
                onClick={() => setShowCompareMode('ORIGINAL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  showCompareMode === 'ORIGINAL' ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.originalLabel}
              </button>
              <button
                onClick={() => setShowCompareMode('SIDE_BY_SIDE')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  showCompareMode === 'SIDE_BY_SIDE' ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {currentLang === 'te' ? 'పోల్చి చూడండి' : 'Side-by-Side'}
              </button>
            </div>
          </div>

          {/* Photo Display View */}
          <div className="relative rounded-2xl overflow-hidden bg-[#120e0b] border border-[#382b22] min-h-[340px] flex items-center justify-center">
            {isEnhancing ? (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm text-amber-200 font-medium font-serif">
                  {t.enhancingTitle}
                </p>
              </div>
            ) : showCompareMode === 'SIDE_BY_SIDE' ? (
              <div className="grid grid-cols-2 gap-2 w-full p-2">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-400 text-center uppercase tracking-wider">
                    {t.originalLabel}
                  </div>
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-72 object-cover rounded-xl border border-[#382b22]"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-amber-300 text-center uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.enhancedLabel}</span>
                  </div>
                  <img
                    src={enhancedImage || originalImage}
                    alt="Enhanced"
                    className="w-full h-72 object-cover rounded-xl border border-amber-600/40 ring-2 ring-amber-500/20"
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-80 sm:h-96">
                <img
                  src={showCompareMode === 'ENHANCED' ? (enhancedImage || originalImage) : originalImage}
                  alt="Product view"
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-amber-200 border border-amber-600/40">
                  {showCompareMode === 'ENHANCED' ? t.enhancedLabel : t.originalLabel}
                </div>
              </div>
            )}
          </div>

          {/* Enhancement Statistics Pills */}
          {enhancementStats && (
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-[#221813] border border-[#382b22] text-stone-300">
                <span className="text-[10px] text-stone-400 block uppercase tracking-wider">{currentLang === 'te' ? 'వెలుగు శాతం' : 'Brightness'}</span>
                <span className="font-bold text-amber-300 font-mono text-sm mt-0.5 block">{enhancementStats.brightnessBoost}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#221813] border border-[#382b22] text-stone-300">
                <span className="text-[10px] text-stone-400 block uppercase tracking-wider">{currentLang === 'te' ? 'కాంట్రాస్ట్ & స్పష్టత' : 'Contrast & Depth'}</span>
                <span className="font-bold text-amber-300 font-mono text-sm mt-0.5 block">{enhancementStats.contrastBoost}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#221813] border border-[#382b22] text-stone-300">
                <span className="text-[10px] text-stone-400 block uppercase tracking-wider">{currentLang === 'te' ? 'మార్కెట్‌ప్లేస్ క్లారిటీ' : 'Clarity Metric'}</span>
                <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{enhancementStats.clarityMetric}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2d231d] gap-3">
            <button
              onClick={() => setStep('PHOTO_CAPTURE')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#221813] border border-[#382b22] hover:bg-[#2c2018] text-amber-200 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.retakeBtn}</span>
            </button>

            <button
              id="btn-use-enhanced-photo"
              onClick={() => setStep('VOICE_INFO')}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center gap-2 transition active:scale-[0.98]"
            >
              <span>{t.useEnhancedBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: VOICE PRODUCT INFORMATION & MISSING INFO DETECTION */}
      {step === 'VOICE_INFO' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {/* AI Voice Question */}
          <div className="p-4 rounded-2xl bg-[#221813] border border-amber-600/40 flex items-start gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-serif">
                  AI Craft Assistant
                </span>
                <button
                  onClick={() => speakText(t.voiceInfoPrompt, currentLang)}
                  className="text-stone-400 hover:text-amber-300 transition"
                  title="Listen question"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-stone-200 mt-1 leading-relaxed">
                "{t.voiceInfoPrompt}"
              </p>
            </div>
          </div>

          {/* Big Voice Microphone Button */}
          <div className="text-center py-4">
            <button
              id="voice-mic-record-btn"
              onClick={toggleSpeechRecognition}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-950/60 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <div className="mt-3">
              <span className="text-xs font-bold text-amber-200 font-serif">
                {isListening ? t.listening : t.speakNowBtn}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {currentLang === 'te' ? 'దయచేసి స్పష్టంగా మాట్లాడండి' : 'Please speak clearly'}
              </p>
            </div>
            {speechError && (
              <p className="mt-2 text-xs text-red-300" role="alert">{speechError}</p>
            )}
          </div>

          {/* Transcript / Text Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              {t.orTypeHere}
            </label>
            <textarea
              id="voice-transcript-input"
              rows={4}
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              placeholder={currentLang === 'te' ? 'ఉదాహరణ: ఇది చేతితో చేసిన కొండపల్లి చెక్క బొమ్మ. పొనికి చెక్కతో తయారు చేశాను...' : 'e.g. Handcrafted wooden craft made with natural wood...'}
              className="w-full p-3.5 bg-[#221813] border border-[#382b22] rounded-2xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-stone-500"
            />
            <p className="mt-2 text-xs text-stone-500" aria-live="polite">
              {isListening ? 'Listening in the selected language...' : speechError || 'You can edit the transcription before continuing.'}
            </p>
          </div>

          {/* CRITICAL: INCOMPLETE INFORMATION ALERT & FOLLOW-UP QUESTIONS */}
          {incompleteCheck && !incompleteCheck.isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-[#2a170f] border border-amber-600/60 text-amber-200 space-y-3 shadow-lg"
            >
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-serif">{t.missingInfoAlert}</span>
              </div>

              <p className="text-sm text-stone-200 font-medium leading-relaxed bg-[#190e09] p-3.5 rounded-xl border border-amber-800/40">
                "{incompleteCheck.followUpQuestion}"
              </p>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1.5">
                  {t.moreInfoNeeded}:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder={currentLang === 'te' ? 'ఉదాహరణ: పొనికి చెక్క, ఎత్తు 12 అంగుళాలు, 4 రోజులు...' : 'e.g. Natural teak wood, 12 inches, 4 days work...'}
                    className="flex-1 px-3.5 py-2.5 bg-[#1e130e] border border-amber-700/60 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                  <button
                    id="submit-follow-up-btn"
                    onClick={handleSubmitFollowUp}
                    disabled={!followUpAnswer.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs shrink-0 transition"
                  >
                    {t.submitFollowUpBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2d231d]">
            <button
              onClick={() => setStep('IMAGE_ENHANCE')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#221813] border border-[#382b22] text-amber-200 hover:bg-[#2c2018] transition"
            >
              {t.backBtn}
            </button>

            <button
              id="analyze-craft-info-btn"
              onClick={handleAnalyzeProductInfo}
              disabled={isAnalyzingInfo || !voiceTranscript.trim()}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center gap-2 transition active:scale-[0.98]"
            >
              {isAnalyzingInfo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.aiGuidanceThinking}</span>
                </>
              ) : (
                <>
                  <span>{t.analyzeWithAiBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: DESCRIPTION & AI PRICING */}
      {step === 'PRICING' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {/* Multilingual Description Preview */}
          <div className="space-y-3 pb-6 border-b border-[#2d231d]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {t.descriptionTitle}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-amber-200 font-serif mt-0.5">
                  {generatedTitle || 'Handcrafted Artisan Craft'}
                </h3>
              </div>
              <span className="text-[10px] px-3 py-1 rounded-full bg-[#221813] text-amber-300 border border-[#382b22] font-medium">
                {t.targetLangNotice}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed bg-[#120e0b] p-4 rounded-2xl border border-[#2d2017]">
              {generatedFullDesc || generatedShortDesc}
            </p>
          </div>

          {/* AI PRICING RECOMMENDATION BOX */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#261810] via-[#1e140e] to-[#160e0a] border border-amber-600/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider font-serif">
                  {t.pricingTitle}
                </h4>
                <p className="text-xs text-stone-300">
                  {t.pricingExplanation}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Range */}
              <div className="p-4 rounded-xl bg-[#120e0b] border border-[#2d2017]">
                <span className="text-xs text-stone-400 block">{t.aiSuggestedRange}</span>
                <span className="text-xl font-bold font-serif text-stone-200 mt-1 block">
                  ₹{suggestedPriceMin.toLocaleString()} – ₹{suggestedPriceMax.toLocaleString()}
                </span>
              </div>

              {/* Suggested Price */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/40">
                <span className="text-xs text-amber-300 block font-semibold">{t.suggestedPrice}</span>
                <span className="text-2xl font-bold font-serif text-amber-300 mt-0.5 block">
                  ₹{recommendedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pricing Choice: Accept AI Price or Custom Price */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="pricing-accept-ai-btn"
                  onClick={() => {
                    setIsUsingCustomPrice(false);
                    setFinalPrice(recommendedPrice);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    !isUsingCustomPrice
                      ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md font-bold'
                      : 'bg-[#221813] border-[#382b22] text-stone-300 hover:bg-[#2c2018]'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t.acceptAiPriceBtn} (₹{recommendedPrice.toLocaleString()})</span>
                </button>

                <button
                  id="pricing-enter-custom-btn"
                  onClick={() => setIsUsingCustomPrice(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    isUsingCustomPrice
                      ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md font-bold'
                      : 'bg-[#221813] border-[#382b22] text-stone-300 hover:bg-[#2c2018]'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{t.enterCustomPriceBtn}</span>
                </button>
              </div>

              {/* Custom Price Input */}
              {isUsingCustomPrice && (
                <div className="p-3 bg-[#120e0b] rounded-xl border border-[#382b22] flex items-center gap-2">
                  <span className="text-sm text-amber-400 font-bold">₹</span>
                  <input
                    id="custom-price-input"
                    type="number"
                    value={customPriceInput}
                    onChange={(e) => {
                      setCustomPriceInput(e.target.value);
                      setFinalPrice(Number(e.target.value));
                    }}
                    placeholder={t.customPricePlaceholder}
                    className="w-full bg-transparent text-amber-200 text-sm focus:outline-none font-serif font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Mobile Number Verification */}
          <div className="p-4 rounded-2xl bg-[#221813] border border-[#382b22] space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200 font-serif">
                {t.mobileVerifyTitle}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {t.mobileConfirmDesc}
            </p>
            <input
              id="artisan-contact-phone-input"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full p-2.5 bg-[#120e0b] border border-[#382b22] rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2d231d]">
            <button
              onClick={() => setStep('VOICE_INFO')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#221813] border border-[#382b22] text-amber-200 hover:bg-[#2c2018] transition"
            >
              {t.backBtn}
            </button>

            <button
              id="pricing-continue-preview-btn"
              onClick={() => setStep('PREVIEW')}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center gap-2 transition active:scale-[0.98]"
            >
              <span>{t.previewBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: FINAL PREVIEW & PUBLISH */}
      {step === 'PREVIEW' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {t.liveListingBadge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-amber-200">
                {t.previewTitle}
              </h3>
            </div>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/40">
              {t.verifiedHandmadeBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enhanced Image */}
            <div className="rounded-2xl overflow-hidden bg-[#120e0b] border border-[#382b22] h-80">
              <img
                src={enhancedImage || originalImage}
                alt="Craft Preview"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Metadata Summary */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide font-serif">
                  {incompleteCheck?.extractedData?.category || 'Handicraft'}
                </span>
                <h4 className="text-lg font-bold text-amber-200 font-serif leading-snug mt-0.5">
                  {generatedTitle || 'Handcrafted Masterpiece'}
                </h4>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-serif text-amber-300">
                  ₹{finalPrice.toLocaleString()}
                </span>
                <span className="text-xs text-stone-400">
                  ({t.stockLabel} {stockQuantity} {t.piecesAvailable})
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed bg-[#120e0b] p-3.5 rounded-2xl border border-[#2d2017]">
                {generatedShortDesc || generatedFullDesc}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#221813] border border-[#382b22]">
                  <span className="text-[10px] text-stone-400 block uppercase tracking-wider">{t.materialLabel}:</span>
                  <span className="font-semibold text-stone-200 mt-0.5 block">
                    {incompleteCheck?.extractedData?.material || 'Natural Handcrafted Materials'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#221813] border border-[#382b22]">
                  <span className="text-[10px] text-stone-400 block uppercase tracking-wider">{t.handmadeBy}:</span>
                  <span className="font-semibold text-stone-200 mt-0.5 block">
                    {artisanName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2d231d]">
            <button
              onClick={() => setStep('PRICING')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#221813] border border-[#382b22] text-amber-200 hover:bg-[#2c2018] transition"
            >
              {t.backBtn}
            </button>

            <button
              id="publish-final-product-btn"
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-8 py-3.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center gap-2 transition active:scale-[0.98]"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{currentLang === 'te' ? 'ప్రచురిస్తోంది...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.publishProductBtn}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 6: SUCCESS CELEBRATION */}
      {step === 'SUCCESS' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1410] border border-amber-600/50 rounded-3xl p-8 text-center space-y-4 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-bold font-serif text-amber-200">
            {t.congratulations}!
          </h3>
          <p className="text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
            {t.productPublishedDesc}
          </p>
        </motion.div>
      )}
    </div>
  );
};
