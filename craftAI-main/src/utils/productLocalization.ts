import { CraftProduct, ProductInquiry, SupportedLanguage } from '../types';

interface LocalizedPreset {
  name: string;
  url: string;
  descriptionSample: string;
}

export const CATEGORY_KEYS = [
  'ALL',
  'WOOD',
  'HANDLOOM',
  'METAL',
  'POTTERY'
] as const;

export type CategoryKey = typeof CATEGORY_KEYS[number];

const CATEGORY_NAMES: Record<SupportedLanguage, Record<CategoryKey, string>> = {
  te: {
    ALL: 'అన్నీ',
    WOOD: 'చెక్క బొమ్మలు',
    HANDLOOM: 'చేనేత వస్త్రాలు',
    METAL: 'ధాతువు & లోహం',
    POTTERY: 'మట్టి పాత్రలు',
  },
  en: {
    ALL: 'All Crafts',
    WOOD: 'Wooden Crafts',
    HANDLOOM: 'Handloom Textiles',
    METAL: 'Metal Crafts',
    POTTERY: 'Pottery & Ceramics',
  },
  hi: {
    ALL: 'सभी शिल्प',
    WOOD: 'लकड़ी के शिल्प',
    HANDLOOM: 'हथकरघा वस्त्र',
    METAL: 'धातु हस्तशिल्प',
    POTTERY: 'मिट्टी के बर्तन व सेरामिक्स',
  },
  ta: {
    ALL: 'அனைத்து கைவினைகள்',
    WOOD: 'மர கைவினைப் பொருட்கள்',
    HANDLOOM: 'கைத்தறி துணிகள்',
    METAL: 'உலோக கைவினை',
    POTTERY: 'மண்பாண்டங்கள்',
  },
  kn: {
    ALL: 'ಎಲ್ಲಾ ಕರಕುಶಲ ವಸ್ತುಗಳು',
    WOOD: 'ಮರದ ಕರಕುಶಲ ವಸ್ತುಗಳು',
    HANDLOOM: 'ಕೈಮಗ್ಗ ಜವಳಿ',
    METAL: 'ಲೋಹದ ಕರಕುಶಲ',
    POTTERY: 'ಮಣ್ಣಿನ ಪಾತ್ರೆಗಳು',
  },
  mr: {
    ALL: 'सर्व हस्तकला',
    WOOD: 'लाकडी हस्तकला',
    HANDLOOM: 'हातमाग वस्त्रे',
    METAL: 'धातू हस्तकला',
    POTTERY: 'मातीची भांडी',
  },
  bn: {
    ALL: 'সমস্ত হস্তশিল্প',
    WOOD: 'কাঠের কারুশিল্প',
    HANDLOOM: 'তাঁত বস্ত্র',
    METAL: 'ধাতু শিল্প',
    POTTERY: 'মৃৎশিল্প',
  },
  ml: {
    ALL: 'എല്ലാ കരകൗശലങ്ങളും',
    WOOD: 'തടി കരകൗശലങ്ങൾ',
    HANDLOOM: 'കൈത്തറി വസ്ത്രങ്ങൾ',
    METAL: 'ലോഹ കരകൗശലം',
    POTTERY: 'മൺപാത്രങ്ങൾ',
  },
  gu: {
    ALL: 'તમામ હસ્તકલા',
    WOOD: 'લાકડાની હસ્તકલા',
    HANDLOOM: 'હાથવણાટ કાપડ',
    METAL: 'ધાતુ હસ્તકલા',
    POTTERY: 'માટીકામ',
  },
  pa: {
    ALL: 'ਸਾਰੇ ਦਸਤਕਾਰੀ',
    WOOD: 'ਲੱਕੜ ਦੀ ਦਸਤਕਾਰੀ',
    HANDLOOM: 'ਖੱਡੀ ਦੇ ਕੱਪੜੇ',
    METAL: 'ਧਾਤੂ ਦਸਤਕਾਰੀ',
    POTTERY: 'ਮਿੱਟੀ ਦੇ ਭਾਂਡੇ',
  },
  or: {
    ALL: 'ସମସ୍ତ ହସ୍ତଶିଳ୍ପ',
    WOOD: 'କାଠ କାରୁକାର୍ଯ୍ୟ',
    HANDLOOM: 'ହସ୍ତତନ୍ତ ବସ୍ତ୍ର',
    METAL: 'ଧାତୁ ଓ ତାରକସୀ ଶିଳ୍ପ',
    POTTERY: 'ମୃତ୍ତିକା ପାତ୍ର',
  },
  as: {
    ALL: 'সকলো হস্তশিল্প',
    WOOD: 'কাঠ আৰু বাঁহৰ কাৰুশিল্প',
    HANDLOOM: 'তাঁত বস্ত্ৰ আৰু মুগা',
    METAL: 'কাঁহ আৰু ধাতু শিল্প',
    POTTERY: 'মৃৎশিল্প আৰু মাটিৰ বাচন',
  },
  ur: {
    ALL: 'تمام دستکاریاں',
    WOOD: 'لکڑی کا کام اور کھلونے',
    HANDLOOM: 'ہینڈلوم اور روایتی کپڑے',
    METAL: 'دھاتی اور بدری دستکاری',
    POTTERY: 'مٹی کے برتن اور مٹی کا کام',
  },
};

