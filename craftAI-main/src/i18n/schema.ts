import { SupportedLanguage } from '../types';

export interface TranslationSchema {
  // App branding
  tagline: string;
  selectLanguage: string;
  continueBtn: string;
  welcomeTitle: string;
  welcomeSubtitle: string;

  // Auth & Roles
  loginTitle: string;
  registerTitle: string;
  phoneNumber: string;
  enterOtp: string;
  sendOtp: string;
  verifyOtp: string;
  otpSentSuccess: string;
  whoAreYou: string;
  roleArtisan: string;
  roleArtisanDesc: string;
  roleCustomer: string;
  roleCustomerDesc: string;
  loginAs: string;
  quickTestLogin: string;
  accountCreatedSuccess: string;
  fullNameLabel: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  createAccountBtn: string;
  logInBtn: string;
  quickDemoArtisanBtn: string;
  quickDemoCustomerBtn: string;
  demoLoginNotice: string;
  demoLoginTitle: string;
  checkingAuth: string;
  logoutBtn: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingStepLanguage: string;
  onboardingStepProfile: string;
  onboardingStepPreferences: string;
  onboardingCompleteBtn: string;
  craftSpecialtyLabel: string;
  craftSpecialtyPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  voiceGuidanceLabel: string;
  voiceGuidanceDesc: string;
  shoppingInterestsLabel: string;
  shoppingInterestsPlaceholder: string;

  // Categories
  categoryAll: string;
  categoryWood: string;
  categoryHandloom: string;
  categoryMetal: string;
  categoryPottery: string;
  categoryPaintings: string;
  categoryLeather: string;

  // Dashboard Navigation Tabs
  tabOverview: string;
  tabCatalog: string;
  tabInquiries: string;
  tabTranslations: string;
  tabFinances: string;
  backToOverviewBtn: string;

  // AI Greetings & Prompts
  artisanGreeting: string;
  artisanActionPrompt: string;
  uploadProductBtn: string;
  checkMessagesBtn: string;
  customerGreeting: string;
  customerSearchPrompt: string;

  // Artisan Upload Flow
  stepPhoto: string;
  stepEnhance: string;
  stepInfo: string;
  stepDescription: string;
  stepPrice: string;
  stepPublish: string;

  photoPrompt: string;
  takePhotoBtn: string;
  chooseGalleryBtn: string;
  samplePhotoBtn: string;

  enhancingTitle: string;
  enhancedSuccess: string;
  originalLabel: string;
  enhancedLabel: string;
  useEnhancedBtn: string;
  retakeBtn: string;

  voiceInfoPrompt: string;
  speakNowBtn: string;
  listening: string;
  stopListeningBtn: string;
  orTypeHere: string;
  analyzeWithAiBtn: string;

  missingInfoAlert: string;
  moreInfoNeeded: string;
  submitFollowUpBtn: string;

  descriptionTitle: string;
  targetLangNotice: string;
  generateDescBtn: string;

  pricingTitle: string;
  aiSuggestedRange: string;
  suggestedPrice: string;
  pricingExplanation: string;
  acceptAiPriceBtn: string;
  enterCustomPriceBtn: string;
  customPricePlaceholder: string;

  mobileVerifyTitle: string;
  mobileConfirmDesc: string;
  previewBtn: string;

  previewTitle: string;
  publishProductBtn: string;
  congratulations: string;
  productPublishedDesc: string;
  viewInMarketplaceBtn: string;
  backToDashboardBtn: string;

  // Customer Flow
  searchPlaceholder: string;
  categories: string;
  recommendedForYou: string;
  selectAProductPrompt: string;
  askAiFloatingBtn: string;
  productDetails: string;
  artisanInfo: string;
  specifications: string;
  pricePerUnit: string;
  stockAvailable: string;
  handmadeBy: string;

  // AI Assistant Modal
  aiAssistantTitle: string;
  askAiQuestionPlaceholder: string;
  howToOrderQuestion: string;
  contactArtisanQuestion: string;
  bulkDiscountQuestion: string;
  materialsUsedQuestion: string;

  // Inquiries & Bulk Order
  sendInquiryTitle: string;
  quantityNeeded: string;
  inquiryMessagePlaceholder: string;
  sendInquiryBtn: string;
  inquirySentSuccess: string;
  bulkBadge: string;

  // Messages & 2-Way Translation
  inboxTitle: string;
  customerSpoke: string;
  translatedToYourLang: string;
  replyInYourLang: string;
  sendReplyBtn: string;
  aiTranslationBadge: string;
  originalMessageLabel: string;
  translatedMessageLabel: string;
  listenAudioBtn: string;

  // Universal UI and Navigation
  cancelBtn: string;
  backBtn: string;
  searchBtn: string;
  listenBtn: string;
  askBtn: string;

  // Marketplace & Details Badges & Labels
  aiConciergeBadge: string;
  authenticCraftBadge: string;
  detailsAndAiBtn: string;
  backToMarketplaceBtn: string;
  verifiedHandmadeBadge: string;
  smartGuidanceBadge: string;
  materialLabel: string;
  techniqueLabel: string;
  dimensionsLabel: string;
  craftTimeLabel: string;
  orderOrInquiryHelp: string;
  askAiToOrderOrContact: string;
  bulkPiecesInquiry: string;
  piecesAvailable: string;
  liveListingBadge: string;
  aiGuidanceThinking: string;
  aiRecommendationTitle: string;
  sendBulkInquiryActionBtn: string;
  contactArtisanModalTitle: string;
  bulkNotePrompt: string;
  editPhoneBtn: string;

  // Artisan Dashboard & Stats
  artisanCopilotBadge: string;
  artisanUploadDesc: string;
  newInquiriesCountBadge: string;
  artisanMessagesDesc: string;
  liveCraftsLabel: string;
  inquiriesStatLabel: string;
  aiTranslationsStatLabel: string;
  estValueLabel: string;
  activeMarketStatus: string;
  languagesCountLabel: string;
  autoLiveTranslationDesc: string;
  directBankDepositDesc: string;
  myCraftsHeading: string;
  myCraftsSubheading: string;
  addNewCraftBtn: string;
  sellingPriceLabel: string;
  stockLabel: string;
  viewCraftDetailsBtn: string;

  // Upload Wizard Labels
  stepByStepUploadTitle: string;
  cameraOrGallery: string;
  fileUploadLabel: string;
  sampleCraftPrompt: string;
  choosePresetBtn: string;
  photoOptimizedDesc: string;

  // System & Status
  loading: string;
  errorOccurred: string;
  successLabel: string;
}
