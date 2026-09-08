import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Phone,
  ShieldCheck,
  Palette,
  ShoppingBag,
  ArrowRight,
  Check,
  CheckCircle2,
  User,
} from 'lucide-react';
import { SupportedLanguage, UserRole } from '../types';
import { useTranslation } from '../i18n/translations';

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

import { auth } from '../firebase';

interface AuthModalProps {
  currentLang: SupportedLanguage;
  onSuccess: (role: UserRole, phone: string, name: string) => void;
}

interface RegisteredAccount {
  phone: string;
  name: string;
  role: UserRole;
}

const DEV_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

export const AuthModal: React.FC<AuthModalProps> = ({
  currentLang,
  onSuccess,
}) => {
  const t = useTranslation(currentLang);

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [role, setRole] = useState<UserRole>('ARTISAN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotification, setSuccessNotification] = useState('');

  // Firebase Phone Authentication
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const confirmationResult = useRef<ConfirmationResult | null>(null);

  // Existing demo/local accounts
  const [registeredAccounts, setRegisteredAccounts] = useState<
    Record<string, RegisteredAccount>
  >({
    '9848012345': {
      phone: '9848012345',
      name: currentLang === 'te' ? 'రామయ్య ఆచారి' : 'Ramayya Achari',
      role: 'ARTISAN',
    },
    '9820044556': {
      phone: '9820044556',
      name: currentLang === 'te' ? 'విక్రమ్ శర్మ' : 'Vikram Sharma',
      role: 'CUSTOMER',
    },
  });

  // ─────────────────────────────────────────────
  // PHONE NUMBER CHANGE
  // ─────────────────────────────────────────────
  const handlePhoneChange = (val: string) => {
    const cleanPhone = val.replace(/\D/g, '').slice(0, 10);

    setPhoneNumber(cleanPhone);
    setErrorMessage('');

    // Auto-detect role for existing users
    if (mode === 'LOGIN' && registeredAccounts[cleanPhone]) {
      setRole(registeredAccounts[cleanPhone].role);
    }
  };

  // ─────────────────────────────────────────────
  // SEND FIREBASE OTP
  // ─────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length !== 10) {
      setErrorMessage(
        currentLang === 'te'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి'
          : currentLang === 'hi'
          ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    if (mode === 'REGISTER' && !userName.trim()) {
      setErrorMessage(
        currentLang === 'te'
          ? 'దయచేసి మీ పేరు లేదా స్టూడియో పేరును నమోదు చేయండి'
          : currentLang === 'hi'
          ? 'कृपया अपना नाम या स्टूडियो नाम दर्ज करें'
          : 'Please enter your name or studio name'
      );
      return;
    }

    try {
      setErrorMessage('');

      const fullPhoneNumber = `+91${phoneNumber}`;

      // Create reCAPTCHA
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'normal',
          }
        );
      }

      // Send real SMS OTP
      const result = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier.current
      );

      // Save Firebase confirmation object
      confirmationResult.current = result;

      // Show OTP screen
      setOtpSent(true);
      setOtp('');
    } catch (error: unknown) {
      console.error('Firebase OTP sending error:', error);

      let firebaseCode = '';

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error
      ) {
        firebaseCode = String(
          (error as { code?: unknown }).code ?? ''
        );
      }

      setErrorMessage(
        firebaseCode
          ? `Firebase Error: ${firebaseCode}`
          : 'Failed to send OTP. Please try again.'
      );

      // Reset reCAPTCHA
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    }
  };

  // ─────────────────────────────────────────────
  // VERIFY FIREBASE OTP
  // ─────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setErrorMessage(
        currentLang === 'te'
          ? 'దయచేసి 6 అంకెల OTP నమోదు చేయండి'
          : currentLang === 'hi'
          ? 'कृपया 6 अंकों का OTP दर्ज करें'
          : 'Please enter the 6-digit OTP'
      );
      return;
    }

    if (!confirmationResult.current) {
      setErrorMessage(
        currentLang === 'te'
          ? 'OTP సెషన్ కనుగొనబడలేదు. మళ్లీ OTP పంపండి.'
          : currentLang === 'hi'
          ? 'OTP सत्र नहीं मिला। कृपया OTP फिर से भेजें।'
          : 'OTP session not found. Please request a new OTP.'
      );
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');

      // Firebase verifies the real OTP
      const result = await confirmationResult.current.confirm(otp);

      console.log(
        'Firebase phone verification successful:',
        result.user.uid
      );

      setIsVerifying(false);

      // ─────────────────────────────────────────
      // REGISTER
      // ─────────────────────────────────────────
      if (mode === 'REGISTER') {
        const fallbackName =
          role === 'ARTISAN'
            ? currentLang === 'te'
              ? 'రామయ్య ఆచారి'
              : 'Ramayya Achari'
            : currentLang === 'te'
            ? 'విక్రమ్ శర్మ'
            : 'Vikram Sharma';

        const finalName = userName.trim() || fallbackName;

        const newAccount: RegisteredAccount = {
          phone: phoneNumber,
          name: finalName,
          role: role,
        };

        setRegisteredAccounts((prev) => ({
          ...prev,
          [phoneNumber]: newAccount,
        }));

        // Move to login after successful registration
        setMode('LOGIN');
        setOtpSent(false);
        setOtp('');
        setErrorMessage('');
        setSuccessNotification(t.accountCreatedSuccess);

        confirmationResult.current = null;

        return;
      }

      // ─────────────────────────────────────────
      // LOGIN
      // ─────────────────────────────────────────
      const existing = registeredAccounts[phoneNumber];

      const finalRole = existing?.role || role;

      const fallbackName =
        role === 'ARTISAN'
          ? currentLang === 'te'
            ? 'రామయ్య ఆచారి'
            : 'Ramayya Achari'
          : currentLang === 'te'
          ? 'విక్రమ్ శర్మ'
          : 'Vikram Sharma';

      const finalName =
        existing?.name || userName || fallbackName;

      confirmationResult.current = null;

      // Continue with existing app flow
      onSuccess(finalRole, phoneNumber, finalName);
    } catch (error: unknown) {
      console.error('Firebase OTP verification error:', error);

      setIsVerifying(false);

      let firebaseCode = '';

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error
      ) {
        firebaseCode = String(
          (error as { code?: unknown }).code ?? ''
        );
      }

      setErrorMessage(
        firebaseCode
          ? `Firebase Error: ${firebaseCode}`
          : currentLang === 'te'
          ? 'చెల్లని OTP. దయచేసి సరైన OTP నమోదు చేయండి.'
          : currentLang === 'hi'
          ? 'अमान्य OTP। कृपया सही OTP दर्ज करें।'
          : 'Invalid OTP. Please enter the correct OTP.'
      );
    }
  };

  // ─────────────────────────────────────────────
  // QUICK DEMO LOGIN
  // ─────────────────────────────────────────────
  const handleQuickDemo = (demoRole: UserRole) => {
    const demoPhone =
      demoRole === 'ARTISAN'
        ? '+91 98480 12345'
        : '+91 98200 44556';

    const demoName =
      demoRole === 'ARTISAN'
        ? currentLang === 'te'
          ? 'రామయ్య ఆచారి'
          : 'Ramayya Achari'
        : currentLang === 'te'
        ? 'విక్రమ్ శర్మ'
        : 'Vikram Sharma';

    onSuccess(demoRole, demoPhone, demoName);
  };

  // ─────────────────────────────────────────────
  // SWITCH LOGIN / REGISTER
  // ─────────────────────────────────────────────
  const switchMode = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    setOtpSent(false);
    setOtp('');
    setErrorMessage('');
    setSuccessNotification('');

    confirmationResult.current = null;

    if (recaptchaVerifier.current) {
      recaptchaVerifier.current.clear();
      recaptchaVerifier.current = null;
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#191310] border border-[#382b22] rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-100 relative overflow-hidden"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-600/30 via-amber-700/20 to-stone-900 border border-amber-500/40 text-amber-300 mb-2 shadow-lg shadow-amber-950/40">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200 tracking-tight">
            {mode === 'REGISTER'
              ? t.registerTitle
              : t.loginTitle}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-sm mx-auto leading-relaxed">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Login / Register Tabs */}
        <div className="flex bg-[#221a15] p-1 rounded-xl border border-[#382b22] mb-5 relative z-10">
          <button
            type="button"
            id="auth-tab-register"
            onClick={() => switchMode('REGISTER')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'REGISTER'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.registerTitle}
          </button>

          <button
            type="button"
            id="auth-tab-login"
            onClick={() => switchMode('LOGIN')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'LOGIN'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.loginTitle}
          </button>
        </div>

        {/* Success Banner */}
        {successNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/30 relative z-10"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />

            <span className="font-medium">
              {successNotification}
            </span>
          </motion.div>
        )}

        {/* Role Selection */}
        <div className="mb-5 relative z-10">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
            {t.whoAreYou}
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* Artisan */}
            <button
              type="button"
              id="auth-role-artisan"
              onClick={() => setRole('ARTISAN')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                role === 'ARTISAN'
                  ? 'bg-gradient-to-br from-amber-950/70 to-[#2e1d13] border-amber-500 ring-2 ring-amber-500/30 text-amber-200 shadow-md'
                  : 'bg-[#221a15] border-[#382b22] text-stone-300 hover:bg-[#2a2019]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Palette className="w-5 h-5 text-amber-400" />

                {role === 'ARTISAN' && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </div>

              <div className="text-sm font-bold font-serif text-stone-100">
                {t.roleArtisan}
              </div>

              <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                {t.roleArtisanDesc}
              </div>
            </button>

            {/* Customer */}
            <button
              type="button"
              id="auth-role-customer"
              onClick={() => setRole('CUSTOMER')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                role === 'CUSTOMER'
                  ? 'bg-gradient-to-br from-amber-950/70 to-[#2e1d13] border-amber-500 ring-2 ring-amber-500/30 text-amber-200 shadow-md'
                  : 'bg-[#221a15] border-[#382b22] text-stone-300 hover:bg-[#2a2019]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />

                {role === 'CUSTOMER' && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </div>

              <div className="text-sm font-bold font-serif text-stone-100">
                {t.roleCustomer}
              </div>

              <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                {t.roleCustomerDesc}
              </div>
            </button>
          </div>
        </div>

        {/* Firebase reCAPTCHA */}
        <div
          id="recaptcha-container"
          className="flex justify-center mb-3 relative z-10"
        />

        {/* Phone Form */}
        {!otpSent ? (
          <form
            onSubmit={handleSendOtp}
            className="space-y-4 relative z-10"
          >
            {/* Full Name - Register */}
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.fullNameLabel}
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-stone-400">
                    <User className="w-4 h-4" />
                  </span>

                  <input
                    id="auth-name-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={
                      role === 'ARTISAN'
                        ? currentLang === 'te'
                          ? 'రామయ్య ఆచారి'
                          : 'Ramayya Achari'
                        : currentLang === 'te'
                        ? 'విక్రమ్ శర్మ'
                        : 'Vikram Sharma'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-[#221a15] border border-[#382b22] rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t.phoneNumber}
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-amber-400 font-semibold">
                  +91
                </span>

                <input
                  id="auth-phone-input"
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value)
                  }
                  placeholder="98480 12345"
                  className="w-full pl-12 pr-4 py-2.5 bg-[#221a15] border border-[#382b22] rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <p className="text-xs text-red-400 font-medium">
                {errorMessage}
              </p>
            )}

            {/* Send OTP */}
            <button
              id="auth-send-otp-btn"
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 shadow-xl shadow-amber-950/60 transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Phone className="w-4 h-4" />

              <span>{t.sendOtp}</span>
            </button>
          </form>
        ) : (
          /* OTP Form */
          <form
            onSubmit={handleVerifyOtp}
            className="space-y-4 relative z-10"
          >
            {/* OTP Sent */}
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-700/50 text-xs text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />

              <span>{t.otpSentSuccess}</span>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t.enterOtp}
              </label>

              <input
                id="auth-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                placeholder="Enter OTP"
                className="w-full px-4 py-3 bg-[#221a15] border border-[#382b22] rounded-xl text-stone-100 text-center text-xl tracking-widest font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                maxLength={6}
                required
              />
            </div>

            {/* Error */}
            {errorMessage && (
              <p className="text-xs text-red-400 font-medium">
                {errorMessage}
              </p>
            )}

            {/* Verify */}
            <button
              id="auth-verify-otp-btn"
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 shadow-xl shadow-amber-950/60 transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>
                {isVerifying
                  ? currentLang === 'te'
                    ? 'ధృవీకరిస్తోంది...'
                    : 'Verifying...'
                  : mode === 'REGISTER'
                  ? t.createAccountBtn
                  : t.logInBtn}
              </span>

              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Edit Phone */}
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setErrorMessage('');
                confirmationResult.current = null;

                if (recaptchaVerifier.current) {
                  recaptchaVerifier.current.clear();
                  recaptchaVerifier.current = null;
                }
              }}
              className="w-full text-center text-xs text-stone-400 hover:text-stone-200 transition py-1"
            >
              ← {t.editPhoneBtn}
            </button>
          </form>
        )}

        {/* Login / Register Toggle */}
        <div className="mt-4 text-center relative z-10">
          {mode === 'REGISTER' ? (
            <button
              type="button"
              id="auth-switch-to-login"
              onClick={() => switchMode('LOGIN')}
              className="text-xs text-amber-400/90 hover:text-amber-300 transition underline underline-offset-2"
            >
              {t.alreadyHaveAccount}
            </button>
          ) : (
            <button
              type="button"
              id="auth-switch-to-register"
              onClick={() => switchMode('REGISTER')}
              className="text-xs text-amber-400/90 hover:text-amber-300 transition underline underline-offset-2"
            >
              {t.dontHaveAccount}
            </button>
          )}
        </div>

        {/* Quick Demo Login: development-only and explicitly enabled. */}
        {DEV_AUTH_ENABLED ? <div className="mt-5 pt-4 border-t border-[#2d231d] text-center relative z-10">
          <p className="text-[11px] text-stone-400 mb-2">
            {t.quickTestLogin}:
          </p>

          <div className="flex gap-2 justify-center">
            <button
              id="demo-login-artisan"
              onClick={() => handleQuickDemo('ARTISAN')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#221a15] hover:bg-[#2c221b] text-amber-300 border border-[#382b22] hover:border-amber-600/40 transition shadow-sm"
            >
              {t.quickDemoArtisanBtn}
            </button>

            <button
              id="demo-login-customer"
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#221a15] hover:bg-[#2c221b] text-amber-300 border border-[#382b22] hover:border-amber-600/40 transition shadow-sm"
            >
              {t.quickDemoCustomerBtn}
            </button>
          </div>
        </div> : null}
      </motion.div>
    </div>
  );
};