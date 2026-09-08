import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Volume2, 
  Mic, 
  MicOff, 
  CheckCheck, 
  Clock, 
  RefreshCw, 
  Package, 
  User as UserIcon,
  ArrowLeft
} from 'lucide-react';
import { ProductInquiry, SupportedLanguage } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText } from '../utils/speech';

interface ArtisanMessagesProps {
  currentLang: SupportedLanguage;
  inquiries: ProductInquiry[];
  onReplyMessage: (inquiryId: string, replyText: string, originalLang: SupportedLanguage) => Promise<void>;
  onBack: () => void;
  speechEnabled: boolean;
}

export const ArtisanMessages: React.FC<ArtisanMessagesProps> = ({
  currentLang,
  inquiries,
  onReplyMessage,
  onBack,
  speechEnabled,
}) => {
  const t = useTranslation(currentLang);

  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(
    inquiries[0]?.id || ''
  );
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const selectedInquiry = inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedInquiry) return;

    setIsSending(true);
    try {
      await onReplyMessage(selectedInquiry.id, replyText, currentLang);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Microphone input is not supported in this browser. Please type your reply.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setReplyText((prev) => (prev ? prev + ' ' + current : current));
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2d231d] mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#221813] border border-[#382b22] text-amber-200 hover:bg-[#2c2018] transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200 flex items-center gap-2">
              <span>{t.inboxTitle}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-600/20 text-amber-300 border border-amber-600/40 font-sans font-medium">
                {t.aiTranslationBadge}
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {t.autoLiveTranslationDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Inbox Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Inquiries List */}
        <div className="bg-[#1a1410] border border-[#382b22] rounded-3xl p-4 space-y-3 h-[580px] overflow-y-auto shadow-xl">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest px-1">
            {t.inquiriesStatLabel} ({inquiries.length})
          </h3>

          {inquiries.map((inq) => {
            const isSelected = inq.id === selectedInquiryId;
            return (
              <button
                key={inq.id}
                onClick={() => setSelectedInquiryId(inq.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#281b13] border-amber-500 shadow-lg ring-1 ring-amber-500/30'
                    : 'bg-[#221813] border-[#382b22] hover:bg-[#2a1e17] text-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-bold text-xs font-serif text-stone-100 truncate">
                    {inq.customerName}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    {inq.requestedQuantity} {t.piecesAvailable}
                  </span>
                </div>

                <div className="text-[11px] text-stone-400 line-clamp-1">
                  {inq.productTitle}
                </div>

                <p className="text-xs text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                  {inq.messages[inq.messages.length - 1]?.translatedText ||
                    inq.messages[0]?.translatedText}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Active Conversation Thread */}
        <div className="md:col-span-2 bg-[#1a1410] border border-[#382b22] rounded-3xl p-5 sm:p-6 flex flex-col justify-between h-[580px] shadow-xl">
          {selectedInquiry ? (
            <>
              {/* Thread Header with Craft Summary */}
              <div className="pb-4 border-b border-[#2d231d] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedInquiry.productImage}
                    alt={selectedInquiry.productTitle}
                    className="w-12 h-12 rounded-xl object-cover border border-[#382b22]"
                  />
                  <div>
                    <h4 className="font-bold font-serif text-sm text-stone-100 truncate max-w-sm">
                      {selectedInquiry.customerName}
                    </h4>
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.bulkBadge}: {selectedInquiry.requestedQuantity} {t.piecesAvailable}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">{t.phoneNumber}:</span>
                  <span className="text-xs font-mono text-amber-200">
                    {selectedInquiry.customerPhone}
                  </span>
                </div>
              </div>

              {/* Message Bubbles Scroll Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {selectedInquiry.messages.map((msg) => {
                  const isArtisan = msg.senderRole === 'ARTISAN';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isArtisan ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-sm shadow-md ${
                          isArtisan
                            ? 'bg-amber-600 text-stone-950 rounded-br-none font-medium'
                            : 'bg-[#221813] text-stone-100 border border-[#382b22] rounded-bl-none'
                        }`}
                      >
                        {/* Sender Label */}
                        <div className="flex items-center justify-between gap-2 text-[11px] opacity-80 pb-1 border-b border-black/10 dark:border-white/10">
                          <span className="font-bold">{msg.senderName}</span>
                          <span className="text-[10px]">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Customer Message Display */}
                        {!isArtisan ? (
                          <>
                            {/* Translated text prominently */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{t.translatedToYourLang}</span>
                              </span>
                              <p className="text-sm font-medium leading-relaxed text-stone-100">
                                {msg.translatedText}
                              </p>
                            </div>

                            {/* Listen Button */}
                            <button
                              onClick={() => speakText(msg.translatedText, currentLang)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#140e0b] hover:bg-[#281b13] text-amber-300 text-xs transition border border-[#382b22]"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{t.listenAudioBtn}</span>
                            </button>

                            {/* Original customer English text */}
                            <div className="pt-2 border-t border-[#2d231d] text-xs text-stone-400">
                              <span className="text-[10px] block font-medium opacity-75">
                                {t.originalMessageLabel} ({msg.originalLang}):
                              </span>
                              <p className="italic">{msg.originalText}</p>
                            </div>
                          </>
                        ) : (
                          /* Artisan Response Display */
                          <div className="space-y-1">
                            <p className="leading-relaxed font-semibold">{msg.originalText}</p>
                            <div className="text-[11px] opacity-85 pt-1 border-t border-stone-900/20 italic">
                              <span className="text-[10px] uppercase tracking-wide block font-bold">
                                {t.translatedMessageLabel}:
                              </span>
                              "{msg.translatedText}"
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-[#2d231d]">
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.replyInYourLang}
                </label>
                <div className="flex gap-2">
                  {/* Microphone speech toggle */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-3 rounded-xl border transition ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse border-red-500'
                        : 'bg-[#221813] border-[#382b22] text-amber-300 hover:bg-[#2c2018]'
                    }`}
                    title={isListening ? 'Stop recording' : 'Speak reply in your language'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={currentLang === 'te' ? 'ఉదాహరణ: 100 పీసులకు ఒక్కోదానికి ₹1050 కి ఇవ్వగలను...' : 'e.g. For 100 pieces, I can offer ₹1050 per piece...'}
                    className="flex-1 px-4 py-2.5 bg-[#221813] border border-[#382b22] rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-stone-500"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 shadow-md transition flex items-center gap-2 shrink-0 text-xs active:scale-[0.98]"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t.sendReplyBtn}</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-20 text-stone-400">
              <MessageSquare className="w-10 h-10 mx-auto opacity-40 mb-2 text-amber-400" />
              <p>{currentLang === 'te' ? 'ఎలాంటి విచారణలు లేవు' : 'No inquiries found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
