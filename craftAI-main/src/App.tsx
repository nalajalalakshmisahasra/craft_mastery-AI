import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Header } from './components/Header';
import { WelcomeLanguageModal } from './components/WelcomeLanguageModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ArtisanDashboard } from './components/ArtisanDashboard';
import { ArtisanUploadWizard } from './components/ArtisanUploadWizard';
import { ArtisanMessages } from './components/ArtisanMessages';
import { CustomerMarketplace } from './components/CustomerMarketplace';
import { CustomerProductDetail } from './components/CustomerProductDetail';
import { SupportedLanguage, UserRole, CraftProduct, ProductInquiry } from './types';
import { MOCK_PRODUCTS, MOCK_INQUIRIES } from './data/mockData';
import { speakText, WELCOME_SPEECH_TEXTS, LANGUAGE_CHANGED_TEXTS } from './utils/speech';
import { isRtlLanguage } from './i18n/languages';
import { TRANSLATIONS, useTranslation } from './i18n/translations';
import { apiFetch } from './utils/api';

const DEMO_MODE = import.meta.env.DEV && import.meta.env.VITE_DEMO_DATA === 'true';
const DEMO_PRODUCT_IDS = new Set([
  'prod-kondapalli-01', 'prod-pochampally-02', 'prod-dokra-03', 'prod-bluepottery-04',
  'prod-channapatna-05', 'prod-bidriware-06', 'prod-tanjore-07', 'prod-walnut-08',
  'prod-kalamkari-09', 'prod-tholubommalata-10', 'prod-pashmina-11', 'prod-madhubani-12',
]);