export function getCategoryOptions(lang: SupportedLanguage): { key: CategoryKey; label: string }[] {
  const dict = CATEGORY_NAMES[lang] || CATEGORY_NAMES.en;
  return CATEGORY_KEYS.map((key) => ({
    key,
    label: dict[key],
  }));
}

export function getLocalizedPresetCrafts(lang: SupportedLanguage): LocalizedPreset[] {
  if (lang === 'te') {
    return [
      {
        name: 'కొండపల్లి చెక్క బొమ్మలు',
        url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ఇది చేతితో చేసిన కొండపల్లి చెక్క బొమ్మ. పొనికి చెక్కతో మరియు సహజ కూరగాయల రంగులతో 4 రోజులు కష్టపడి తయారు చేశాము. దీని ఎత్తు 10 అంగుళాలు.',
      },
      {
        name: 'బిద్రీ వెండి కళాఖండం',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ఇది జింక్ మరియు రాగి మిశ్రమంతో చేసిన ప్రాచీన బిద్రీ పాత్ర. దీనిపై స్వచ్ఛమైన వెండి తీగలతో చేతితో అందమైన పువ్వుల నమూనాలు పొదిగాము. బరువు 800 గ్రాములు.',
      },
      {
        name: 'కలంకారీ చేనేత వస్త్రం',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ఇది సహజసిద్ధమైన వెదురు కలంతో చేతితో చిత్రించిన పవిత్రమైన కలంకారీ చేనేత వస్త్రం. స్వచ్ఛమైన కాటన్ వస్త్రంపై దానిమ్మ తొక్క, నీలిమందు రంగులతో 10 రోజులు శ్రమించి గీశాను.',
      },
    ];
  }

  if (lang === 'hi') {
    return [
      {
        name: 'कोंडापल्ली लकड़ी की गुड़िया',
        url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'यह विशेष हल्की लकड़ी और प्राकृतिक रंगों से 4 दिनों में तैयार की गई पारंपरिक कोंडापल्ली गुड़िया है। इसकी ऊंचाई 10 इंच है।',
      },
      {
        name: 'बिदरी चांदी नक्काशी फूलदान',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'यह जस्ता और तांबे की मिश्रधातु पर शुद्ध चांदी की तारों से बनी बिदरी कलाकृति है। वजन लगभग 800 ग्राम है।',
      },
      {
        name: 'कलमकारी हस्तनिर्मित वस्त्र',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'यह बांस की कलम और प्राकृतिक रंगों से सूती कपड़े पर 10 दिनों में तैयार किया गया पारंपरिक कलमकारी वस्त्र है।',
      },
    ];
  }

  if (lang === 'ta') {
    return [
      {
        name: 'கொண்டபள்ளி மர பொம்மைகள்',
        url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'இது மென்மையான மரம் மற்றும் இயற்கை வண்ணங்களால் 4 நாட்களில் உருவாக்கப்பட்ட பாரம்பரிய கைவினை பொம்மை.',
      },
      {
        name: 'பித்ரி வெள்ளி வேலைப்பாடு குவளை',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'தூய வெள்ளி கம்பிகளால் கைவினைஞரால் செதுக்கப்பட்ட பாரம்பரிய பித்ரி கலைப்பொருள்.',
      },
      {
        name: 'கலம்காரி கைத்தறி ஆடை',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'இயற்கை சாயங்கள் மற்றும் மூங்கில் பேனாவால் வரையப்பட்ட தூய பருத்தி கைத்தறி ஆடை.',
      },
    ];
  }

  if (lang === 'kn') {
    return [
      {
        name: 'ಕೊಂಡಪಲ್ಲಿ ಮರದ ಗೊಂಬೆಗಳು',
        url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ಮೃದುವಾದ ಮರ ಮತ್ತು ನೈಸರ್ಗಿಕ ಬಣ್ಣಗಳಿಂದ 4 ದಿನಗಳಲ್ಲಿ ಸಿದ್ಧಪಡಿಸಿದ ಸಾಂಪ್ರದಾಯಿಕ ಮರದ ಗೊಂಬೆ.',
      },
      {
        name: 'ಬಿದ್ರಿ ಬೆಳ್ಳಿಯ ಹೂದಾನಿ',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ಶುದ್ಧ ಬೆಳ್ಳಿಯ ತಂತಿಗಳಿಂದ ಕೈಯಿಂದ ಕೆತ್ತಲಾದ ಪ್ರಾಚೀನ ಬಿದ್ರಿ ಕಲಾಕೃತಿ. ತೂಕ ಸುಮಾರು 800 ಗ್ರಾಂ.',
      },
      {
        name: 'ಕಲಂಕಾರಿ ಕೈಮಗ್ಗ ವಸ್ತ್ರ',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
        descriptionSample: 'ನೈಸರ್ಗಿಕ ಬಣ್ಣಗಳು ಮತ್ತು ಬಿದಿರಿನ ಲೇಖನಿಯಿಂದ ಕೈಯಿಂದ ಚಿತ್ರಿಸಲಾದ ಪವಿತ್ರ ಕಲಂಕಾರಿ ವಸ್ತ್ರ.',
      },
    ];
  }

  // Default: Pure English
  return [
    {
      name: 'Kondapalli Handcrafted Wooden Dolls',
      url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=70',
      descriptionSample: 'Authentic handcrafted wooden doll set from soft Tella Poniki wood and organic dyes. Takes 4 days of artisan carving. Height is 10 inches.',
    },
    {
      name: 'Bidriware Silver Inlay Vase',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=70',
      descriptionSample: 'Ancient zinc and copper alloy vase with delicate pure silver inlay floral patterns. Weight is approximately 800 grams.',
    },
    {
      name: 'Kalamkari Hand Painted Handloom Fabric',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=70',
      descriptionSample: 'Handcrafted sacred textile on pure cotton cloth using organic vegetable pigments and natural bamboo pens. Crafted over 10 days.',
    },
  ];
}

