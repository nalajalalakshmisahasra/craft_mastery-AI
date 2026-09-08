import { SupportedLanguage } from '../types';
import { getLanguageOption } from '../i18n/languages';

// Native welcome spoken messages for all 13 supported languages
export const WELCOME_SPEECH_TEXTS: Record<SupportedLanguage, string> = {
  te: 'క్రాఫ్ట్ మాస్టరీకి స్వాగతం! సంప్రదాయ హస్తకళల వేదిక.',
  hi: 'क्राफ्ट मास्टरी में आपका स्वागत है! पारंपरिक हस्तशिल्प का मंच।',
  en: 'Welcome to Craft Mastery! The multilingual platform for authentic handcrafted arts.',
  ta: 'கிராஃப்ட் மாஸ்டரிக்கு வரவேற்கிறோம்! பாரம்பரிய கைவினைப் பொருட்களின் தளம்.',
  kn: 'ಕ್ರಾಫ್ಟ್ ಮಾಸ್ಟರಿಗೆ ಸುಸ್ವಾಗತ! ಸಾಂಪ್ರದಾಯಿಕ ಕರಕುಶಲ ಕಲೆಗಳ ವೇದಿಕೆ.',
  mr: 'क्राफ्ट मास्टरीमध्ये आपले स्वागत आहे! पारंपारिक हस्तकलेचे व्यासपीठ.',
  bn: 'ক্রাফ্ট মাস্টারি-তে আপনাকে স্বাগতম! ঐতিহ্যবাহী হস্তশিল্পের প্ল্যাটফর্ম।',
  ml: 'ക്രാഫ്റ്റ് മാസ്റ്ററിയിലേക്ക് സ്വാഗതം! പരമ്പരാഗത കരകൗശല വസ്തുക്കളുടെ വേദി.',
  gu: 'ક્રાફ્ટ માસ્ટરીમાં આપનું સ્વાગત છે! પરંપરાગત હસ્તકલાનું મંચ.',
  pa: 'ਕ੍ਰਾਫਟ ਮਾਸਟਰੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਰਵਾਇਤੀ ਦਸਤਕਾਰੀ ਦਾ ਮੰਚ।',
  or: 'କ୍ରାଫ୍ଟ ମାଷ୍ଟରୀକୁ ସ୍ୱାଗତ! ପାରମ୍ପରିକ ହସ୍ତଶିଳ୍ପର ମଞ୍ଚ।',
  as: 'ক্ৰাফ্ট মাষ্টাৰীলৈ স্বাগতম! পৰম্পৰাগত হস্তশিল্পৰ মঞ্চ।',
  ur: 'کرافٹ ماسٹری میں خوش آمدید! روایتی دستکاریوں کا پلیٹ فارم۔',
};

// Native language changed spoken announcements
export const LANGUAGE_CHANGED_TEXTS: Record<SupportedLanguage, string> = {
  te: 'భాష తెలుగుగా మార్చబడింది.',
  hi: 'भाषा हिन्दी में बदल दी गई है।',
  en: 'Language changed to English.',
  ta: 'மொழி தமிழாக மாற்றப்பட்டது.',
  kn: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
  mr: 'भाषा मराठीत बदलली आहे.',
  bn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
  ml: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
  gu: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.',
  pa: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲ ਦਿੱਤੀ ਗਈ ਹੈ।',
  or: 'ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତିତ ହୋଇଛି।',
  as: 'ভাষা অসমীয়ালৈ সলনি কৰা হৈছে।',
  ur: 'زبان اردو میں تبدیل کر دی گئی ہے۔',
};

// Regional / Indic fallback mappings for voices
// If device does not have a native synthesizer installed for a regional language,
// fallback to a phonetically related Indic voice instead of defaulting blindly to English.
interface VoiceLocaleConfig {
  primary: string;
  locales: string[];
  nameKeywords: string[];
  fallbackLocales: string[];
}

