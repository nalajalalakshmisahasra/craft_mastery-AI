/**
 * Craft Mastery Mobile — i18n string schema.
 *
 * Self-contained mobile dictionary mirroring the web app's multilingual
 * architecture (same conceptual shape: a typed schema + per-language locale
 * records). Currently supports English and Telugu as UI languages; every key
 * below is used by at least one screen.
 *
 * `{placeholders}` in values are interpolated by the `t()` function in
 * LanguageContext, e.g. t('greeting', { name: user.name }).
 */
export interface MobileStrings {
  // ── Welcome / Language selection ───────────────────────────────
  brandEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroSupport: string;
  hearWelcome: string;
  selectLanguage: string;
  enterBtn: string;
  welcomeGreeting: string;

  // ── Phone authentication ───────────────────────────────────────
  phoneStepBadge: string;
  signInTitle: string;
  authSubtitle: string;
  whoAreYou: string;
  roleArtisan: string;
  roleArtisanDesc: string;
  roleCustomer: string;
  roleCustomerDesc: string;
  accountInfo: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHelper: string;
  nameLabel: string;
  namePlaceholder: string;
  devTitle: string;
  devNote: string;
  devArtisanChip: string;
  devCustomerChip: string;
  devSelected: string;
  verifying: string;
  authSuccess: string;
  authError: string;
  verifyBtn: string;

  // ── Onboarding ─────────────────────────────────────────────────
  onboardStepBadge: string;
  onboardArtisanTitle: string;
  onboardCustomerTitle: string;
  onboardWelcome: string;
  specialtyLabel: string;
  interestsLabel: string;
  specialtyPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  preferencesLabel: string;
  voiceGuidance: string;
  voiceGuidanceDesc: string;
  finishBtn: string;
  suggestionWood: string;
  suggestionTextiles: string;
  suggestionMetal: string;
  suggestionPottery: string;
  suggestionGifts: string;
  suggestionDecor: string;
  suggestionApparel: string;
  suggestionBulk: string;
  defaultSpecialtyArtisan: string;
  defaultSpecialtyCustomer: string;
  defaultLocation: string;

  // ── Artisan dashboard ──────────────────────────────────────────
  workshopBadge: string;
  greeting: string;
  workshopSubtitle: string;
  heroSupport2: string;
  addCraftBtn: string;
  aiActive: string;
  aiOffline: string;
  snapshotTitle: string;
  statListings: string;
  statInquiries: string;
  healthPinging: string;
  healthConnected: string;
  healthNoKey: string;
  healthNote: string;
  catalogSection: string;
  catalogSubtitle: string;
  catalogLoading: string;
  catalogEmpty: string;
  catalogBody: string;
  openCatalog: string;
  inquiriesSection: string;
  inquiriesSubtitle: string;
  inquiriesLoading: string;
  inquiriesEmpty: string;
  inquiriesBody: string;
  viewInquiries: string;
  switchBuyer: string;
  signOut: string;

  // ── Artisan catalog ────────────────────────────────────────────
  catalogBadge: string;
  listingsBadge: string;
  myCraftsTitle: string;
  catalogSub: string;
  addNextCraft: string;
  addNextDesc: string;
  addListingBtn: string;
  publishedSection: string;
  publishedSubtitle: string;
  untitledCraft: string;
  defaultProductDesc: string;
  stockBadge: string;
  handicrafts: string;
  catalogErrorTitle: string;
  retryBtn: string;
  catalogEmptyTitle: string;
  catalogEmptyMessage: string;
  productPhotoA11y: string;

  // ── Artisan upload wizard ──────────────────────────────────────
  studioBadge: string;
  addCraftTitle: string;
  uploadSubtitle: string;
  stepCapture: string;
  stepDescribe: string;
  stepAiDraft: string;
  step1Label: string;
  step2Label: string;
  step3Label: string;
  photoAttached: string;
  captureTitle: string;
  captureHint: string;
  cameraBtn: string;
  galleryBtn: string;
  yourDescription: string;
  descPlaceholder: string;
  descHelper: string;
  aiAssisted: string;
  aiProcessing: string;
  aiIdle: string;
  extractBtn: string;
  aiErrorTitle: string;
  fieldProductName: string;
  fieldCategory: string;
  fieldMaterial: string;
  fieldTechnique: string;
  fieldDimensions: string;
  fieldWeight: string;
  fieldTimeToMake: string;
  missingTitle: string;
  missingDefault: string;
  aiDisclaimer: string;
  foundationNote: string;
  photoPreviewA11y: string;
  stepPricing?: string;
  stepStock?: string;
  stepReview?: string;
  stepPublish?: string;
  step4Label?: string;
  step5Label?: string;
  step6Label?: string;
  pricingTitle?: string;
  pricingSubtitle?: string;
  getPricingBtn?: string;
  pricingCalculating?: string;
  minPriceLabel?: string;
  maxPriceLabel?: string;
  recommendedPriceLabel?: string;
  pricingReasonLabel?: string;
  customPriceLabel?: string;
  customPriceHelper?: string;
  stockTitle?: string;
  stockSubtitle?: string;
  stockCountLabel?: string;
  artisanContactLabel?: string;
  regionOriginLabel?: string;
  customizationBadge?: string;
  reviewTitle?: string;
  reviewSubtitle?: string;
  publishCraftBtn?: string;
  publishingCraft?: string;
  publishSuccessTitle?: string;
  publishSuccessSubtitle?: string;
  viewInCatalogBtn?: string;
  addAnotherCraftBtn?: string;
  publishErrorTitle?: string;