// Clean any accidental bilingual slashes or parentheses from names/attributes
export function cleanBilingualText(raw: string, lang: SupportedLanguage): string {
  if (!raw) return '';
  // If text contains " / " or " (", parse appropriately
  if (lang === 'en') {
    // Look for english segment
    const slashParts = raw.split('/');
    if (slashParts.length > 1) {
      return slashParts[slashParts.length - 1].trim();
    }
    // Check for parenthetical english: e.g. "సాంప్రదాయ (Kondapalli Dolls)"
    const matchParen = raw.match(/\(([^)]+)\)/);
    if (matchParen && /^[A-Za-z0-9\s,.-]+$/.test(matchParen[1])) {
      return matchParen[1].trim();
    }
    // Remove Telugu/Devanagari characters if mixed
    const englishOnly = raw.replace(/[\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF\u0C80-\u0CFF]/g, '').trim();
    return englishOnly || raw;
  }

  // If local language (e.g. te, hi, ta, kn)
  const slashParts = raw.split('/');
  let nativePart = slashParts[0].trim();
  // Strip English parentheses like " (Wooden Crafts)" or " (Ramayya)"
  nativePart = nativePart.replace(/\([A-Za-z0-9\s,.-]+\)/g, '').trim();
  return nativePart || raw;
}