export const LANGUAGE_VOICE_MAP: Record<SupportedLanguage, VoiceLocaleConfig> = {
  en: {
    primary: 'en-US',
    locales: ['en-US', 'en-IN', 'en-GB', 'en'],
    nameKeywords: ['english'],
    fallbackLocales: ['en-GB', 'en-IN'],
  },
  te: {
    primary: 'te-IN',
    locales: ['te-IN', 'te_IN', 'te'],
    nameKeywords: ['telugu', 'తెలుగు'],
    fallbackLocales: ['hi-IN', 'ta-IN', 'en-IN'],
  },
  hi: {
    primary: 'hi-IN',
    locales: ['hi-IN', 'hi_IN', 'hi'],
    nameKeywords: ['hindi', 'हिन्दी', 'हिंदी'],
    fallbackLocales: ['en-IN'],
  },
  ta: {
    primary: 'ta-IN',
    locales: ['ta-IN', 'ta_IN', 'ta-LK', 'ta-SG', 'ta'],
    nameKeywords: ['tamil', 'தமிழ்'],
    fallbackLocales: ['hi-IN', 'te-IN', 'en-IN'],
  },
  kn: {
    primary: 'kn-IN',
    locales: ['kn-IN', 'kn_IN', 'kn'],
    nameKeywords: ['kannada', 'ಕನ್ನಡ'],
    fallbackLocales: ['te-IN', 'hi-IN', 'ta-IN', 'en-IN'],
  },
  mr: {
    primary: 'mr-IN',
    locales: ['mr-IN', 'mr_IN', 'mr'],
    nameKeywords: ['marathi', 'मराठी'],
    fallbackLocales: ['hi-IN', 'en-IN'],
  },
  bn: {
    primary: 'bn-IN',
    locales: ['bn-IN', 'bn_IN', 'bn-BD', 'bn'],
    nameKeywords: ['bengali', 'bangla', 'বাংলা'],
    fallbackLocales: ['hi-IN', 'en-IN'],
  },
  ml: {
    primary: 'ml-IN',
    locales: ['ml-IN', 'ml_IN', 'ml'],
    nameKeywords: ['malayalam', 'മലയാളം'],
    fallbackLocales: ['ta-IN', 'te-IN', 'hi-IN', 'en-IN'],
  },
  gu: {
    primary: 'gu-IN',
    locales: ['gu-IN', 'gu_IN', 'gu'],
    nameKeywords: ['gujarati', 'ગુજરાતી'],
    fallbackLocales: ['hi-IN', 'en-IN'],
  },
  pa: {
    primary: 'pa-IN',
    locales: ['pa-IN', 'pa_IN', 'pa-PK', 'pa'],
    nameKeywords: ['punjabi', 'panjabi', 'ਪੰਜਾਬੀ'],
    fallbackLocales: ['hi-IN', 'ur-IN', 'en-IN'],
  },
  or: {
    primary: 'or-IN',
    locales: ['or-IN', 'or_IN', 'od-IN', 'or', 'od'],
    nameKeywords: ['odia', 'oriya', 'ଓଡ଼ିଆ'],
    fallbackLocales: ['bn-IN', 'hi-IN', 'en-IN'],
  },
  as: {
    primary: 'as-IN',
    locales: ['as-IN', 'as_IN', 'as'],
    nameKeywords: ['assamese', 'অসমীয়া'],
    fallbackLocales: ['bn-IN', 'hi-IN', 'en-IN'],
  },
  ur: {
    primary: 'ur-IN',
    locales: ['ur-IN', 'ur_IN', 'ur-PK', 'ur_PK', 'ur'],
    nameKeywords: ['urdu', 'اردو'],
    fallbackLocales: ['hi-IN', 'pa-IN', 'en-IN'],
  },
};

// Voice cache and listener
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesInitialized = false;

function initVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
  if (cachedVoices.length > 0) {
    voicesInitialized = true;
  }
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    voicesInitialized = true;
  };
}

if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * Find the best available SpeechSynthesisVoice for a target language.
 * Follows strict priority:
 * 1. Exact BCP-47 locale match (e.g. 'te-IN', 'ur-PK', 'bn-IN')
 * 2. Prefix / ISO language match (e.g. starts with 'te', 'ur', 'ta')
 * 3. Voice name match (e.g. voice named 'Google Telugu' or 'Urdu')
 * 4. Regional Indic fallback voice (e.g. 'hi-IN' for 'ur', 'bn-IN' for 'as')
 */