export default function App() {
  // Localization & Audio
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('craft_mastery_lang') as SupportedLanguage;
      if (saved) return saved;
    }
    return 'te'; // Default to Telugu as requested in prompt!
  });
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);

  // Sync document direction and language code for accessibility and RTL (Urdu)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = isRtlLanguage(currentLang);
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLang;
      localStorage.setItem('craft_mastery_lang', currentLang);
    }
  }, [currentLang]);

  // Authentication & Role
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('ARTISAN');
  const [userName, setUserName] = useState<string>('రామయ్య ఆచారి');
  const [userPhone, setUserPhone] = useState<string>('+91 98480 12345');

  // Navigation State
  const [artisanView, setArtisanView] = useState<'DASHBOARD' | 'UPLOAD' | 'MESSAGES' | 'PRODUCT_DETAIL'>('DASHBOARD');
  const [customerView, setCustomerView] = useState<'MARKETPLACE' | 'PRODUCT_DETAIL'>('MARKETPLACE');
  const [selectedProduct, setSelectedProduct] = useState<CraftProduct | null>(null);

  // Data Store
  const [products, setProducts] = useState<CraftProduct[]>(DEMO_MODE ? MOCK_PRODUCTS : []);
  const [inquiries, setInquiries] = useState<ProductInquiry[]>(MOCK_INQUIRIES);

  // Check persistent session on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('craft_mastery_auth');
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          if (parsed && parsed.phone) {
            setUserRole(parsed.role || 'ARTISAN');
            setUserPhone(parsed.phone);
            setUserName(parsed.name || (parsed.role === 'ARTISAN' ? 'రామయ్య ఆచారి' : 'విక్రమ్ శర్మ'));
            setIsAuthenticated(true);
            setShowWelcomeModal(false);
            setShowAuthModal(false);
            setShowOnboardingModal(false);
          }
        } catch (e) {
          console.warn('Error parsing saved auth:', e);
        }
      }
    }
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        setShowWelcomeModal(false);
        setShowAuthModal(false);
        if (firebaseUser.phoneNumber) {
          setUserPhone(firebaseUser.phoneNumber);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial data from Express backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const prodRes = await apiFetch('/api/products');
        if (prodRes.ok) {
          const data = await prodRes.json();
          const prods = Array.isArray(data) ? data : data?.products;
          if (prods) {
            setProducts(DEMO_MODE ? prods : prods.filter((product: CraftProduct) => !DEMO_PRODUCT_IDS.has(product.id)));
          }
        }

        const inqRes = await apiFetch('/api/inquiries');
        if (inqRes.ok) {
          const data = await inqRes.json();
          const inqs = Array.isArray(data) ? data : data?.inquiries;
          if (inqs && inqs.length > 0) setInquiries(inqs);
        }
      } catch (err) {
        console.warn('Backend loading error, continuing with curated state:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Handler: Welcome Language Continue
  const handleWelcomeContinue = () => {
    setShowWelcomeModal(false);
    setShowAuthModal(true);
    if (speechEnabled) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const authSpeech = `${t.welcomeTitle}. ${t.whoAreYou}.`;
      speakText(authSpeech, currentLang);
    }
  };

  // Handler: Successful Login / Register
  const handleAuthSuccess = (role: UserRole, phone: string, name: string) => {
    setUserRole(role);
    setUserPhone(phone);
    setUserName(name);

    const alreadyOnboarded = typeof window !== 'undefined'
      ? localStorage.getItem(`craft_mastery_onboarded_${phone}`)
      : null;

    if (!alreadyOnboarded) {
      setShowAuthModal(false);
      setShowOnboardingModal(true);
      if (speechEnabled) {
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        speakText(`${t.onboardingTitle}. ${t.onboardingSubtitle}`, currentLang);
      }
    } else {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setShowOnboardingModal(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'craft_mastery_auth',
          JSON.stringify({ role, phone, name, completedOnboarding: true })
        );
      }

      if (speechEnabled) {
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        const greeting = role === 'ARTISAN'
          ? `${t.artisanGreeting} ${t.artisanActionPrompt}`
          : `${t.customerGreeting} ${t.customerSearchPrompt}`;
        speakText(greeting, currentLang);
      }
    }
  };

  // Handler: Onboarding Complete
  const handleOnboardingComplete = () => {
    setIsAuthenticated(true);
    setShowOnboardingModal(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`craft_mastery_onboarded_${userPhone}`, 'true');
      localStorage.setItem(
        'craft_mastery_auth',
        JSON.stringify({ role: userRole, phone: userPhone, name: userName, completedOnboarding: true })
      );
    }

    if (speechEnabled) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const greeting = userRole === 'ARTISAN'
        ? `${t.artisanGreeting} ${t.artisanActionPrompt}`
        : `${t.customerGreeting} ${t.customerSearchPrompt}`;
      speakText(greeting, currentLang);
    }
  };

  // Switch Role
  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'craft_mastery_auth',
        JSON.stringify({ role: newRole, phone: userPhone, name: userName, completedOnboarding: true })
      );
    }
    if (newRole === 'ARTISAN') {
      setArtisanView('DASHBOARD');
      setSelectedProduct(null);
    } else {
      setCustomerView('MARKETPLACE');
      setSelectedProduct(null);
    }
  };

  // Full Logout / Reset
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut error:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('craft_mastery_auth');
    }
    setIsAuthenticated(false);
    setShowWelcomeModal(true);
    setShowAuthModal(false);
    setShowOnboardingModal(false);
    setArtisanView('DASHBOARD');
    setCustomerView('MARKETPLACE');
    setSelectedProduct(null);
  };

  // Add newly uploaded craft product
  const handleProductUploadSuccess = (newProduct: CraftProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    setArtisanView('DASHBOARD');
  };

  // Reply to Inquiry in Artisan Inbox
  const handleReplyMessage = async (inquiryId: string, replyText: string, lang: SupportedLanguage) => {
    try {
      const res = await apiFetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderRole: 'ARTISAN',
          senderName: userName,
          originalText: replyText,
          originalLang: lang,
        }),
      });

      if (res.ok) {
        const updatedInquiry: ProductInquiry = await res.json();
        setInquiries((prev) =>
          prev.map((i) => (i.id === inquiryId ? updatedInquiry : i))
        );
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
    }
  };

  // Customer creates inquiry / bulk order (100 pieces)
  const handleSendCustomerInquiry = async (
    productId: string,
    quantity: number,
    message: string,
    customerLang: SupportedLanguage
  ) => {
    const targetProduct = products.find((p) => p.id === productId);

    try {
      const res = await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productTitle: targetProduct?.title || 'Handcrafted Product',
          productImage: targetProduct?.enhancedImageUrl || targetProduct?.originalImageUrl,
          artisanId: targetProduct?.artisanId || 'art-001',
          artisanPhone: targetProduct?.artisanPhone || '+91 98480 12345',
          customerId: 'cust-101',
          customerName: userName || 'Customer',
          customerPhone: userPhone || '+91 98200 44556',
          customerLanguage: customerLang,
          artisanLanguage: targetProduct?.artisanLanguage || 'te',
          requestedQuantity: quantity,
          initialMessage: message,
        }),
      });

      if (res.ok) {
        const newInq = await res.json();
        setInquiries((prev) => [newInq, ...prev]);
      }
    } catch (err) {
      console.error('Inquiry submission error:', err);
    }
  };

  return (
    <div
      dir={isRtlLanguage(currentLang) ? 'rtl' : 'ltr'}
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white"
    >
      {/* 1. Global Navigation Header */}
      <Header
        currentLang={currentLang}
        onSelectLang={(lang) => {
          setCurrentLang(lang);
          if (speechEnabled) {
            speakText(LANGUAGE_CHANGED_TEXTS[lang] || WELCOME_SPEECH_TEXTS[lang], lang);
          }
        }}
        userRole={userRole}
        userName={userName}
        onSwitchRole={handleSwitchRole}
        speechEnabled={speechEnabled}
        onToggleSpeech={() => setSpeechEnabled((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* 2. Main Body Container - Only accessible when authenticated */}
      <main className="flex-1 pb-16">
        {isAuthenticated ? (
          userRole === 'ARTISAN' ? (
            /* ARTISAN WORKFLOW */
            <>
              {artisanView === 'DASHBOARD' && (
                <ArtisanDashboard
                  currentLang={currentLang}
                  artisanName={userName}
                  products={products}
                  inquiries={inquiries}
                  onStartUpload={() => setArtisanView('UPLOAD')}
                  onOpenMessages={() => setArtisanView('MESSAGES')}
                  onViewProduct={(prod) => {
                    setSelectedProduct(prod);
                    setArtisanView('PRODUCT_DETAIL');
                  }}
                  speechEnabled={speechEnabled}
                />
              )}

              {artisanView === 'UPLOAD' && (
                <ArtisanUploadWizard
                  currentLang={currentLang}
                  artisanName={userName}
                  artisanPhone={userPhone}
                  onComplete={handleProductUploadSuccess}
                  onCancel={() => setArtisanView('DASHBOARD')}
                  speechEnabled={speechEnabled}
                />
              )}

              {artisanView === 'MESSAGES' && (
                <ArtisanMessages
                  currentLang={currentLang}
                  inquiries={inquiries}
                  onReplyMessage={handleReplyMessage}
                  onBack={() => setArtisanView('DASHBOARD')}
                  speechEnabled={speechEnabled}
                />
              )}

              {artisanView === 'PRODUCT_DETAIL' && selectedProduct && (
                <CustomerProductDetail
                  product={selectedProduct}
                  currentLang={currentLang}
                  customerName={userName}
                  customerPhone={userPhone}
                  onBack={() => {
                    setSelectedProduct(null);
                    setArtisanView('DASHBOARD');
                  }}
                  onSendInquiry={handleSendCustomerInquiry}
                  speechEnabled={speechEnabled}
                />
              )}
            </>
          ) : (
            /* CUSTOMER WORKFLOW */
            <>
              {customerView === 'MARKETPLACE' && (
                <CustomerMarketplace
                  currentLang={currentLang}
                  customerName={userName}
                  products={products}
                  onSelectProduct={(prod) => {
                    setSelectedProduct(prod);
                    setCustomerView('PRODUCT_DETAIL');
                  }}
                  speechEnabled={speechEnabled}
                />
              )}

              {customerView === 'PRODUCT_DETAIL' && selectedProduct && (
                <CustomerProductDetail
                  product={selectedProduct}
                  currentLang={currentLang}
                  customerName={userName}
                  customerPhone={userPhone}
                  onBack={() => {
                    setSelectedProduct(null);
                    setCustomerView('MARKETPLACE');
                  }}
                  onSendInquiry={handleSendCustomerInquiry}
                  speechEnabled={speechEnabled}
                />
              )}
            </>
          )
        ) : (
          /* Unauthenticated Landing / Blank placeholder while welcome/auth modals guide user */
          <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-300 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🏺</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-amber-200 mb-2">
                Craft Mastery
              </h2>
              <p className="text-sm text-stone-400">
                {TRANSLATIONS[currentLang]?.tagline || 'Multilingual AI Marketplace for Artisans & Discerning Customers'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. Initial Modals for User Onboarding */}
      {/* Welcome & Language Picker Modal */}
      {showWelcomeModal && (
        <WelcomeLanguageModal
          selectedLang={currentLang}
          onSelectLang={setCurrentLang}
          onContinue={handleWelcomeContinue}
        />
      )}

      {/* Login / Register & Role Selection Modal */}
      {showAuthModal && (
        <AuthModal
          currentLang={currentLang}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Preferences & Onboarding Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          currentLang={currentLang}
          userRole={userRole}
          userName={userName}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