  // ── Artisan messages ───────────────────────────────────────────
  inboxBadge: string;
  messagesTitle: string;
  messagesSub: string;
  conversationsStat: string;
  needingReply: string;
  autoTranslateNote: string;
  conversationsSection: string;
  inquiryPending: string;
  backToInbox: string;
  youArtisan: string;
  buyerLabel: string;
  originalPrefix: string;
  replyPlaceholder: string;
  sendBtn: string;
  translatingStatus: string;
  sentStatus: string;
  sendError: string;
  inboxEmptyTitle: string;
  inboxEmptyMessage: string;
  messagesErrorTitle: string;
  qtyLabel: string;

  // ── Customer marketplace ───────────────────────────────────────
  marketBadge: string;
  discoverTitle: string;
  marketSub: string;
  searchPlaceholder: string;
  searchBtn: string;
  aiSearchBadge: string;
  searchDefault: string;
  searchError: string;
  searchHonestNote: string;
  browseCategory: string;
  allCategory: string;
  availableSection: string;
  countSubtitle: string;
  marketDescFallback: string;
  masterMaker: string;
  indiaLabel: string;
  marketErrorTitle: string;
  categoryEmptyTitle: string;
  categoryEmptyMessage: string;
  viewAllCrafts: string;
  marketEmptyTitle: string;
  marketEmptyMessage: string;
  searchA11y: string;

  // ── Customer product detail ────────────────────────────────────
  productDetailTitle: string;
  backToMarket: string;
  backToInquiries: string;
  piecesAvailable: string;
  materialLabel: string;
  techniqueLabel: string;
  dimensionsLabel: string;
  craftTimeLabel: string;
  regionLabel: string;
  artisanInfoTitle: string;
  verifiedArtisan: string;
  askAiTitle: string;
  askAiSub: string;
  askAiBtn: string;
  howToOrderPrompt: string;
  contactArtisanPrompt: string;
  bulkOrderPrompt: string;
  customQuestionPlaceholder: string;
  askAiActionBtn: string;
  aiThinking: string;
  aiGuidanceActionInquire: string;
  sendInquiryBtn: string;
  inquiryModalTitle: string;
  inquiryModalSub: string;
  quantityLabel: string;
  inquiryNoteLabel: string;
  inquiryDefaultNote: string;
  sendingInquiry: string;
  inquirySentSuccess: string;
  inquirySuccessMessage: string;
  viewMyInquiries: string;
  closeBtn: string;
  viewDetailsBtn: string;
  replyToArtisanPlaceholder: string;
  buyerYou: string;
  listenBtn: string;
  stopListeningBtn: string;

  // ── Customer inquiries ─────────────────────────────────────────
  inquiriesBadge: string;
  inquiriesTitle: string;
  inquiriesSub: string;
  totalInquiries: string;
  inProgress: string;
  pending: string;
  requestsSection: string;
  requestsSubtitle: string;
  artisanPrefix: string;
  noMessagesYet: string;
  artisanLabel: string;
  inquiriesErrorTitle: string;
  inquiriesEmptyTitle: string;
  inquiriesEmptyMessage: string;

  // ── Customer profile ───────────────────────────────────────────
  profileBadge: string;
  profileTitle: string;
  profileSub: string;
  profileUnavailable: string;
  accountSection: string;
  switchDesc: string;
  switchArtisan: string;
  sessionLabel: string;

  // ── Hero / Pitch Introduction (Stage 6) ────────────────────────
  pitchStepIndicator: string;
  pitchSkip: string;
  pitchBack: string;
  pitchNext: string;
  pitchGetStarted: string;

  // Screen 1: Hero
  pitchHeroEyebrow: string;
  pitchHeroHeadline1: string;
  pitchHeroHeadline2: string;
  pitchHeroSupport: string;
  pitchHeroCta: string;

  // Screen 2: Why Craft Mastery
  pitchWhyEyebrow: string;
  pitchWhyHeadline: string;
  pitchWhyLead: string;
  pitchWhyPoint1Title: string;
  pitchWhyPoint1Body: string;
  pitchWhyPoint2Title: string;
  pitchWhyPoint2Body: string;
  pitchWhyPoint3Title: string;
  pitchWhyPoint3Body: string;
  pitchWhyCta: string;

  // Screen 3: How It Works
  pitchHowEyebrow: string;
  pitchHowHeadline: string;
  pitchHowLead: string;
  pitchHowSequence: string;
  pitchStep1Title: string;
  pitchStep1Body: string;
  pitchStep2Title: string;
  pitchStep2Body: string;
  pitchStep3Title: string;
  pitchStep3Body: string;
  pitchStep4Title: string;
  pitchStep4Body: string;
  pitchHowCta: string;

  // Screen 4: Impact
  pitchImpactEyebrow: string;
  pitchImpactHeadline: string;
  pitchImpactLead: string;
  pitchPillar1Title: string;
  pitchPillar1Body: string;
  pitchPillar2Title: string;
  pitchPillar2Body: string;
  pitchPillar3Title: string;
  pitchPillar3Body: string;
  pitchPillar4Title: string;
  pitchPillar4Body: string;
  pitchImpactCta: string;

  // Screen 5: FAQ & Get Started
  pitchFaqEyebrow: string;
  pitchFaqHeadline: string;
  pitchFaqLead: string;
  pitchFaqQ1: string;
  pitchFaqA1: string;
  pitchFaqQ2: string;
  pitchFaqA2: string;
  pitchFaqQ3: string;
  pitchFaqA3: string;
  pitchFaqQ4: string;
  pitchFaqA4: string;
  pitchFaqQ5: string;
  pitchFaqA5: string;
}