export function findMatchingVoice(lang: SupportedLanguage): {
  voice: SpeechSynthesisVoice | null;
  effectiveLocale: string;
  isFallback: boolean;
} {
  const config = LANGUAGE_VOICE_MAP[lang] || LANGUAGE_VOICE_MAP.en;
  const voices = cachedVoices.length > 0
    ? cachedVoices
    : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

  if (voices.length === 0) {
    return { voice: null, effectiveLocale: config.primary, isFallback: false };
  }

  // 1. Direct locale matches
  for (const loc of config.locales) {
    const locLower = loc.toLowerCase().replace('_', '-');
    const directMatch = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === locLower
    );
    if (directMatch) {
      return { voice: directMatch, effectiveLocale: directMatch.lang, isFallback: false };
    }
  }

  // 2. Prefix match (e.g. lang code 'te', 'ur', 'bn')
  const langPrefixMatch = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(lang.toLowerCase() + '-') || vLang === lang.toLowerCase();
  });
  if (langPrefixMatch) {
    return { voice: langPrefixMatch, effectiveLocale: langPrefixMatch.lang, isFallback: false };
  }

  // 3. Name keyword search
  for (const kw of config.nameKeywords) {
    const kwLower = kw.toLowerCase();
    const nameMatch = voices.find((v) => v.name.toLowerCase().includes(kwLower));
    if (nameMatch) {
      return { voice: nameMatch, effectiveLocale: nameMatch.lang, isFallback: false };
    }
  }

  // 4. Sensible regional Indic fallback voice
  for (const fallbackLoc of config.fallbackLocales) {
    const fbLower = fallbackLoc.toLowerCase().replace('_', '-');
    const fallbackMatch = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === fbLower
    );
    if (fallbackMatch) {
      return { voice: fallbackMatch, effectiveLocale: config.primary, isFallback: true };
    }
  }

  // If still no voice matched, leave voice null to allow browser default / cloud TTS
  return { voice: null, effectiveLocale: config.primary, isFallback: false };
}

// Speech Synthesis (Text to Speech)
export function speakText(
  text: string,
  lang: SupportedLanguage,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this environment');
    onEnd?.();
    return;
  }

  // Cancel any ongoing speech immediately to prevent overlaps or stale language
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) {
    onEnd?.();
    return;
  }

  const config = LANGUAGE_VOICE_MAP[lang] || LANGUAGE_VOICE_MAP.en;
  const langOpt = getLanguageOption(lang);
  const voiceResolution = findMatchingVoice(lang);

  const utterance = new SpeechSynthesisUtterance(text);
  // Always request the correct target language BCP-47 locale
  utterance.lang = config.primary || langOpt.speechCode;
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  if (voiceResolution.voice) {
    utterance.voice = voiceResolution.voice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn(
      `Speech synthesis error for language [${lang}] (locale: ${utterance.lang}):`,
      e
    );

    // If synthesis failed due to language-unavailable and no voice was set,
    // retry once with the regional Indic fallback voice if available
    if (e.error === 'language-unavailable' && !voiceResolution.voice) {
      const fallbackVoice = findMatchingVoice('hi').voice || findMatchingVoice('en').voice;
      if (fallbackVoice) {
        try {
          const retryUtterance = new SpeechSynthesisUtterance(text);
          retryUtterance.voice = fallbackVoice;
          retryUtterance.lang = fallbackVoice.lang;
          retryUtterance.rate = 0.9;
          retryUtterance.onend = onEnd;
          window.speechSynthesis.speak(retryUtterance);
          return;
        } catch (retryErr) {
          console.warn('Fallback speech retry error:', retryErr);
        }
      }
    }
    onEnd?.();
  };

  // Ensure speech is spoken immediately
  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('speechSynthesis.speak error:', err);
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Speech Recognition (Microphone Speech to Text)
interface SpeechRecognitionHandler {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(
  lang: SupportedLanguage,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void
): SpeechRecognitionHandler {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  const config = LANGUAGE_VOICE_MAP[lang] || LANGUAGE_VOICE_MAP.en;
  recognition.lang = config.primary;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    onError?.(event.error);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition already started or error:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    },
    isSupported: true,
  };
}