// Map craft products cleanly to the target language
export function getLocalizedProduct(product: CraftProduct, lang: SupportedLanguage): {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  material: string;
  craftTechnique: string;
  dimensions: string;
  timeToMake: string;
  region: string;
  artisanName: string;
  finalPrice: number;
  stockQuantity: number;
  originalImageUrl: string;
  enhancedImageUrl?: string;
} {
  const trans = product.translations?.[lang];
  const title = trans?.title || cleanBilingualText(product.title, lang);
  const shortDescription = trans?.shortDescription || cleanBilingualText(product.shortDescription, lang);
  const fullDescription = trans?.fullDescription || cleanBilingualText(product.fullDescription, lang);

  // Category mapping
  let category = cleanBilingualText(product.category, lang);
  const dict = CATEGORY_NAMES[lang] || CATEGORY_NAMES.en;
  if (product.category.toLowerCase().includes('wood') || product.category.includes('చెక్క') || product.category.includes('लकड़ी')) {
    category = dict.WOOD;
  } else if (product.category.toLowerCase().includes('textile') || product.category.toLowerCase().includes('handloom') || product.category.includes('చేనేత') || product.category.includes('हथकरघा')) {
    category = dict.HANDLOOM;
  } else if (product.category.toLowerCase().includes('metal') || product.category.includes('లోహం') || product.category.includes('धातु')) {
    category = dict.METAL;
  } else if (product.category.toLowerCase().includes('pottery') || product.category.includes('మట్టి') || product.category.includes('मिट्टी')) {
    category = dict.POTTERY;
  }

  // Pure artisan names without parentheses
  let artisanName = cleanBilingualText(product.artisanName, lang);
  if (lang === 'en') {
    if (artisanName.includes('Ramayya') || product.artisanId === 'art-001') artisanName = 'Ramayya Achari';
    else if (artisanName.includes('Venkatesh') || product.artisanId === 'art-002') artisanName = 'Venkateshwarlu';
    else if (artisanName.includes('Budhram') || product.artisanId === 'art-003') artisanName = 'Budhram Jharia';
    else if (artisanName.includes('Gopal') || product.artisanId === 'art-004') artisanName = 'Gopal Lal';
  } else if (lang === 'te') {
    if (product.artisanId === 'art-001') artisanName = 'రామయ్య ఆచారి';
    else if (product.artisanId === 'art-002') artisanName = 'వెంకటేశ్వర్లు నేతన్న';
    else if (product.artisanId === 'art-003') artisanName = 'బుధరామ్ ఝరియా';
    else if (product.artisanId === 'art-004') artisanName = 'గోపాల్ లాల్ కుమావత్';
  } else if (lang === 'hi') {
    if (product.artisanId === 'art-001') artisanName = 'रामय्या आचारी';
    else if (product.artisanId === 'art-002') artisanName = 'वेंकटेश्वरलू';
    else if (product.artisanId === 'art-003') artisanName = 'बुधराम झरिया';
    else if (product.artisanId === 'art-004') artisanName = 'गोपाल लाल कुमावत';
  }

  // Pure region name
  let region = cleanBilingualText(product.region, lang);
  if (lang === 'en') {
    if (product.id.includes('kondapalli')) region = 'Kondapalli, Krishna District, Andhra Pradesh';
    else if (product.id.includes('pochampally')) region = 'Bhudan Pochampally, Yadadri, Telangana';
    else if (product.id.includes('dokra')) region = 'Bastar, Chhattisgarh';
    else if (product.id.includes('bluepottery')) region = 'Jaipur, Rajasthan';
  }

  // Pure material
  let material = cleanBilingualText(product.material, lang);
  if (lang === 'en') {
    if (product.id.includes('kondapalli')) material = 'White Poniki Wood, Organic Vegetable Pigments';
    else if (product.id.includes('pochampally')) material = '100% Pure Mulberry Silk, Golden Zari';
    else if (product.id.includes('dokra')) material = 'Bell Metal Alloy, Lost-Wax Clay Mold';
    else if (product.id.includes('bluepottery')) material = 'Quartz Stone Powder, Cobalt Glaze';
  }

  // Pure technique
  let craftTechnique = cleanBilingualText(product.craftTechnique, lang);
  if (lang === 'en') {
    if (product.id.includes('kondapalli')) craftTechnique = 'Traditional Hand Carving & Tamarind Joining';
    else if (product.id.includes('pochampally')) craftTechnique = 'Double Ikat Pit-loom Hand Weaving';
    else if (product.id.includes('dokra')) craftTechnique = 'Lost-Wax Hollow Metal Casting';
    else if (product.id.includes('bluepottery')) craftTechnique = 'Hand Formed Glaze & High Temp Kiln Baking';
  }

  // Dimensions
  let dimensions = cleanBilingualText(product.dimensions, lang);
  if (lang === 'en') {
    if (product.id.includes('kondapalli')) dimensions = 'Height: 12 inches, Width: 5 inches';
    else if (product.id.includes('pochampally')) dimensions = 'Length: 6.3 meters with blouse piece';
    else if (product.id.includes('dokra')) dimensions = 'Height: 8.5 inches, Length: 6 inches';
    else if (product.id.includes('bluepottery')) dimensions = 'Diameter: 10 inches circular';
  }

  // Time to make
  let timeToMake = cleanBilingualText(product.timeToMake, lang);
  if (lang === 'en') {
    if (product.id.includes('kondapalli')) timeToMake = '4 Days (Handmade)';
    else if (product.id.includes('pochampally')) timeToMake = '18 Days on Handloom';
    else if (product.id.includes('dokra')) timeToMake = '7 Days';
    else if (product.id.includes('bluepottery')) timeToMake = '5 Days';
  }

  return {
    id: product.id,
    title,
    shortDescription,
    fullDescription,
    category,
    material,
    craftTechnique,
    dimensions,
    timeToMake,
    region,
    artisanName,
    finalPrice: product.finalPrice,
    stockQuantity: product.stockQuantity,
    originalImageUrl: product.originalImageUrl,
    enhancedImageUrl: product.enhancedImageUrl,
  };
}
