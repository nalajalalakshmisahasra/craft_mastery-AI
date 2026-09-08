import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Upload, 
  MessageSquare, 
  Package, 
  TrendingUp, 
  PlusCircle, 
  Volume2, 
  Eye, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Languages,
  Landmark,
  ShieldCheck,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
  Layers,
  Sparkle
} from 'lucide-react';
import { CraftProduct, ProductInquiry, SupportedLanguage } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText } from '../utils/speech';
import { getLocalizedProduct } from '../utils/productLocalization';

interface ArtisanDashboardProps {
  currentLang: SupportedLanguage;
  artisanName: string;
  products: CraftProduct[];
  inquiries: ProductInquiry[];
  onStartUpload: () => void;
  onOpenMessages: () => void;
  onViewProduct: (product: CraftProduct) => void;
  speechEnabled: boolean;
}

type DashboardTab = 'OVERVIEW' | 'CATALOG' | 'INQUIRIES' | 'TRANSLATIONS' | 'FINANCES';

export const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  currentLang,
  artisanName,
  products,
  inquiries,
  onStartUpload,
  onOpenMessages,
  onViewProduct,
  speechEnabled,
}) => {
  const t = useTranslation(currentLang);
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');

  // Filter and search state for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'stock'>('featured');

  // Interactive state for AI Translations Tab
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState<string>(
    products[0]?.id || 'prod-kondapalli-01'
  );
  const [selectedPreviewLanguage, setSelectedPreviewLanguage] = useState<SupportedLanguage>('en');

  // Greet verbally when dashboard opens if speechEnabled
  useEffect(() => {
    if (speechEnabled && activeTab === 'OVERVIEW') {
      const greetingScript = `${t.artisanGreeting} ${t.artisanActionPrompt}`;
      speakText(greetingScript, currentLang);
    }
  }, [currentLang, speechEnabled, activeTab]);

  // Calculate dynamic financial metrics
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, item) => acc + (item.finalPrice * (item.stockQuantity || 1)), 0);
  }, [products]);

  const totalStockCount = useMemo(() => {
    return products.reduce((acc, item) => acc + (item.stockQuantity || 1), 0);
  }, [products]);

  const unreadInquiriesCount = inquiries.length;

  // Regional languages list
  const REGIONAL_LANGUAGES = [
    { code: 'te', name: 'తెలుగు', englishName: 'Telugu', region: 'ఆంధ్రప్రదేశ్ & తెలంగాణ' },
    { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', region: 'ఉత్తర & మధ్య భారత్' },
    { code: 'en', name: 'English', englishName: 'English', region: 'జాతీయ & అంతర్జాతీయ మార్కెట్' },
    { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', region: 'తమిళనాడు' },
    { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', region: 'కర్ణాటక' },
    { code: 'mr', name: 'मराठी', englishName: 'Marathi', region: 'మహారాష్ట్ర & ముంబై' },
    { code: 'bn', name: 'বাংলা', englishName: 'Bengali', region: 'పశ్చిమ బెంగాల్' },
    { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', region: 'కేరళ' },
    { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', region: 'గుజరాత్' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', region: 'పంజాబ్' },
  ];

  // Category filter list
  const categoryFilters = [
    { id: 'All', label: currentLang === 'te' ? 'అన్నీ' : 'All' },
    { id: 'Wood', label: currentLang === 'te' ? 'చెక్క బొమ్మలు' : 'Wooden Crafts' },
    { id: 'Handloom', label: currentLang === 'te' ? 'చేనేత వస్త్రాలు' : 'Handloom Textiles' },
    { id: 'Metal', label: currentLang === 'te' ? 'ధాతు కళలు' : 'Metal Crafts' },
    { id: 'Pottery', label: currentLang === 'te' ? 'మట్టి & సిరామిక్స్' : 'Pottery' },
    { id: 'Paintings', label: currentLang === 'te' ? 'చిత్రలేఖనం' : 'Paintings' },
    { id: 'Leather', label: currentLang === 'te' ? 'తోలు కళలు' : 'Leather Crafts' },
  ];

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter((item) => {
      const locItem = getLocalizedProduct(item, currentLang);
      const matchesCategory =
        selectedCategory === 'All' ||
        (selectedCategory === 'Wood' && (item.category.includes('Wood') || item.category.includes('చెక్క') || item.category.includes('బొమ్మ'))) ||
        (selectedCategory === 'Handloom' && (item.category.includes('Handloom') || item.category.includes('Textile') || item.category.includes('చేనేత'))) ||
        (selectedCategory === 'Metal' && (item.category.includes('Metal') || item.category.includes('ధాతువు') || item.category.includes('లోహం') || item.category.includes('Bidri') || item.category.includes('ధాతు'))) ||
        (selectedCategory === 'Pottery' && (item.category.includes('Pottery') || item.category.includes('Ceramic') || item.category.includes('మట్టి'))) ||
        (selectedCategory === 'Paintings' && (item.category.includes('Paintings') || item.category.includes('చిత్ర') || item.category.includes('चित्र'))) ||
        (selectedCategory === 'Leather' && (item.category.includes('Leather') || item.category.includes('తోలు') || item.category.includes('చర్మ'))) ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        locItem.title.toLowerCase().includes(q) ||
        locItem.shortDescription.toLowerCase().includes(q) ||
        locItem.category.toLowerCase().includes(q) ||
        locItem.region.toLowerCase().includes(q) ||
        locItem.material.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.finalPrice - a.finalPrice);
    } else if (sortBy === 'stock') {
      list.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
    }

    return list;
  }, [products, currentLang, selectedCategory, searchQuery, sortBy]);

  // Selected product for AI translation preview
  const previewProduct = useMemo(() => {
    return products.find((p) => p.id === selectedPreviewProductId) || products[0];
  }, [products, selectedPreviewProductId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation Sub-Header / Breadcrumb Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2d231d]">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'bg-[#1e1713] text-stone-300 hover:text-amber-200 border border-[#382b22]'
            }`}
          >
            <span>{currentLang === 'te' ? 'అవలోకనం' : 'Overview'}</span>
          </button>

          <button
            id="tab-btn-catalog"
            onClick={() => setActiveTab('CATALOG')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CATALOG'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'bg-[#1e1713] text-stone-300 hover:text-amber-200 border border-[#382b22]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{currentLang === 'te' ? 'క్రాఫ్ట్స్ కేటలాగ్' : 'Crafts Catalog'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {products.length}
            </span>
          </button>

          <button
            id="tab-btn-inquiries"
            onClick={() => setActiveTab('INQUIRIES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'INQUIRIES'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'bg-[#1e1713] text-stone-300 hover:text-amber-200 border border-[#382b22]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{currentLang === 'te' ? 'విచారణలు' : 'Inquiries'}</span>
            {unreadInquiriesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold">
                {unreadInquiriesCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-translations"
            onClick={() => setActiveTab('TRANSLATIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'TRANSLATIONS'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'bg-[#1e1713] text-stone-300 hover:text-amber-200 border border-[#382b22]'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{currentLang === 'te' ? 'AI బహుభాషా హబ్' : 'AI Translations'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">10</span>
          </button>

          <button
            id="tab-btn-finances"
            onClick={() => setActiveTab('FINANCES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'FINANCES'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'bg-[#1e1713] text-stone-300 hover:text-amber-200 border border-[#382b22]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{currentLang === 'te' ? 'ఆదాయం & బ్యాంక్' : 'Earnings & Payouts'}</span>
          </button>
        </div>

        {activeTab !== 'OVERVIEW' && (
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{currentLang === 'te' ? 'తిరిగి డాష్‌బోర్డ్‌కి' : 'Back to Overview'}</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: OVERVIEW (Main Dashboard with Interactive Actionable Boxes)
         ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* AI Voice Assistant Hero Voice Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c1a10] via-[#1c130d] to-[#120d0a] border border-[#483222] p-6 sm:p-8 shadow-2xl text-stone-100"
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600/30 via-amber-700/20 to-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-950/50">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest bg-[#382315] px-3 py-0.5 rounded-full border border-amber-600/40">
                      {t.artisanCopilotBadge}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200 mt-1.5">
                      {t.artisanGreeting}
                    </h2>
                  </div>
                </div>

                {/* Repeat Audio Guidance */}
                <button
                  id="dashboard-play-ai-voice"
                  onClick={() => {
                    const script = `${t.artisanGreeting} ${t.artisanActionPrompt}`;
                    speakText(script, currentLang);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3a2618] hover:bg-[#48301f] text-amber-200 text-xs font-bold border border-[#5a3a25] transition shadow-sm"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>{t.listenAudioBtn}</span>
                </button>
              </div>

              <p className="text-base sm:text-lg text-stone-200 font-medium max-w-2xl leading-relaxed mb-6 font-serif italic">
                "{t.artisanActionPrompt}"
              </p>

              {/* Two Primary Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Upload Product */}
                <button
                  id="artisan-opt-upload-product"
                  onClick={onStartUpload}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-[#241912]/90 hover:bg-[#2e2017] border border-[#422c1d] hover:border-amber-600/60 text-left transition-all duration-200 shadow-xl cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-stone-950 font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-md shadow-amber-950/60">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-200 flex items-center gap-1.5">
                      <span>{t.uploadProductBtn}</span>
                      <ArrowRight className="w-4 h-4 text-amber-400 opacity-80 group-hover:translate-x-1 transition" />
                    </div>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {t.artisanUploadDesc}
                    </p>
                  </div>
                </button>

                {/* Option 2: Check Messages */}
                <button
                  id="artisan-opt-check-messages"
                  onClick={() => setActiveTab('INQUIRIES')}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-[#241912]/90 hover:bg-[#2e2017] border border-[#422c1d] hover:border-amber-600/60 text-left transition-all duration-200 shadow-xl relative cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#36251b] text-amber-300 border border-[#4f3627] flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-md">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-200">
                        {t.checkMessagesBtn}
                      </span>
                      {unreadInquiriesCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-stone-950 shadow-sm">
                          {unreadInquiriesCount} {t.newInquiriesCountBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {t.artisanMessagesDesc}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* 4 Clickable Actionable Button Boxes as requested */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-amber-400/80 font-bold">
                {currentLang === 'te' ? 'కార్యకలాపాలు & స్థితి' : 'Quick Navigation & Metrics'}
              </span>
              <span className="text-[11px] text-stone-400">
                {currentLang === 'te' ? 'పేజీలను తెరవడానికి క్లిక్ చేయండి' : 'Click any box to open dedicated page'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Box 1: Live Crafts Button */}
              <button
                id="artisan-box-btn-crafts"
                onClick={() => setActiveTab('CATALOG')}
                className="group p-5 rounded-2xl bg-[#1a1410] hover:bg-[#251b14] border border-[#382b22] hover:border-amber-500/80 text-stone-100 shadow-xl transition-all duration-200 text-left cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-amber-950/40 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                    <span className="font-semibold text-stone-300 group-hover:text-amber-300 transition">
                      {t.liveCraftsLabel}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#2a1e17] group-hover:bg-amber-600/20 text-amber-400 flex items-center justify-center transition">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-serif text-amber-300">
                    {products.length}
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {t.activeMarketStatus}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2d231d] flex items-center justify-between text-[11px] text-amber-400 font-bold group-hover:text-amber-300">
                  <span>{currentLang === 'te' ? 'కేటలాగ్ చూడండి' : 'Open Catalog'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Box 2: Inquiries Button */}
              <button
                id="artisan-box-btn-inquiries"
                onClick={() => setActiveTab('INQUIRIES')}
                className="group p-5 rounded-2xl bg-[#1a1410] hover:bg-[#251b14] border border-[#382b22] hover:border-amber-500/80 text-stone-100 shadow-xl transition-all duration-200 text-left cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-amber-950/40 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                    <span className="font-semibold text-stone-300 group-hover:text-amber-300 transition">
                      {t.inquiriesStatLabel}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#2a1e17] group-hover:bg-amber-600/20 text-amber-400 flex items-center justify-center transition">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-serif text-amber-300">
                    {inquiries.length}
                  </div>
                  <span className="text-[11px] text-amber-400 mt-1.5 block font-medium">
                    {t.bulkNotePrompt}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2d231d] flex items-center justify-between text-[11px] text-amber-400 font-bold group-hover:text-amber-300">
                  <span>{currentLang === 'te' ? 'సందేశాలు చూడండి' : 'Open Messages'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Box 3: AI Translations Button */}
              <button
                id="artisan-box-btn-translations"
                onClick={() => setActiveTab('TRANSLATIONS')}
                className="group p-5 rounded-2xl bg-[#1a1410] hover:bg-[#251b14] border border-[#382b22] hover:border-amber-500/80 text-stone-100 shadow-xl transition-all duration-200 text-left cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-amber-950/40 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                    <span className="font-semibold text-stone-300 group-hover:text-amber-300 transition">
                      {t.aiTranslationsStatLabel}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#2a1e17] group-hover:bg-amber-600/20 text-amber-400 flex items-center justify-center transition">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-serif text-amber-300">
                    {t.languagesCountLabel}
                  </div>
                  <span className="text-[11px] text-stone-300 mt-1.5 block">
                    {t.autoLiveTranslationDesc}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2d231d] flex items-center justify-between text-[11px] text-amber-400 font-bold group-hover:text-amber-300">
                  <span>{currentLang === 'te' ? 'AI భాషా స్టూడియో' : 'Open AI Studio'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Box 4: Estimated Value Button */}
              <button
                id="artisan-box-btn-finances"
                onClick={() => setActiveTab('FINANCES')}
                className="group p-5 rounded-2xl bg-[#1a1410] hover:bg-[#251b14] border border-[#382b22] hover:border-amber-500/80 text-stone-100 shadow-xl transition-all duration-200 text-left cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-amber-950/40 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                    <span className="font-semibold text-stone-300 group-hover:text-amber-300 transition">
                      {t.estValueLabel}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#2a1e17] group-hover:bg-amber-600/20 text-amber-400 flex items-center justify-center transition">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-serif text-amber-300">
                    ₹{totalInventoryValue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1.5 block font-medium">
                    {t.directBankDepositDesc}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2d231d] flex items-center justify-between text-[11px] text-amber-400 font-bold group-hover:text-amber-300">
                  <span>{currentLang === 'te' ? 'ఖాతా & డిపాజిట్లు' : 'View Payout Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>
            </div>
          </div>

          {/* Crafts Catalog Section Preview on Overview */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-100 font-serif flex items-center gap-2">
                  <span>{t.myCraftsHeading}</span>
                  <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#382315] text-amber-300 border border-amber-600/40">
                    {products.length} {currentLang === 'te' ? 'క్రాఫ్ట్స్' : 'Masterworks'}
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {t.myCraftsSubheading}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="dashboard-view-full-catalog-btn"
                  onClick={() => setActiveTab('CATALOG')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#261c16] hover:bg-[#32241d] text-amber-300 border border-[#483324] flex items-center gap-1.5 transition"
                >
                  <span>{currentLang === 'te' ? 'పూర్తి కేటలాగ్ చూడండి' : 'View Full Catalog'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="dashboard-new-upload-btn"
                  onClick={onStartUpload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md shadow-amber-950/60 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.addNewCraftBtn}</span>
                </button>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.slice(0, 8).map((item) => {
                const locItem = getLocalizedProduct(item, currentLang);
                return (
                  <div
                    key={item.id}
                    className="bg-[#1a1410] border border-[#382b22] rounded-2xl overflow-hidden hover:border-amber-600/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-[#120e0b] overflow-hidden">
                        <img
                          src={locItem.enhancedImageUrl || locItem.originalImageUrl}
                          alt={locItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-200 border border-amber-600/40">
                          {locItem.category}
                        </div>
                        <div className="absolute bottom-2.5 right-2.5 bg-emerald-950/85 backdrop-blur-md text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-800/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.liveListingBadge}</span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="font-bold font-serif text-stone-100 text-sm line-clamp-2 leading-snug group-hover:text-amber-200 transition">
                          {locItem.title}
                        </h4>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {locItem.shortDescription}
                        </p>

                        <div className="mt-3.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#2d231d]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 block">{t.sellingPriceLabel}</span>
                            <span className="text-base font-bold text-amber-300 font-serif">
                              ₹{locItem.finalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 block">{t.stockLabel}</span>
                            <span className="font-semibold text-stone-300 text-xs">
                              {locItem.stockQuantity} {t.piecesAvailable}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => onViewProduct(item)}
                        className="w-full py-2 px-3 rounded-xl bg-[#241a15] hover:bg-[#2f221a] text-xs font-bold text-amber-200 border border-[#3d2e24] hover:border-amber-600/40 flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.viewCraftDetailsBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {products.length > 8 && (
              <div className="text-center pt-3">
                <button
                  onClick={() => setActiveTab('CATALOG')}
                  className="px-6 py-2.5 rounded-xl bg-[#251b14] hover:bg-[#32241c] text-amber-300 border border-amber-600/40 text-xs font-bold transition shadow-lg inline-flex items-center gap-2"
                >
                  <span>
                    {currentLang === 'te' 
                      ? `అన్ని ${products.length} కళాఖండాలను చూడండి →` 
                      : `View all ${products.length} craft products in catalog →`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: FULL CRAFTS CATALOG PAGE (Dedicated View)
         ========================================================================= */}
      {activeTab === 'CATALOG' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-[#1c140e] border border-[#3e2c1f] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/30 text-amber-300 text-xs font-bold mb-2">
                  <Package className="w-3.5 h-3.5" />
                  <span>{currentLang === 'te' ? 'క్రాఫ్ట్ ఇన్వెంటరీ కేటలాగ్' : 'Active Craft Catalog'}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-amber-200">
                  {currentLang === 'te' ? 'కళాకారుడి సంపూర్ణ కేటలాగ్' : 'Artisan Handcrafted Catalog'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  {currentLang === 'te' 
                    ? 'మీరు తయారు చేసిన సాంప్రదాయ కళాఖండాలు, వాటి తయారీ సమయం, పదార్థాలు మరియు మార్కెట్ ధర వివరాలు.'
                    : 'Manage all authentic handcrafted pieces, verify stock availability, and inspect cultural provenance details.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-[#120e0b] border border-[#382b22] text-right">
                  <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                    {currentLang === 'te' ? 'మొత్తం స్టాక్' : 'Total Stock Units'}
                  </span>
                  <span className="text-lg font-bold text-amber-300 font-serif">
                    {totalStockCount} {currentLang === 'te' ? 'ముక్కలు' : 'Units'}
                  </span>
                </div>

                <button
                  id="catalog-add-new-btn"
                  onClick={onStartUpload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.addNewCraftBtn}</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mt-6 pt-5 border-t border-[#2e2118] space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={currentLang === 'te' ? 'క్రాఫ్ట్ పేరు, పదార్థం లేదా ప్రాంతం ద్వారా వెతకండి...' : 'Search by craft name, technique, wood, silk, region...'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#120d0a] border border-[#382a20] text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#120d0a] border border-[#382a20] text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="featured">{currentLang === 'te' ? 'ప్రత్యేకమైనవి (Featured)' : 'Featured'}</option>
                    <option value="price-asc">{currentLang === 'te' ? 'ధర: తక్కువ నుండి ఎక్కువ' : 'Price: Low to High'}</option>
                    <option value="price-desc">{currentLang === 'te' ? 'ధర: ఎక్కువ నుండి తక్కువ' : 'Price: High to Low'}</option>
                    <option value="stock">{currentLang === 'te' ? 'అత్యధిక స్టాక్' : 'Highest Stock'}</option>
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-[#150f0c] text-stone-400 hover:text-stone-200 border border-[#32241c]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((item) => {
              const locItem = getLocalizedProduct(item, currentLang);
              return (
                <div
                  key={item.id}
                  className="bg-[#1a1410] border border-[#382b22] rounded-2xl overflow-hidden hover:border-amber-600/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full bg-[#120e0b] overflow-hidden">
                      <img
                        src={locItem.enhancedImageUrl || locItem.originalImageUrl}
                        alt={locItem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-200 border border-amber-600/40">
                        {locItem.category}
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 bg-emerald-950/85 backdrop-blur-md text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-800/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t.liveListingBadge}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium mb-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{locItem.region}</span>
                      </div>

                      <h4 className="font-bold font-serif text-stone-100 text-sm line-clamp-2 leading-snug group-hover:text-amber-200 transition">
                        {locItem.title}
                      </h4>

                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {locItem.shortDescription}
                      </p>

                      <div className="mt-3 space-y-1 text-[11px] text-stone-400 bg-[#120e0b] p-2.5 rounded-xl border border-[#2b2019]">
                        <div className="flex justify-between">
                          <span className="text-stone-500">{currentLang === 'te' ? 'పదార్థం:' : 'Material:'}</span>
                          <span className="text-stone-300 font-medium truncate max-w-[130px]">{locItem.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">{currentLang === 'te' ? 'సమయం:' : 'Time:'}</span>
                          <span className="text-stone-300 font-medium">{locItem.timeToMake}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#2d231d]">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block">{t.sellingPriceLabel}</span>
                          <span className="text-base font-bold text-amber-300 font-serif">
                            ₹{locItem.finalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block">{t.stockLabel}</span>
                          <span className="font-semibold text-stone-300 text-xs">
                            {locItem.stockQuantity} {t.piecesAvailable}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-2">
                    <button
                      onClick={() => onViewProduct(item)}
                      className="w-full py-2 px-3 rounded-xl bg-[#241a15] hover:bg-[#2f221a] text-xs font-bold text-amber-200 border border-[#3d2e24] hover:border-amber-600/40 flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.viewCraftDetailsBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 bg-[#16100c] border border-[#32241c] rounded-3xl p-8">
              <Package className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-200 font-serif">
                {currentLang === 'te' ? 'క్రాఫ్ట్స్ కనుగొనబడలేదు' : 'No crafts found matching your filters'}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                {currentLang === 'te' ? 'దయచేసి మీ శోధన పదం లేదా కేటగిరీని మార్చి ప్రయత్నించండి.' : 'Try changing your search term or category filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-stone-950 text-xs font-bold"
              >
                {currentLang === 'te' ? 'ఫిల్టర్లు రీసెట్ చేయండి' : 'Reset Filters'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          VIEW 3: INQUIRIES & DIRECT MESSAGES PAGE (Dedicated View)
         ========================================================================= */}
      {activeTab === 'INQUIRIES' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-3xl bg-[#1c140e] border border-[#3e2c1f] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/30 text-amber-300 text-xs font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{currentLang === 'te' ? 'లైవ్ కస్టమర్ చర్చలు' : 'Live Buyer Inquiries'}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-amber-200">
                  {currentLang === 'te' ? 'కస్టమర్ విచారణలు & బల్క్ ఆర్డర్లు' : 'Customer Inquiries & Wholesale Threads'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  {currentLang === 'te'
                    ? 'కార్పొరేట్ కొనుగోలుదారులు మరియు కళా ప్రేమికులతో సంభాషించండి. AI ఆటోమేటిక్ అనువాదం ద్వారా భాష సమస్య లేకుండా ఆర్డర్లు ఖరారు చేయండి.'
                    : 'Communicate directly with corporate gifting managers and art collectors. Real-time 2-way AI translation eliminates all regional language barriers.'}
                </p>
              </div>

              <button
                id="inquiries-open-full-chat-btn"
                onClick={onOpenMessages}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-2 transition shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{currentLang === 'te' ? 'లైవ్ చాట్ విండో తెరవండి' : 'Open Full Chat Interface'}</span>
              </button>
            </div>
          </div>

          {/* Inquiries Thread Cards */}
          <div className="space-y-4">
            {inquiries.map((inq) => {
              const lastMessage = inq.messages[inq.messages.length - 1];
              return (
                <div
                  key={inq.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#1a1410] border border-[#382b22] hover:border-amber-600/60 transition shadow-xl space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#2d231d]">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={inq.productImage}
                        alt={inq.productTitle}
                        className="w-14 h-14 rounded-xl object-cover border border-amber-600/40"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-amber-400 bg-[#2b1e17] px-2.5 py-0.5 rounded-full border border-amber-600/30">
                          {inq.requestedQuantity ? `${inq.requestedQuantity} Pieces Bulk Request` : 'Custom Inquiry'}
                        </span>
                        <h4 className="text-base font-serif font-bold text-stone-100 mt-1">
                          {inq.productTitle}
                        </h4>
                        <span className="text-xs text-stone-400">
                          Buyer: <strong className="text-stone-200">{inq.customerName}</strong> ({inq.customerLanguage.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {inq.status}
                      </span>
                      <button
                        onClick={onOpenMessages}
                        className="px-3.5 py-2 rounded-xl bg-[#261c16] hover:bg-[#32241d] text-amber-300 border border-[#483324] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{currentLang === 'te' ? 'సమాధానం ఇవ్వండి' : 'Reply Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Last Message Preview with Translation */}
                  {lastMessage && (
                    <div className="bg-[#120e0b] p-4 rounded-xl border border-[#2b2019] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="font-semibold text-amber-300">
                          {lastMessage.senderName} ({lastMessage.senderRole})
                        </span>
                        <span>{new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-stone-200 font-medium">
                        "{lastMessage.originalText}"
                      </p>
                      {lastMessage.translatedText && (
                        <div className="text-xs text-amber-300/90 pt-1.5 border-t border-[#231812] flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                          <span>AI అనువాదం: "{lastMessage.translatedText}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          VIEW 4: AI MULTILINGUAL STUDIO PAGE (Dedicated View)
         ========================================================================= */}
      {activeTab === 'TRANSLATIONS' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="p-6 rounded-3xl bg-[#1c140e] border border-[#3e2c1f] shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/30 text-amber-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentLang === 'te' ? 'బహుభాషా అనువాద ఇంజిన్' : 'AI Multilingual Engine'}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-amber-200">
              {currentLang === 'te' ? '10 భారతీయ ప్రాంతీయ భాషల లైవ్ స్టూడియో' : '10 Indian Regional Languages Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              {currentLang === 'te'
                ? 'మీరు మీ మాతృభాష అయిన తెలుగులో మాట్లాడితే చాలు! దేశవ్యాప్తంగా ఉన్న వినియోగదారుల కోసం మీ క్రాఫ్ట్ వివరాలు హిందీ, ఇంగ్లీష్, తమిళం వంటి 10 భాషల్లోకి స్వయంచాలకంగా అనువదించబడతాయి.'
                : 'Artisans voice in their native Telugu; buyers in Delhi, Mumbai, Kolkata, or London instantly read in their own language with cultural authenticity.'}
            </p>
          </div>

          {/* 10 Supported Languages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {REGIONAL_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedPreviewLanguage(lang.code as SupportedLanguage)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  selectedPreviewLanguage === lang.code
                    ? 'bg-[#2f1f15] border-amber-500 text-amber-200 shadow-lg shadow-amber-950/40 scale-[1.02]'
                    : 'bg-[#18120e] border-[#36271e] text-stone-300 hover:border-amber-600/40 hover:bg-[#201712]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-serif">{lang.name}</span>
                  {selectedPreviewLanguage === lang.code && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <span className="text-[11px] text-stone-400 block mt-0.5">{lang.englishName}</span>
                <span className="text-[10px] text-stone-500 block mt-1 truncate">{lang.region}</span>
              </button>
            ))}
          </div>

          {/* Live Translation Preview Playground */}
          <div className="p-6 rounded-3xl bg-[#1a1410] border border-[#382b22] shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d231d]">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                  <span>{currentLang === 'te' ? 'క్రాఫ్ట్ అనువాద ప్రివ్యూ' : 'Live Translation Preview'}</span>
                  <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300 border border-amber-600/40">
                    Target: {REGIONAL_LANGUAGES.find((l) => l.code === selectedPreviewLanguage)?.name}
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {currentLang === 'te' ? 'మీ కేటలాగ్ నుండి క్రాఫ్ట్‌ను ఎంచుకుని వివిధ భాషల్లో ఎలా కనిపిస్తుందో చూడండి.' : 'Select any craft from your catalog to review its regional translation.'}
                </p>
              </div>

              {/* Product Selector */}
              <select
                value={selectedPreviewProductId}
                onChange={(e) => setSelectedPreviewProductId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#120e0b] border border-[#3a2a1f] text-xs font-medium text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer max-w-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Side-by-side: Native Telugu vs Target Language */}
            {previewProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Native Telugu Card */}
                <div className="p-5 rounded-2xl bg-[#140e0b] border border-[#33251c] space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span>కళాకారుడి అసలు భాష (Telugu)</span>
                    </span>
                    <button
                      onClick={() => speakText(previewProduct.shortDescription, 'te')}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>వినండి (TTS)</span>
                    </button>
                  </div>
                  <h4 className="font-serif font-bold text-stone-100 text-base">
                    {previewProduct.title}
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {previewProduct.shortDescription}
                  </p>
                  <div className="pt-2 border-t border-[#261b14] text-[11px] text-stone-400">
                    <strong>సాంకేతికత:</strong> {previewProduct.craftTechnique}
                  </div>
                </div>

                {/* Target Language Card */}
                {(() => {
                  const targetTrans = previewProduct.translations?.[selectedPreviewLanguage];
                  const title = targetTrans?.title || previewProduct.title;
                  const desc = targetTrans?.shortDescription || previewProduct.shortDescription;
                  return (
                    <div className="p-5 rounded-2xl bg-[#1e150f] border border-amber-600/40 space-y-3 shadow-lg shadow-amber-950/20">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {REGIONAL_LANGUAGES.find((l) => l.code === selectedPreviewLanguage)?.name} (Auto-translated)
                          </span>
                        </span>
                        <button
                          onClick={() => speakText(desc, selectedPreviewLanguage)}
                          className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen (TTS)</span>
                        </button>
                      </div>
                      <h4 className="font-serif font-bold text-amber-200 text-base">
                        {title}
                      </h4>
                      <p className="text-xs text-stone-200 leading-relaxed">
                        {desc}
                      </p>
                      <div className="pt-2 border-t border-amber-600/30 text-[11px] text-amber-300/80 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cultural authenticity & GI-terminology verified by Gemini</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          VIEW 5: EARNINGS, VALUATION & BANK PAYOUTS PAGE (Dedicated View)
         ========================================================================= */}
      {activeTab === 'FINANCES' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="p-6 rounded-3xl bg-[#1c140e] border border-[#3e2c1f] shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 text-xs font-bold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{currentLang === 'te' ? 'ఆదాయం & బ్యాంక్ డిపాజిట్లు' : 'Artisan Financial Center'}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-amber-200">
              {currentLang === 'te' ? 'కళాకారుడి ఆర్థిక సమాచారం & ప్రత్యక్ష బ్యాంక్ చెల్లింపులు' : 'Artisan Valuation, Direct Payouts & 0% Platform Commission'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              {currentLang === 'te'
                ? 'ప్లాట్‌ఫారమ్ కమీషన్ 0%. వినియోగదారులు చెల్లించే ప్రతి రూపాయి నేరుగా మీ బ్యాంక్ ఖాతాకు జమ అవుతుంది.'
                : 'Enjoy 100% earnings retention with zero platform middlemen fee. Payouts settle directly to your verified Indian bank account.'}
            </p>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#1a1410] border border-[#382b22] text-stone-100 shadow-xl">
              <span className="text-xs font-medium text-stone-400 block mb-1">
                {currentLang === 'te' ? 'మొత్తం ఇన్వెంటరీ విలువ' : 'Total Inventory Retail Value'}
              </span>
              <div className="text-3xl font-bold font-serif text-amber-300">
                ₹{totalInventoryValue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-stone-400 mt-1.5 block">
                {products.length} {currentLang === 'te' ? 'కళాఖండాల లైవ్ స్టాక్ ఆధారంగా' : 'Calculated across live active craft stock'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#1a1410] border border-[#382b22] text-stone-100 shadow-xl">
              <span className="text-xs font-medium text-stone-400 block mb-1">
                {currentLang === 'te' ? 'పెండింగ్ బల్క్ ఆర్డర్ విలువ' : 'In-Progress Wholesale Orders'}
              </span>
              <div className="text-3xl font-bold font-serif text-amber-300">
                ₹2,46,000
              </div>
              <span className="text-[11px] text-amber-400 mt-1.5 block font-medium">
                100 Dolls (₹1.05L) + 15 Sarees (₹1.41L)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#1a1410] border border-[#382b22] text-stone-100 shadow-xl">
              <span className="text-xs font-medium text-stone-400 block mb-1">
                {currentLang === 'te' ? 'ప్లాట్‌ఫారమ్ కమీషన్' : 'Platform Fee / Commission'}
              </span>
              <div className="text-3xl font-bold font-serif text-emerald-400">
                0% (Zero)
              </div>
              <span className="text-[11px] text-emerald-400 mt-1.5 block font-medium">
                {currentLang === 'te' ? '100% ఆదాయం నేరుగా మీకే' : '100% direct artisan empowerment payout'}
              </span>
            </div>
          </div>

          {/* Linked Direct Bank Account Card */}
          <div className="p-6 rounded-3xl bg-[#19130f] border border-[#3a2a1f] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2119]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-600/30 text-amber-400 flex items-center justify-center">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">
                    {currentLang === 'te' ? 'ధృవీకరించబడిన బ్యాంక్ ఖాతా (Direct Deposit)' : 'Verified Direct Bank Account'}
                  </h3>
                  <span className="text-xs text-stone-400">
                    State Bank of India (SBI) • Kondapalli Craft Cluster
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{currentLang === 'te' ? 'యాక్టివ్ & ధృవీకరించబడింది' : 'Verified & Active'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-300">
              <div className="p-3.5 rounded-xl bg-[#120d0a] border border-[#2b2019]">
                <span className="text-[10px] text-stone-400 block uppercase">{currentLang === 'te' ? 'ఖాతాదారుని పేరు' : 'Account Holder'}</span>
                <span className="font-bold text-stone-100 text-sm mt-0.5 block">{artisanName}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#120d0a] border border-[#2b2019]">
                <span className="text-[10px] text-stone-400 block uppercase">{currentLang === 'te' ? 'ఖాతా సంఖ్య' : 'Account Number'}</span>
                <span className="font-bold text-stone-100 text-sm mt-0.5 block font-mono">•••• •••• •••• 4521</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#120d0a] border border-[#2b2019]">
                <span className="text-[10px] text-stone-400 block uppercase">IFSC Code</span>
                <span className="font-bold text-stone-100 text-sm mt-0.5 block font-mono">SBIN0001234</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
