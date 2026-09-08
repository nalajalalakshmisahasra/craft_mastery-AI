import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  MessageSquare, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Check, 
  ShieldCheck, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  Phone, 
  X, 
  RefreshCw,
  Info
} from 'lucide-react';
import { CraftProduct, SupportedLanguage } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText } from '../utils/speech';
import { getLocalizedProduct } from '../utils/productLocalization';
import { apiFetch } from '../utils/api';

interface CustomerProductDetailProps {
  product: CraftProduct;
  currentLang: SupportedLanguage;
  customerName: string;
  customerPhone: string;
  onBack: () => void;
  onSendInquiry: (
    productId: string,
    quantity: number,
    message: string,
    customerLang: SupportedLanguage
  ) => Promise<void>;
  speechEnabled: boolean;
}

export const CustomerProductDetail: React.FC<CustomerProductDetailProps> = ({
  product,
  currentLang,
  customerName,
  customerPhone,
  onBack,
  onSendInquiry,
  speechEnabled,
}) => {
  const t = useTranslation(currentLang);
  const loc = getLocalizedProduct(product, currentLang);

  // AI Assistant Drawer State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Inquiry / Bulk Order State
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(100);
  const [inquiryNote, setInquiryNote] = useState(
    currentLang === 'te'
      ? 'నమస్కారం! మీ చేతిపనితనం చాలా నచ్చింది. మా సంస్థ వేడుకల కోసం 100 ముక్కలు కావాలి. బల్క్ డిస్కౌంట్ ఇవ్వగలరా?'
      : 'Hello! I appreciate your authentic craftsmanship. We need 100 pieces for an upcoming event. Can you offer a bulk price?'
  );
  const [isInquirySending, setIsInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Ask AI about Ordering or Contacting the Artisan
  const handleAskAi = async (intent: 'ORDER_HELP' | 'ARTISAN_CONTACT' | 'BULK_HELP' | 'CUSTOM', customText?: string) => {
    setIsAiThinking(true);
    setIsAiModalOpen(true);

    try {
      const res = await apiFetch('/api/ai/order-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: loc.title,
          intent,
          customQuestion: customText || customQuestion,
          language: currentLang,
        }),
      });

      const data = await res.json();
      setAiResponse(data.guidance);

      if (speechEnabled) {
        speakText(data.guidance, currentLang);
      }
    } catch (err) {
      console.error('Error getting guidance:', err);
      setAiResponse(
        currentLang === 'te'
          ? 'మీరు నేరుగా ఆర్డర్ చేయవచ్చు లేదా బల్క్ అవసరాల కోసం ఆర్టిసాన్‌కు విచారణ పంపవచ్చు.'
          : 'You can order this craft directly or inquire with the artisan for bulk requirements.'
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  // Submit Inquiry / Bulk Order
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryNote.trim()) return;

    setIsInquirySending(true);
    try {
      await onSendInquiry(product.id, orderQuantity, inquiryNote, currentLang);
      setInquirySuccess(true);
      setTimeout(() => {
        setInquirySuccess(false);
        setIsInquiryModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to send inquiry:', err);
    } finally {
      setIsInquirySending(false);
    }
  };

  // Mic speech input for custom question
  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomQuestion(transcript);
        handleAskAi('CUSTOM', transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#221813] border border-[#382b22] text-xs font-bold text-amber-200 hover:bg-[#2c2018] transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backToMarketplaceBtn}</span>
      </button>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#1a1410] border border-[#382b22] rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Left: Enhanced High Resolution Image */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-[#120e0b] border border-[#382b22] h-80 sm:h-[420px]">
            <img
              src={product.enhancedImageUrl || product.originalImageUrl}
              alt={loc.title}
              className="w-full h-full object-contain p-3"
            />
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-amber-200 border border-amber-600/40 shadow">
              {loc.category}
            </div>
            <div className="absolute bottom-4 right-4 bg-emerald-950/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-300 border border-emerald-600/50 flex items-center gap-1.5 shadow">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.verifiedHandmadeBadge}</span>
            </div>
          </div>
        </div>

        {/* Right: Craft Specifications & Artisan Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{loc.region}</span>
              <span className="text-stone-500">•</span>
              <span>{t.handmadeBy}: <strong className="text-stone-100">{loc.artisanName}</strong></span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-100 leading-tight">
              {loc.title}
            </h1>

            <div className="mt-3.5 flex items-baseline gap-3">
              <span className="text-3xl font-bold font-serif text-amber-300">
                ₹{product.finalPrice.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                ({t.stockLabel} {product.stockQuantity} {t.piecesAvailable})
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-200 leading-relaxed bg-[#130d0a] p-4 sm:p-5 rounded-2xl border border-[#2d2017]">
            {loc.fullDescription || loc.shortDescription}
          </p>

          {/* Authentic Specifications Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#221813] border border-[#382b22]">
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">{t.materialLabel}</span>
              <span className="font-bold text-amber-200 mt-1 block">{loc.material}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#221813] border border-[#382b22]">
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">{t.techniqueLabel}</span>
              <span className="font-bold text-amber-200 mt-1 block">{loc.craftTechnique}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#221813] border border-[#382b22]">
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">{t.dimensionsLabel}</span>
              <span className="font-bold text-stone-200 mt-1 block">{loc.dimensions}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#221813] border border-[#382b22]">
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">{t.craftTimeLabel}</span>
              <span className="font-bold text-stone-200 mt-1 block">{loc.timeToMake}</span>
            </div>
          </div>

          {/* Contact / Inquire Action Buttons */}
          <div className="pt-3 border-t border-[#2d2017] flex flex-col sm:flex-row gap-3">
            <button
              id="product-contact-artisan-btn"
              onClick={() => setIsInquiryModalOpen(true)}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 text-sm transition active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.sendInquiryTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING PROMINENT "✨ ASK AI" BUTTON AT BOTTOM OF SCREEN */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#120d0a]/95 backdrop-blur-md border-t border-[#382b22] shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-200 block font-serif">
                {t.orderOrInquiryHelp}
              </span>
              <span className="text-[11px] text-stone-400">
                {t.askAiToOrderOrContact}
              </span>
            </div>
          </div>

          {/* Big Prominent Ask AI Trigger Button */}
          <button
            id="floating-ask-ai-btn"
            onClick={() => {
              setIsAiModalOpen(true);
              if (!aiResponse) {
                handleAskAi('ORDER_HELP');
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/70 flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t.askAiFloatingBtn}</span>
          </button>
        </div>
      </div>

      {/* AI GUIDANCE DRAWER / MODAL */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-2xl bg-[#191310] border border-[#382b22] sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 text-stone-100 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#382b22]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600/30 to-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-serif text-amber-200">
                      {t.aiAssistantTitle}
                    </h3>
                    <span className="text-[10px] text-stone-400">
                      {product.title}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-[#281e18] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick AI Action Chips */}
              <div className="flex flex-wrap gap-2">
                <button
                  id="ai-quick-how-to-order"
                  onClick={() => handleAskAi('ORDER_HELP')}
                  className="px-3.5 py-2 rounded-xl bg-[#241a14] hover:bg-[#2e2119] text-xs font-semibold text-amber-200 border border-[#3d2e24] transition flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.howToOrderQuestion}</span>
                </button>

                <button
                  id="ai-quick-contact-artisan"
                  onClick={() => handleAskAi('ARTISAN_CONTACT')}
                  className="px-3.5 py-2 rounded-xl bg-[#241a14] hover:bg-[#2e2119] text-xs font-semibold text-amber-200 border border-[#3d2e24] transition flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.contactArtisanQuestion}</span>
                </button>

                <button
                  id="ai-quick-bulk-inquiry"
                  onClick={() => handleAskAi('BULK_HELP')}
                  className="px-3.5 py-2 rounded-xl bg-[#241a14] hover:bg-[#2e2119] text-xs font-semibold text-amber-200 border border-[#3d2e24] transition flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.bulkPiecesInquiry}</span>
                </button>
              </div>

              {/* AI Guidance Answer Display */}
              <div className="p-4 rounded-2xl bg-[#120d0a] border border-[#382b22] min-h-[120px] space-y-3">
                {isAiThinking ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-amber-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.aiGuidanceThinking}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{t.aiRecommendationTitle}</span>
                      </span>
                      <button
                        onClick={() => speakText(aiResponse, currentLang)}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-300 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.listenBtn}</span>
                      </button>
                    </div>

                    <p className="text-sm text-stone-200 leading-relaxed font-medium">
                      {aiResponse || t.selectAProductPrompt}
                    </p>

                    {/* Action Shortcut to open Inquiry form */}
                    <div className="pt-2 border-t border-[#241a14] flex justify-end">
                      <button
                        onClick={() => {
                          setIsAiModalOpen(false);
                          setIsInquiryModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/50 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.sendBulkInquiryActionBtn}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Custom Question with Voice or Text */}
              <div className="pt-2 border-t border-[#382b22]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-3 rounded-xl border transition ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse border-red-500'
                        : 'bg-[#221813] border-[#382b22] text-amber-300 hover:bg-[#2d2019]'
                    }`}
                    title="Speak question"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi('CUSTOM')}
                    placeholder={t.askAiQuestionPlaceholder}
                    className="flex-1 px-4 py-2.5 bg-[#221813] border border-[#382b22] rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-stone-500"
                  />

                  <button
                    onClick={() => handleAskAi('CUSTOM')}
                    disabled={!customQuestion.trim() || isAiThinking}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs shadow transition"
                  >
                    {t.askBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMER INQUIRY / BULK ORDER MODAL (100 Pieces with Auto-Translation) */}
      <AnimatePresence>
        {isInquiryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#191310] border border-[#382b22] rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-100 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#382b22]">
                <div>
                  <h3 className="font-bold text-base font-serif text-amber-200">
                    {t.contactArtisanModalTitle}
                  </h3>
                  <span className="text-xs text-stone-300 font-medium">
                    {loc.title}
                  </span>
                </div>
                <button
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-[#281e18] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inquirySuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-400">
                    {t.inquirySentSuccess}
                  </h4>
                  <p className="text-xs text-stone-300 max-w-xs mx-auto">
                    {t.autoLiveTranslationDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  {/* Quantity selector (e.g. 100 products requested by user) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      {t.quantityNeeded}:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-32 px-4 py-2.5 bg-[#221813] border border-[#382b22] rounded-xl text-stone-100 font-bold font-serif text-base focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-stone-400">
                        {t.piecesAvailable}
                      </span>
                    </div>
                  </div>

                  {/* Customer Message in their preferred language */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      {t.replyInYourLang}:
                    </label>
                    <textarea
                      rows={4}
                      value={inquiryNote}
                      onChange={(e) => setInquiryNote(e.target.value)}
                      placeholder={t.inquiryMessagePlaceholder}
                      className="w-full p-3.5 bg-[#221813] border border-[#382b22] rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-stone-500"
                      required
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      {t.autoLiveTranslationDesc}
                    </span>
                  </div>

                  <button
                    id="submit-inquiry-btn"
                    type="submit"
                    disabled={isInquirySending}
                    className="w-full py-3.5 px-4 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 shadow-lg shadow-amber-950/60 transition flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
                  >
                    {isInquirySending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t.sendInquiryBtn}</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
