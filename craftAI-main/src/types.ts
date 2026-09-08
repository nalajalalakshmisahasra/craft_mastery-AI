export type SupportedLanguage = 
  | 'te' // Telugu
  | 'hi' // Hindi
  | 'en' // English
  | 'ta' // Tamil
  | 'kn' // Kannada
  | 'mr' // Marathi
  | 'bn' // Bengali
  | 'ml' // Malayalam
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'as' // Assamese
  | 'ur'; // Urdu

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export type UserRole = 'ARTISAN' | 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  language: SupportedLanguage;
  location?: string;
  craftSpecialty?: string;
  avatarUrl?: string;
}

export type ProductStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'SOLD_OUT';

export interface ProductDimensions {
  length?: string;
  width?: string;
  height?: string;
  weight?: string;
}

export interface CraftProduct {
  id: string;
  artisanId: string;
  artisanName: string;
  artisanPhone: string;
  artisanLanguage: SupportedLanguage;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  material: string;
  craftTechnique: string;
  dimensions: string;
  weight: string;
  timeToMake: string;
  region: string;
  originalImageUrl: string;
  enhancedImageUrl: string;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  recommendedPrice: number;
  finalPrice: number;
  pricingReason: string;
  stockQuantity: number;
  status: ProductStatus;
  customizationAvailable: boolean;
  translations?: Partial<Record<SupportedLanguage, {
    title: string;
    shortDescription: string;
    fullDescription: string;
  }>>;
  createdAt: string;
}

export interface IncompleteInfoCheck {
  isComplete: boolean;
  missingFields: string[];
  followUpQuestion: string;
  extractedData: {
    productName?: string;
    category?: string;
    material?: string;
    craftTechnique?: string;
    dimensions?: string;
    weight?: string;
    timeToMake?: string;
    features?: string[];
  };
}

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  senderRole: 'ARTISAN' | 'CUSTOMER';
  senderName: string;
  originalText: string;
  originalLang: SupportedLanguage;
  translatedText: string;
  targetLang: SupportedLanguage;
  timestamp: string;
}

export interface ProductInquiry {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLanguage: SupportedLanguage;
  artisanId: string;
  artisanName: string;
  artisanLanguage: SupportedLanguage;
  requestedQuantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED' | 'IN_PROGRESS';
  messages: InquiryMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ArtisanStep = 
  | 'WELCOME_PROMPT'
  | 'PHOTO_CAPTURE'
  | 'IMAGE_ENHANCE'
  | 'VOICE_INFO'
  | 'INFO_REVIEW'
  | 'DESCRIPTION_GEN'
  | 'PRICING'
  | 'CONTACT_VERIFY'
  | 'PREVIEW'
  | 'SUCCESS';
