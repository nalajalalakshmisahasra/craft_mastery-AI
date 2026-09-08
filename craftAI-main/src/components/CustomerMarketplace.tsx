import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Mic, 
  MicOff, 
  Filter, 
  Package, 
  MapPin, 
  Heart, 
  ArrowRight, 
  RefreshCw,
  Volume2
} from 'lucide-react';
import { CraftProduct, SupportedLanguage } from '../types';
import { useTranslation } from '../i18n/translations';
import { speakText } from '../utils/speech';
import { getLocalizedProduct } from '../utils/productLocalization';
import { apiFetch } from '../utils/api';

interface CustomerMarketplaceProps {
  currentLang: SupportedLanguage;
  customerName: string;
  products: CraftProduct[];
  onSelectProduct: (product: CraftProduct) => void;
  speechEnabled: boolean;
}

export const CustomerMarketplace: React.FC<CustomerMarketplaceProps> = ({
  currentLang,
  customerName,
  products,
  onSelectProduct,
  speechEnabled,
}) => {
  const t = useTranslation(currentLang);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSearching, setIsSearching] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  // Greet verbally upon customer login
  useEffect(() => {
    if (speechEnabled) {
      const greeting = `${t.customerGreeting} ${t.customerSearchPrompt}`;
      speakText(greeting, currentLang);
    }
  }, [currentLang, speechEnabled]);

  const categories = [
    { id: 'All', label: currentLang === 'te' ? 'అన్నీ' : currentLang === 'hi' ? 'सभी' : 'All' },
    { id: 'Wood', label: currentLang === 'te' ? 'చెక్క బొమ్మలు' : currentLang === 'hi' ? 'लकड़ी के शिल्प' : 'Wooden Crafts' },
    { id: 'Handloom', label: currentLang === 'te' ? 'చేనేత వస్త్రాలు' : currentLang === 'hi' ? 'हथकरघा वस्त्र' : 'Handloom Textiles' },
    { id: 'Metal', label: currentLang === 'te' ? 'లోహ పాత్రలు' : currentLang === 'hi' ? 'धातु शिल्प' : 'Metal Crafts' },
    { id: 'Pottery', label: currentLang === 'te' ? 'మట్టి కళాఖండాలు' : currentLang === 'hi' ? 'मिट्टी के बर्तन' : 'Pottery & Ceramics' },
    { id: 'Paintings', label: currentLang === 'te' ? 'చిత్రలేఖనం' : currentLang === 'hi' ? 'पारंपरिक चित्र' : 'Paintings' },
    { id: 'Leather', label: currentLang === 'te' ? 'తోలు కళలు' : currentLang === 'hi' ? 'चमड़ा शिल्प' : 'Leather Crafts' },
  ];

  // Perform AI Semantic Search
  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setAiFeedback('');
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch('/api/ai/customer-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          language: currentLang,
        }),
      });
      const data = await res.json();
      setAiFeedback(data.aiMessage);
      if (data.category && data.category !== 'All') {
        const matchingCat = categories.find((c) =>
          c.label.toLowerCase().includes(data.category.toLowerCase()) ||
          c.id.toLowerCase().includes(data.category.toLowerCase())
        );
        if (matchingCat) setSelectedCategory(matchingCat.id);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        handleSearch(transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Filter products based on search query & category
  const filteredProducts = products.filter((item) => {
    const locItem = getLocalizedProduct(item, currentLang);
    const matchesCat =
      selectedCategory === 'All' ||
      (selectedCategory === 'Wood' && (item.category.includes('Wood') || item.category.includes('చెక్క') || item.category.includes('బొమ్మ'))) ||
      (selectedCategory === 'Handloom' && (item.category.includes('Handloom') || item.category.includes('Textile') || item.category.includes('చేనేత'))) ||
      (selectedCategory === 'Metal' && (item.category.includes('Metal') || item.category.includes('ధాతువు') || item.category.includes('లోహం') || item.category.includes('Bidri') || item.category.includes('ధాతు'))) ||
      (selectedCategory === 'Pottery' && (item.category.includes('Pottery') || item.category.includes('Ceramic') || item.category.includes('మట్టి'))) ||
      (selectedCategory === 'Paintings' && (item.category.includes('Paintings') || item.category.includes('చిత్ర') || item.category.includes('चित्र'))) ||
      (selectedCategory === 'Leather' && (item.category.includes('Leather') || item.category.includes('తోలు') || item.category.includes('చర్మ'))) ||
      item.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const queryLower = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      locItem.title.toLowerCase().includes(queryLower) ||
      locItem.shortDescription.toLowerCase().includes(queryLower) ||
      locItem.material.toLowerCase().includes(queryLower) ||
      item.title.toLowerCase().includes(queryLower);

    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Customer AI Welcome & Search Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c1a10] via-[#1c130d] to-[#120d0a] border border-[#483222] p-6 sm:p-8 shadow-2xl text-stone-100"
      >
        {/* Decorative warm glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-900/30 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-[#382315] px-2.5 py-0.5 rounded-full border border-amber-600/30">
              {t.aiConciergeBadge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-200 tracking-tight">
            {t.customerGreeting}
          </h2>

          <p className="text-sm sm:text-base text-stone-200 mt-2 font-serif italic">
            "{t.customerSearchPrompt}"
          </p>

          {/* Natural Language Voice Search Box */}
          <div className="mt-5 relative">
            <div className="flex items-center bg-[#221813] border border-[#422c1d] rounded-2xl p-1.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 shadow-inner">
              <div className="pl-3 text-stone-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="customer-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
              />

              {/* Voice Input Mic */}
              <button
                id="customer-search-mic"
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-xl border transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse border-red-500 shadow-md'
                    : 'bg-[#2d1e17] hover:bg-amber-600 text-amber-300 hover:text-stone-950 border-[#4a3325]'
                }`}
                title="Speak your search query"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                id="customer-search-btn"
                onClick={() => handleSearch(searchQuery)}
                className="ml-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-md shadow-amber-950/60 flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{t.searchBtn}</span>
                )}
              </button>
            </div>
          </div>

          {/* AI Response feedback if active */}
          {aiFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3.5 bg-[#251912] border border-amber-600/40 rounded-xl text-xs text-amber-200 flex items-center justify-between shadow-md"
            >
              <span className="font-medium">{aiFeedback}</span>
              <button
                onClick={() => speakText(aiFeedback, currentLang)}
                className="text-amber-400 hover:text-amber-300 ml-2 p-1"
                title="Listen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedCategory === cat.id
                ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-[#1c1410] border-[#382b22] text-stone-400 hover:bg-[#281e18] hover:text-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Guide Banner: Select a product and tap ✨ Ask AI button */}
      <div className="p-3.5 rounded-2xl bg-[#241710] border border-[#4a3222] text-xs text-amber-200 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.selectAProductPrompt}</span>
        </div>
        <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest bg-amber-600/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          {t.smartGuidanceBadge}
        </span>
      </div>

      {/* 4. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const loc = getLocalizedProduct(product, currentLang);

          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectProduct(product)}
              className="bg-[#1a1410] border border-[#382b22] rounded-2xl overflow-hidden hover:border-amber-600/50 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-56 w-full bg-[#120e0b] overflow-hidden">
                  <img
                    src={product.enhancedImageUrl || product.originalImageUrl}
                    alt={loc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-amber-200 border border-amber-600/40">
                    {loc.category}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#17110e]/90 backdrop-blur-md text-stone-300 px-2.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 border border-[#382a20]">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[140px] font-medium">{loc.region}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 space-y-2">
                  <div className="text-xs text-stone-400 flex items-center justify-between">
                    <span>{t.handmadeBy}: <strong className="text-amber-200 font-semibold">{loc.artisanName}</strong></span>
                    <span className="text-[10px] text-amber-400 font-semibold">{t.authenticCraftBadge}</span>
                  </div>

                  <h3 className="font-bold font-serif text-stone-100 text-base line-clamp-2 leading-snug group-hover:text-amber-200 transition">
                    {loc.title}
                  </h3>

                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {loc.shortDescription}
                  </p>
                </div>
              </div>

              {/* Bottom Price & Select Card Action */}
              <div className="p-4 sm:p-5 pt-0">
                <div className="pt-3 border-t border-[#2d231d] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">{t.pricePerUnit}</span>
                    <span className="text-xl font-bold font-serif text-amber-300">
                      ₹{product.finalPrice.toLocaleString()}
                    </span>
                  </div>

                  <button
                    id={`view-craft-${product.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-600 group-hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/50 transition flex items-center gap-1.5"
                  >
                    <span>{t.detailsAndAiBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
