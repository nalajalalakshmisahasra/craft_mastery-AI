import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MapPin, Check, ArrowRight, Volume2, Heart, Award } from 'lucide-react';
import { SupportedLanguage, UserRole } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText, WELCOME_SPEECH_TEXTS } from '../utils/speech';

interface OnboardingModalProps {
  currentLang: SupportedLanguage;
  userRole: UserRole;
  userName: string;
  onComplete: (preferences: { craftSpecialty: string; location: string; voiceGuidance: boolean }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentLang,
  userRole,
  userName,
  onComplete,
}) => {
  const t = useTranslation(currentLang);

  const [craftSpecialty, setCraftSpecialty] = useState(
    userRole === 'ARTISAN' ? (currentLang === 'te' ? 'కొండపల్లి కొయ్య బొమ్మలు' : 'Kondapalli Wooden Toys') : ''
  );
  const [location, setLocation] = useState(
    currentLang === 'te' ? 'విజయవాడ, ఆంధ్రప్రదేశ్' : 'Vijayawada, Andhra Pradesh'
  );
  const [voiceGuidance, setVoiceGuidance] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voiceGuidance) {
      const completionText = userRole === 'ARTISAN'
        ? `${t.accountCreatedSuccess} ${t.artisanGreeting}`
        : `${t.accountCreatedSuccess} ${t.customerGreeting}`;
      speakText(completionText, currentLang);
    }
    onComplete({ craftSpecialty, location, voiceGuidance });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-[#191310] border border-[#382b22] rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-100 overflow-hidden relative"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-400 mb-3 shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-amber-200">
            {t.onboardingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {t.onboardingSubtitle} ({userName})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Craft Specialty / Interests */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
              {userRole === 'ARTISAN' ? <Award className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              <span>{userRole === 'ARTISAN' ? t.craftSpecialtyLabel : t.shoppingInterestsLabel}</span>
            </label>
            <input
              type="text"
              value={craftSpecialty}
              onChange={(e) => setCraftSpecialty(e.target.value)}
              placeholder={userRole === 'ARTISAN' ? t.craftSpecialtyPlaceholder : t.shoppingInterestsPlaceholder}
              className="w-full bg-[#120d0a] border border-[#3d2e23] rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{t.locationLabel}</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              className="w-full bg-[#120d0a] border border-[#3d2e23] rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {/* Voice Guidance Toggle */}
          <div className="p-4 rounded-xl bg-[#221a15] border border-[#382b22] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-200">
                  {t.voiceGuidanceLabel}
                </div>
                <div className="text-xs text-stone-400">
                  {t.voiceGuidanceDesc}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVoiceGuidance(!voiceGuidance)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                voiceGuidance ? 'bg-amber-600 justify-end' : 'bg-stone-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
            </button>
          </div>

          {/* Complete Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="onboarding-complete-btn"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <span>{t.onboardingCompleteBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
