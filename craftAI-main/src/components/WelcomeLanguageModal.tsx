import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Volume2 } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { useTranslation } from '../i18n/translations';
import { speakText, WELCOME_SPEECH_TEXTS } from '../utils/speech';

interface WelcomeLanguageModalProps {
  selectedLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  onContinue: () => void;
}

export const WelcomeLanguageModal: React.FC<WelcomeLanguageModalProps> = ({
  selectedLang,
  onSelectLang,
  onContinue,
}) => {
  const t = useTranslation(selectedLang);

  const handleLanguageClick = (code: SupportedLanguage) => {
    onSelectLang(code);
    speakText(WELCOME_SPEECH_TEXTS[code], code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-xl bg-[#191310] border border-[#382b22] rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-100 overflow-hidden relative"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600/30 via-amber-700/20 to-stone-900 border border-amber-500/40 text-amber-300 mb-3 shadow-lg shadow-amber-950/40">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-amber-200 tracking-tight">
            {t.welcomeTitle}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-md mx-auto leading-relaxed">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Language Selection Header */}
        <div className="mb-4 text-center relative z-10">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-amber-300 bg-[#251c17] px-3.5 py-1 rounded-full border border-amber-600/30">
            {t.selectLanguage}
          </span>
        </div>

        {/* 10 Languages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 my-4 relative z-10">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                onClick={() => handleLanguageClick(lang.code)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-950/70 to-[#2e1d13] border-amber-500 text-amber-200 ring-2 ring-amber-500/30 shadow-md'
                    : 'bg-[#221a15] border-[#382b22] text-stone-300 hover:bg-[#2b211a] hover:border-amber-700/40'
                }`}
              >
                <div className="truncate">
                  <div className="text-sm sm:text-base font-bold leading-tight font-serif flex items-center gap-1.5">
                    <span>{lang.nativeName}</span>
                    {isSelected && (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse inline" />
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {lang.name}
                  </div>
                </div>
                <span className="text-lg ml-1 shrink-0">{lang.flag}</span>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="mt-6 pt-4 border-t border-[#2d231d] relative z-10">
          <button
            id="welcome-continue-btn"
            onClick={onContinue}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <span>{t.continueBtn}</span>
            <ArrowRight className="w-4 h-4 text-stone-950" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
