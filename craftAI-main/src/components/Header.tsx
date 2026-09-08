import React from 'react';
import { Sparkles, Globe, User as UserIcon, Volume2, VolumeX, LogOut } from 'lucide-react';
import { SupportedLanguage, UserRole } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../i18n/languages';
import { useTranslation } from '../i18n/translations';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  userRole: UserRole;
  userName: string;
  onSwitchRole: (newRole: UserRole) => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLang,
  userRole,
  userName,
  onSwitchRole,
  speechEnabled,
  onToggleSpeech,
  onLogout,
}) => {
  const t = useTranslation(currentLang);
  const langOpt = getLanguageOption(currentLang);

  return (
    <header className="sticky top-0 z-40 bg-[#16120f]/95 backdrop-blur-md border-b border-[#2d241e] text-stone-100 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Heritage Seal */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 border border-amber-500/40 flex items-center justify-center text-amber-200 font-bold shadow-md shadow-amber-950/60 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-amber-200 font-serif">
                Craft Mastery
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block font-sans font-medium tracking-wide">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Guidance Toggle */}
          <button
            id="header-toggle-speech-btn"
            onClick={onToggleSpeech}
            className={`p-2 rounded-xl text-xs font-medium border transition ${
              speechEnabled
                ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                : 'bg-[#221b16] border-[#382b22] text-stone-400 hover:text-stone-200 hover:border-stone-600'
            }`}
            title={speechEnabled ? 'Voice Guidance Active' : 'Voice Guidance Muted'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative group">
            <button
              id="header-lang-selector-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#221b16] hover:bg-[#2c231d] text-stone-200 border border-[#382b22] hover:border-amber-600/50 transition shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{langOpt.flag}</span>
              <span className="font-semibold text-amber-100">{langOpt.nativeName}</span>
            </button>

            {/* Language dropdown menu */}
            <div className="absolute right-0 mt-1.5 w-48 bg-[#1f1814] border border-[#3d2f25] rounded-2xl shadow-2xl py-1.5 hidden group-hover:block z-50">
              <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400/90 border-b border-[#33271f]">
                {t.selectLanguage}
              </div>
              <div className="max-h-60 overflow-y-auto pr-0.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onSelectLang(lang.code)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#2e231c] transition ${
                      currentLang === lang.code ? 'text-amber-300 font-bold bg-[#2a2019]' : 'text-stone-300'
                    }`}
                  >
                    <span>
                      {lang.flag} {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-[#221b16] p-1 rounded-xl border border-[#382b22] text-xs">
            <button
              id="header-role-artisan-btn"
              onClick={() => onSwitchRole('ARTISAN')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRole === 'ARTISAN'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t.roleArtisan}
            </button>
            <button
              id="header-role-customer-btn"
              onClick={() => onSwitchRole('CUSTOMER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRole === 'CUSTOMER'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t.roleCustomer}
            </button>
          </div>

          {/* Logout / Reset */}
          <button
            id="header-logout-btn"
            onClick={onLogout}
            className="p-2 rounded-xl bg-[#221b16] hover:bg-red-950/40 text-stone-400 hover:text-red-400 border border-[#382b22] transition"
            title="Reset / Switch Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
