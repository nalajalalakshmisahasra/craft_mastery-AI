import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_INQUIRIES } from './src/data/mockData.ts';
import { provisionRole, requireAuth, requireRole, samePhone } from './serverAuth.ts';

dotenv.config();

const app = express();
const configuredPort = process.env.PORT || '3000';
const PORT = Number(configuredPort);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`PORT must be an integer between 1 and 65535; received "${configuredPort}".`);
}

const REQUEST_WINDOW_MS = 60_000;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_STRING_LENGTH = 5000;
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ALLOWED_ORIGINS?.trim()) {
    throw new Error('ALLOWED_ORIGINS must be configured in production.');
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() && !process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    throw new Error(
      'Firebase Admin credentials are required in production: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }
}

function clientError(res: express.Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function rateLimit(name: string, limit: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    if (requestBuckets.size > 10000) {
      for (const [bucketKey, bucketValue] of requestBuckets) {
        if (bucketValue.resetAt <= now) requestBuckets.delete(bucketKey);
      }
    }
    const key = `${name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const bucket = requestBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(key, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return clientError(res, 429, 'Too many requests. Please try again later.');
    }
    return next();
  };
}

function validateBody(allowed: string[], required: string[] = []) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return clientError(res, 400, 'Invalid request body');
    }
    const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
    if (unknown.length > 0 || required.some((key) => body[key] === undefined)) {
      return clientError(res, 400, 'Invalid request fields');
    }
    return next();
  };
}

function validateString(field: string, max = MAX_STRING_LENGTH, required = false) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const value = req.body?.[field];
    if (value === undefined && !required) return next();
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
      return clientError(res, 400, `Invalid ${field}`);
    }
    return next();
  };
}

function validateParam(field: string, pattern: RegExp) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!pattern.test(req.params[field] || '')) return clientError(res, 400, 'Invalid route parameter');
    return next();
  };
}

function rejectOversizedRouteBodies(req: express.Request, res: express.Response, next: express.NextFunction) {
  const contentLength = Number(req.header('content-length') || 0);
  if (!contentLength) return next();
  const route = req.url.replace(/^\/api\/v1/, '/api');
  const limit = route.startsWith('/api/ai/')
    ? 256 * 1024
    : route.startsWith('/api/users')
      ? 32 * 1024
      : route.startsWith('/api/inquiries')
        ? 256 * 1024
        : route.startsWith('/api/products')
          ? 20 * 1024 * 1024
          : 256 * 1024;
  if (contentLength > limit) return clientError(res, 413, 'Request body is too large');
  return next();
}

function validateProductInput(req: express.Request, res: express.Response, next: express.NextFunction) {
  const body = req.body;
  const stringFields = PRODUCT_FIELDS.filter((field) => ![
    'suggestedPriceMin', 'suggestedPriceMax', 'recommendedPrice', 'finalPrice', 'stockQuantity',
    'customizationAvailable', 'translations',
  ].includes(field));
  if (stringFields.some((field) => body[field] !== undefined &&
      (typeof body[field] !== 'string' || body[field].length > MAX_STRING_LENGTH))) {
    return clientError(res, 400, 'Invalid product fields');
  }
  for (const field of ['suggestedPriceMin', 'suggestedPriceMax', 'recommendedPrice', 'finalPrice', 'stockQuantity']) {
    if (body[field] !== undefined && (typeof body[field] !== 'number' || !Number.isFinite(body[field]) || body[field] < 0)) {
      return clientError(res, 400, 'Invalid product fields');
    }
  }
  if (body.customizationAvailable !== undefined && typeof body.customizationAvailable !== 'boolean') {
    return clientError(res, 400, 'Invalid product fields');
  }
  return next();
}

function validateInquiryInput(req: express.Request, res: express.Response, next: express.NextFunction) {
  const quantity = req.body?.requestedQuantity;
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)) {
    return clientError(res, 400, 'Invalid requested quantity');
  }
  for (const field of ['productTitle', 'productImage', 'customerName', 'customerPhone', 'artisanName']) {
    if (req.body?.[field] !== undefined && typeof req.body[field] !== 'string') return clientError(res, 400, 'Invalid inquiry fields');
  }
  return next();
}

function validateMessageInput(req: express.Request, res: express.Response, next: express.NextFunction) {
  const text = req.body?.originalText ?? req.body?.text;
  if (typeof text !== 'string' || text.trim().length === 0 || text.length > 5000) {
    return clientError(res, 400, 'Invalid message text');
  }
  return next();
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.method === 'OPTIONS') return res.sendStatus(origin && ALLOWED_ORIGINS.has(origin) ? 204 : 403);
  return next();
});
app.use(rateLimit('api', 120));
app.use(rejectOversizedRouteBodies);
app.use(express.json({ limit: '20mb', strict: true }));
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err instanceof SyntaxError) {
    return clientError(res, 400, err?.type === 'entity.too.large' ? 'Request body is too large' : 'Malformed JSON');
  }
  return next(err);
});

// Support both /api/* and /api/v1/* (for Expo mobile & web clients)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/v1/')) {
    req.url = req.url.replace('/api/v1/', '/api/');
  }
  next();
});

// Persistence Setup
const DATA_DIR = path.resolve(process.env.STORE_DATA_DIR || path.join(process.cwd(), 'data'));
const DATA_FILE = path.join(DATA_DIR, 'craft_mastery_store.json');
const MEDIA_DIR = path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(DATA_DIR, 'private-media'));
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 2;
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const DEMO_DATA_ENABLED = process.env.NODE_ENV !== 'production' && process.env.DEMO_DATA_ENABLED === 'true';
const DEMO_PRODUCT_IDS = new Set([
  'prod-kondapalli-01', 'prod-pochampally-02', 'prod-dokra-03', 'prod-bluepottery-04',
  'prod-channapatna-05', 'prod-bidriware-06', 'prod-tanjore-07', 'prod-walnut-08',
  'prod-kalamkari-09', 'prod-tholubommalata-10', 'prod-pashmina-11', 'prod-madhubani-12',
]);
const DEMO_INQUIRY_IDS = new Set(['inq-bulk-001', 'inq-bulk-002']);

let productsDb: any[] = [];
let inquiriesDb: any[] = [];
let usersDb: any[] = [];
let filesDb: Array<{
  id: string;
  productId: string;
  ownerUid: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
  storageKey: string;
  createdAt: string;
}> = [];

function saveStoreToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          products: productsDb,
          inquiries: inquiriesDb,
          users: usersDb,
          files: filesDb,
          savedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to save store to disk:', err);
  }
}

function imageSignature(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function isStructurallyValidImage(buffer: Buffer, mimeType: 'image/jpeg' | 'image/png' | 'image/webp'): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 5 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }
  if (mimeType === 'image/png') {
    return buffer.length >= 33 && buffer.toString('ascii', 12, 16) === 'IHDR' && buffer.includes(Buffer.from('IEND'));
  }
  return buffer.length >= 20 && buffer.readUInt32LE(4) <= buffer.length - 8;
}

function storeImageDataUrl(dataUrl: unknown, productId: string, ownerUid: string): string | null {
  if (typeof dataUrl !== 'string' || !dataUrl) return null;
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) throw new Error('Unsupported image format');
  const declaredMime = match[1] as 'image/jpeg' | 'image/png' | 'image/webp';
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error('Image exceeds the permitted size');
  const actualMime = imageSignature(buffer);
  if (!actualMime || actualMime !== declaredMime || !isStructurallyValidImage(buffer, actualMime)) {
    throw new Error('Image content does not match its declared type');
  }

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const extension = actualMime === 'image/jpeg' ? 'jpg' : actualMime.slice('image/'.length);
  const storageKey = `${id}.${extension}`;
  fs.writeFileSync(path.join(MEDIA_DIR, storageKey), buffer, { flag: 'wx', mode: 0o600 });
  filesDb.push({ id, productId, ownerUid, mimeType: actualMime, size: buffer.length, storageKey, createdAt: new Date().toISOString() });
  return `/api/files/${id}`;
}

function removeStoredFile(file: (typeof filesDb)[number]): void {
  const absolutePath = path.join(MEDIA_DIR, file.storageKey);
  if (path.dirname(absolutePath) !== path.resolve(MEDIA_DIR)) return;
  try { fs.rmSync(absolutePath, { force: true }); } catch (err) { console.error('[Media] Failed to remove file:', err); }
}

function resolveMediaReference(value: unknown, auth: NonNullable<Express.Request['auth']>): string {
  if (typeof value !== 'string' || !value.startsWith('/api/files/')) return typeof value === 'string' ? value : '';
  const file = validateStoredFileAccess(value.slice('/api/files/'.length), auth);
  if (!file || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file.storageKey)) return '';
  try {
    const bytes = fs.readFileSync(path.join(MEDIA_DIR, file.storageKey));
    return `data:${file.mimeType};base64,${bytes.toString('base64')}`;
  } catch (err) {
    console.error('[Media] Failed to resolve stored reference:', err);
    return '';
  }
}

function hydrateProductMedia(product: any, auth: NonNullable<Express.Request['auth']>): any {
  return {
    ...product,
    originalImageUrl: resolveMediaReference(product.originalImageUrl, auth),
    enhancedImageUrl: resolveMediaReference(product.enhancedImageUrl, auth),
  };
}

function storeProductMedia(product: any, ownerUid: string): any {
  const values = [product.originalImageUrl, product.enhancedImageUrl].filter(Boolean);
  if (values.length > MAX_IMAGES_PER_PRODUCT) throw new Error('Too many images');
  const storedKeys: string[] = [];
  try {
    const originalImageUrl = storeImageDataUrl(product.originalImageUrl, product.id, ownerUid);
    if (originalImageUrl) storedKeys.push(originalImageUrl);
    const enhancedImageUrl = storeImageDataUrl(product.enhancedImageUrl, product.id, ownerUid);
    if (enhancedImageUrl) storedKeys.push(enhancedImageUrl);
    return { ...product, originalImageUrl, enhancedImageUrl };
  } catch (err) {
    for (const reference of storedKeys) {
      const file = filesDb.find((item) => `/api/files/${item.id}` === reference);
      if (file) {
        removeStoredFile(file);
        filesDb = filesDb.filter((item) => item.id !== file.id);
      }
    }
    throw err;
  }
}

function reconcileStoredFiles(): void {
  const validFiles = filesDb.filter((file) => {
    return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file.storageKey) && fs.existsSync(path.join(MEDIA_DIR, file.storageKey));
  });
  const validReferences = new Set(validFiles.map((file) => `/api/files/${file.id}`));
  let changed = validFiles.length !== filesDb.length;
  filesDb = validFiles;
  for (const product of productsDb) {
    for (const field of ['originalImageUrl', 'enhancedImageUrl']) {
      if (typeof product[field] === 'string' && product[field].startsWith('/api/files/') && !validReferences.has(product[field])) {
        product[field] = '';
        changed = true;
      }
    }
  }
  if (changed) saveStoreToDisk();
}

function isDemoProduct(product: any): boolean {
  return DEMO_PRODUCT_IDS.has(product?.id);
}

function visibleProductsFor(auth: NonNullable<Express.Request['auth']>): any[] {
  const products = DEMO_DATA_ENABLED ? productsDb : productsDb.filter((product) => !isDemoProduct(product));
  if (auth.role === 'ADMIN') return products.map((product) => hydrateProductMedia(product, auth));
  if (auth.role === 'ARTISAN') {
    return products
      .filter((product) => product.artisanId === auth.uid || samePhone(product.artisanPhone, auth.phone))
      .map((product) => hydrateProductMedia(product, auth));
  }
  return products.map(({ artisanId, artisanPhone, ...product }) => hydrateProductMedia(product, auth));
}

function visibleInquiriesFor(auth: NonNullable<Express.Request['auth']>): any[] {
  const inquiries = DEMO_DATA_ENABLED
    ? inquiriesDb
    : inquiriesDb.filter((inquiry) => !DEMO_INQUIRY_IDS.has(inquiry.id));
  if (auth.role === 'ADMIN') return inquiries;
  const ownedProductIds = new Set(
    visibleProductsFor({ ...auth, role: 'ARTISAN' })
      .map((product) => product.id)
  );
  return inquiries.filter((inquiry) =>
    auth.role === 'CUSTOMER'
      ? inquiry.customerId === auth.uid || samePhone(inquiry.customerPhone, auth.phone)
      : ownedProductIds.has(inquiry.productId) ||
        inquiry.artisanId === auth.uid ||
        samePhone(inquiry.artisanPhone, auth.phone)
  );
}

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        productsDb = parsed.products;
      }
      if (Array.isArray(parsed.inquiries) && parsed.inquiries.length > 0) {
        inquiriesDb = parsed.inquiries;
      }
      if (Array.isArray(parsed.users)) {
        usersDb = parsed.users;
      }
      if (Array.isArray(parsed.files)) {
        filesDb = parsed.files;
      }
      console.log(`[Store] Loaded ${productsDb.length} products, ${inquiriesDb.length} inquiries, ${usersDb.length} users from disk.`);
      return true;
    }
  } catch (err) {
    console.error('Failed to load store from disk:', err);
  }
  return false;
}
function validateStoredFileAccess(fileId: string, auth: NonNullable<Express.Request['auth']>) {
  const file = filesDb.find((item) => item.id === fileId);
  if (!file) return null;
  if (auth.role === 'ADMIN' || file.ownerUid === auth.uid) return file;
  const product = productsDb.find((item) => item.id === file.productId);
  if (auth.role === 'CUSTOMER' && product?.status === 'PUBLISHED') return file;
  return null;
}

// Lazy Gemini AI initialization with aistudio-build User-Agent
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper language mapper
const GEMINI_MODEL = 'gemini-3.8-flash';

const LANGUAGE_NAMES: Record<string, string> = {
  te: 'Telugu (తెలుగు)',
  hi: 'Hindi (हिन्दी)',
  en: 'English',
  ta: 'Tamil (தமிழ்)',
  kn: 'Kannada (ಕನ್ನಡ)',
  mr: 'Marathi (मराठी)',
  bn: 'Bengali (বাংলা)',
  ml: 'Malayalam (മലയാളം)',
  gu: 'Gujarati (ગુજરાતી)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  as: 'Assamese (অসমীয়া)',
  ur: 'Urdu (اردو)',
};
const SUPPORTED_LANGUAGES = new Set(Object.keys(LANGUAGE_NAMES));
const AI_PRODUCT_FIELDS = ['productName', 'category', 'material', 'craftTechnique', 'dimensions', 'weight', 'timeToMake', 'features'];
const PRODUCT_FIELDS = [
  'title', 'shortDescription', 'fullDescription', 'category', 'material', 'craftTechnique', 'dimensions',
  'weight', 'timeToMake', 'region', 'originalImageUrl', 'enhancedImageUrl', 'suggestedPriceMin',
  'suggestedPriceMax', 'recommendedPrice', 'finalPrice', 'pricingReason', 'stockQuantity',
  'customizationAvailable', 'translations',
];

function validateLanguage(field: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const language = req.body?.[field];
    if (language !== undefined && (typeof language !== 'string' || !SUPPORTED_LANGUAGES.has(language))) {
      return clientError(res, 400, `Invalid ${field}`);
    }
    return next();
  };
}

function validateAIProductData(req: express.Request, res: express.Response, next: express.NextFunction) {
  const productData = req.body?.productData;
  if (!productData || typeof productData !== 'object' || Array.isArray(productData)) {
    return clientError(res, 400, 'Invalid product data');
  }
  if (Object.keys(productData).some((key) => !AI_PRODUCT_FIELDS.includes(key))) {
    return clientError(res, 400, 'Invalid product data');
  }
  for (const field of AI_PRODUCT_FIELDS) {
    if (field !== 'features' && productData[field] !== undefined &&
        (typeof productData[field] !== 'string' || productData[field].length > 1000)) {
      return clientError(res, 400, 'Invalid product data');
    }
  }
  if (productData.features !== undefined &&
      (!Array.isArray(productData.features) || productData.features.length > 20 ||
        productData.features.some((item: unknown) => typeof item !== 'string' || item.length > 300))) {
    return clientError(res, 400, 'Invalid product data');
  }
  return next();
}

function validateConversationHistory(req: express.Request, res: express.Response, next: express.NextFunction) {
  const history = req.body?.conversationHistory;
  if (history !== undefined && (!Array.isArray(history) || history.length > 20 || history.some((item) => {
    return !item || typeof item !== 'object' || typeof item.role !== 'string' ||
      typeof item.content !== 'string' || item.content.length > 2000;
  }))) {
    return clientError(res, 400, 'Invalid conversation history');
  }
  return next();
}

function validateGuidanceProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
  const product = req.body?.product;
  if (product === undefined) {
    if (typeof req.body?.productId !== 'string' || req.body.productId.length > 128 ||
        typeof req.body?.productTitle !== 'string' || req.body.productTitle.length > 1000 ||
        typeof req.body?.intent !== 'string' || req.body.intent.length > 100 ||
        (req.body.customQuestion !== undefined && (typeof req.body.customQuestion !== 'string' || req.body.customQuestion.length > 2000))) {
      return clientError(res, 400, 'Invalid product guidance request');
    }
    return next();
  }
  if (typeof product !== 'object' || Array.isArray(product)) {
    return clientError(res, 400, 'Invalid product');
  }
  const allowed = [
    'id', 'title', 'finalPrice', 'material', 'craftTechnique', 'timeToMake', 'region', 'artisanName',
    'artisanId', 'artisanPhone', 'artisanLanguage', 'category', 'shortDescription', 'fullDescription',
    'dimensions', 'weight', 'stockQuantity', 'status', 'translations',
  ];
  if (Object.keys(product).some((key) => !allowed.includes(key))) return clientError(res, 400, 'Invalid product');
  for (const key of allowed) {
    if (product[key] !== undefined && typeof product[key] !== 'string' && typeof product[key] !== 'number') {
      return clientError(res, 400, 'Invalid product');
    }
    if (typeof product[key] === 'string' && product[key].length > 1000) return clientError(res, 400, 'Invalid product');
  }
  return next();
}

const aiRateLimit = rateLimit('ai', 12);
const mutationRateLimit = rateLimit('mutation', 30);
const authRateLimit = rateLimit('auth', 60);

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Craft Mastery Fullstack API',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Service configuration status (safe health check without exposing secrets)
app.get('/api/services/status', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      removeBackground: Boolean(
        process.env['remove background_API'] ||
        process.env.REMOVE_BACKGROUND_API ||
        process.env.REMOVE_BG_API_KEY
      ),
      firebase: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
      database: Boolean(process.env.DATABASE_URL),
    },
    endpoints: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
      aiServiceUrl: process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001',
    },
  });
});

// All application data, AI, profile, and mutation routes require a verified identity.
app.use('/api', authRateLimit, requireAuth);
app.use('/api/ai', aiRateLimit);
app.use('/api/products', mutationRateLimit);
app.use('/api/inquiries', mutationRateLimit);
app.use('/api/users', mutationRateLimit);

app.get('/api/files/:id', validateParam('id', /^[0-9a-f-]{36}$/), (req, res) => {
  const file = validateStoredFileAccess(req.params.id, req.auth!);
  if (!file || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file.storageKey)) {
    return clientError(res, 404, 'File not found');
  }
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Cache-Control', 'private, no-store');
  return res.sendFile(file.storageKey, { root: MEDIA_DIR, dotfiles: 'deny' });
});

app.delete('/api/files/:id', requireRole('ARTISAN', 'ADMIN'), validateParam('id', /^[0-9a-f-]{36}$/), (req, res) => {
  const file = filesDb.find((item) => item.id === req.params.id);
  if (!file || (req.auth!.role !== 'ADMIN' && file.ownerUid !== req.auth!.uid)) {
    return clientError(res, 404, 'File not found');
  }
  removeStoredFile(file);
  filesDb = filesDb.filter((item) => item.id !== file.id);
  for (const product of productsDb) {
    if (product.originalImageUrl === `/api/files/${file.id}`) product.originalImageUrl = '';
    if (product.enhancedImageUrl === `/api/files/${file.id}`) product.enhancedImageUrl = '';
  }
  saveStoreToDisk();
  return res.status(204).send();
});

// 2. AI Product Information Extraction & Incomplete Info Detection
app.post('/api/ai/extract-info', validateBody(['transcript', 'language', 'conversationHistory'], ['transcript']), validateString('transcript', 12000, true), validateLanguage('language'), validateConversationHistory, async (req, res) => {
  try {
    const { transcript, language = 'te', conversationHistory = [] } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const ai = getGemini();
    const langName = LANGUAGE_NAMES[language] || 'Telugu';

    if (ai) {
      const prompt = `
You are Craft Mastery's AI Craft Assistant. An artisan has spoken or written about their handcrafted product.
Artisan's Native Language: ${langName} (Code: ${language}).

Artisan's Current Statement:
"${transcript}"

Previous Conversation context (if any):
${JSON.stringify(conversationHistory)}

YOUR TASKS:
1. Extract all identifiable craft details:
   - productName: Name or description of craft
   - category: One of [Wooden Crafts, Handloom Textiles, Metal Crafts, Pottery & Ceramics, Leather Crafts, Jewelry, Stone Carving, Paintings, Other]
   - material: Materials used (e.g. Mango wood, Poniki wood, Mulberry silk, Bell metal, Clay, etc.)
   - craftTechnique: Traditional technique used (e.g. Hand carving, Double ikat handloom, Lost-wax casting, Blue pottery)
   - dimensions: Approximate size/height/width
   - weight: Approximate weight
   - timeToMake: Estimated time to craft one piece
   - features: Array of distinct handmade qualities

2. INCOMPLETE INFORMATION CHECK:
   Is the description sufficiently complete to publish a professional e-commerce product?
   A complete listing REQUIRES at least:
   - Name/Type of product
   - Specific Material used
   - Approximate Dimensions/Size OR Time to make OR handmade technique details.

   If vital details are missing:
   - Set "isComplete": false
   - List missing fields in "missingFields" (e.g., ["material", "dimensions"])
   - Formulate a polite, warm, encouraging follow-up question in the artisan's native language (${langName}) asking SPECIFICALLY for the missing details. For example in Telugu: "నేను ఇది చేతితో చేసిన చెక్క బొమ్మ అని అర్థం చేసుకున్నాను. మీరు దీనికి ఏ చెక్క ఉపయోగించారు మరియు సుమారు పరిమాణం ఎంత ఉంటుందో చెప్పగలరా?"

   If sufficient information has been provided:
   - Set "isComplete": true
   - Set "missingFields": []
   - "followUpQuestion": ""

Respond ONLY with valid JSON matching this schema:
{
  "isComplete": boolean,
  "missingFields": string[],
  "followUpQuestion": string,
  "extractedData": {
    "productName": string,
    "category": string,
    "material": string,
    "craftTechnique": string,
    "dimensions": string,
    "weight": string,
    "timeToMake": string,
    "features": string[]
  }
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '{}';
      const result = JSON.parse(text);
      return res.json(result);
    }

    // Fallback if Gemini key not set
    const lower = transcript.toLowerCase();
    const isShort = transcript.trim().split(/\s+/).length < 7;
    const hasMaterial = /wood|silk|clay|cotton|brass|చెక్క|పట్టు|మట్టి|ఇత్తడి|लकड़ी|रेशम|पीतल/.test(lower);
    const hasDimensions = /inch|cm|meter|size|kg|gram|అంగుళాలు|గ్రాములు|కిలో|इंच|ग्राम/.test(lower);

    const isComplete = !isShort && hasMaterial;
    const missing: string[] = [];
    if (!hasMaterial) missing.push('material');
    if (!hasDimensions) missing.push('dimensions');

    let followUp = '';
    if (!isComplete) {
      if (language === 'te') {
        followUp = 'నేను మీ వస్తువు వివరాలను విన్నాను. అయితే దీనికి ఉపయోగించిన మెటీరియల్ (చెక్క/వస్త్రం/లోహం) మరియు సుమారు పరిమాణం (సైజు) ఇంకా చెప్పలేదు. దయచేసి వివరించండి.';
      } else if (language === 'hi') {
        followUp = 'मैंने आपके उत्पाद का विवरण सुना। लेकिन आपने इसमें प्रयुक्त सामग्री और अनुमानित आकार अभी नहीं बताया है। कृपया स्पष्ट करें।';
      } else {
        followUp = 'I have noted the details so far. Could you please specify the exact materials used and approximate dimensions?';
      }
    }

    return res.json({
      isComplete,
      missingFields: missing,
      followUpQuestion: followUp,
      extractedData: {
        productName: transcript.slice(0, 40),
        category: 'Wooden Crafts',
        material: hasMaterial ? 'Authentic Natural Material' : 'Handmade Material',
        craftTechnique: 'Traditional Handcraft',
        dimensions: hasDimensions ? 'Standard handcrafted dimensions' : 'Approx 10-12 inches',
        weight: '500g',
        timeToMake: '3-5 days',
        features: ['100% Handmade', 'Artisanal Heritage'],
      },
    });
  } catch (err: any) {
    console.error('Error in /api/ai/extract-info:', err);
    res.status(500).json({ error: 'Failed to extract product information' });
  }
});

// 3. AI Professional Multilingual Product Description Generator
app.post('/api/ai/generate-description', validateBody(['productData', 'artisanLanguage', 'targetLanguage'], ['productData']), validateAIProductData, validateLanguage('artisanLanguage'), validateLanguage('targetLanguage'), async (req, res) => {
  try {
    const {
      productData,
      artisanLanguage = 'te',
      targetLanguage = 'en',
    } = req.body;

    const ai = getGemini();
    const sourceLangName = LANGUAGE_NAMES[artisanLanguage] || 'Telugu';
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || 'English';

    if (ai) {
      const prompt = `
You are an expert e-commerce catalog specialist for Indian handmade artisanal products.
The artisan spoke in: ${sourceLangName}.
Generate a captivating, authentic, professional marketplace catalog listing for potential buyers in: ${targetLangName}.

Craft Details:
- Name: ${productData.productName || 'Handcrafted Artisan Item'}
- Category: ${productData.category || 'Handicrafts'}
- Material: ${productData.material || 'Natural Materials'}
- Craft Technique: ${productData.craftTechnique || 'Handmade'}
- Dimensions: ${productData.dimensions || 'Handcrafted standard'}
- Time to craft: ${productData.timeToMake || 'Handcrafted with care'}
- Features: ${(productData.features || []).join(', ')}

Please generate:
1. "title": A clear, high-converting product title (in ${targetLangName}).
2. "shortDescription": A 1-2 sentence compelling summary (in ${targetLangName}).
3. "fullDescription": A rich, evocative narrative describing the heritage, authentic materials, meticulous crafting process, and aesthetic appeal (in ${targetLangName}).

Output valid JSON only:
{
  "title": string,
  "shortDescription": string,
  "fullDescription": string
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '{}';
      return res.json(JSON.parse(text));
    }

    // Fallback description
    const title = `${productData.productName || 'Authentic Handcrafted Artisan Item'} (${targetLangName})`;
    const shortDesc = `Handmade using genuine ${productData.material || 'craft materials'} using centuries-old traditional techniques.`;
    const fullDesc = `This authentic handmade masterpiece is individually crafted by skilled artisans. Made with pure ${productData.material || 'natural materials'} through traditional methods, each piece carries distinct character, cultural heritage, and unmatched quality. Dimensions: ${productData.dimensions || 'Standard'}.`;

    return res.json({
      title,
      shortDescription: shortDesc,
      fullDescription: fullDesc,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/generate-description:', err);
    res.status(500).json({ error: 'Failed to generate product description' });
  }
});

// 4. AI Fair Craft Valuation & Pricing Recommendation
app.post('/api/ai/pricing-recommendation', validateBody(['productData', 'language'], ['productData']), validateAIProductData, validateLanguage('language'), async (req, res) => {
  try {
    const { productData, language = 'te' } = req.body;
    const ai = getGemini();
    const langName = LANGUAGE_NAMES[language] || 'Telugu';

    if (ai) {
      const prompt = `
You are Craft Mastery's AI Pricing Specialist. Your mission is to protect artisans from unfair exploitation while ensuring fair, competitive market pricing for buyers.

Craft Details:
- Name: ${productData.productName}
- Category: ${productData.category}
- Material: ${productData.material}
- Craft Technique: ${productData.craftTechnique}
- Dimensions: ${productData.dimensions}
- Time to craft: ${productData.timeToMake}

Calculate fair INR (₹) pricing:
- minPrice: Minimum fair wholesale/market boundary
- maxPrice: Maximum retail boundary
- suggestedPrice: Recommended sweet-spot listing price
- reasoning: A warm 1-2 sentence explanation in ${langName} explaining the rationale (considering raw material costs, handwork hours, rarity, and artisanal skill).

Return JSON only:
{
  "suggestedPriceMin": number,
  "suggestedPriceMax": number,
  "recommendedPrice": number,
  "pricingReason": string
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '{}';
      return res.json(JSON.parse(text));
    }

    // Fallback calculation
    let base = 1200;
    if (/saree|textile|silk/i.test(productData.category || '')) base = 6500;
    if (/brass|metal/i.test(productData.category || '')) base = 2200;
    if (/pottery|clay/i.test(productData.category || '')) base = 950;

    let reason = 'క్రాఫ్ట్ మెటీరియల్ ఖర్చులు, చేతి శ్రమ మరియు మార్కెట్ డిమాండ్ ఆధారంగా AI సిఫార్సు చేసిన ధర.';
    if (language === 'hi') {
      reason = 'कच्चे माल की लागत, हस्तनिर्मित श्रम और बाजार मांग के आधार पर अनुशंसित मूल्य।';
    } else if (language === 'en') {
      reason = 'Calculated fairly on material quality, hours of handcrafting labor, and current marketplace benchmarks.';
    }

    return res.json({
      suggestedPriceMin: Math.round(base * 0.85),
      suggestedPriceMax: Math.round(base * 1.25),
      recommendedPrice: base,
      pricingReason: reason,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/pricing-recommendation:', err);
    res.status(500).json({ error: 'Failed to recommend pricing' });
  }
});

// 5. Two-Way Multilingual Translation (Customer <-> Artisan)
app.post('/api/ai/translate', validateBody(['text', 'fromLang', 'toLang'], ['text', 'fromLang', 'toLang']), validateString('text', 5000, true), validateLanguage('fromLang'), validateLanguage('toLang'), async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    if (fromLang === toLang) {
      return res.json({ translatedText: text, fromLang, toLang });
    }

    const ai = getGemini();
    const fromName = LANGUAGE_NAMES[fromLang] || fromLang;
    const toName = LANGUAGE_NAMES[toLang] || toLang;

    if (ai) {
      const prompt = `
You are a real-time diplomatic and natural multilingual translator for an Indian artisan marketplace.
Translate the following message faithfully from ${fromName} into ${toName}.
Maintain cultural warmth, politeness, business negotiation clarity, and natural dialect tone.
Do not add meta commentary or quotes.

Source text:
"${text}"

Translated text (${toName}):
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });

      const translated = response.text?.trim() || text;
      return res.json({ translatedText: translated, fromLang, toLang });
    }

    // Direct fallback dictionary for common inquiry patterns
    let fallback = text;
    if (toLang === 'te' && /100 pieces/i.test(text)) {
      fallback = 'నాకు 100 ముక్కలు కావాలి. హోల్‌సేల్ ధర మరియు డెలివరీ సమయం ఎంత?';
    } else if (toLang === 'en' && /100/i.test(text)) {
      fallback = 'I can craft and deliver 100 pieces at a discounted wholesale price. Please let me know your preferred deadline.';
    }

    return res.json({
      translatedText: fallback,
      fromLang,
      toLang,
      isFallback: true,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/translate:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// 6. Customer Semantic Search & AI Query Understanding
app.post('/api/ai/customer-search', validateBody(['query', 'language'], ['query']), validateString('query', 1000, true), validateLanguage('language'), async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    const ai = getGemini();

    if (ai && query) {
      const prompt = `
Analyze the customer's shopping query for an Indian handmade craft marketplace.
Query: "${query}"
Customer language: ${language}

Extract:
1. "category": Most relevant craft category (e.g. "Wooden Crafts", "Handloom Textiles", "Metal Crafts", "Pottery & Ceramics", "All")
2. "maxPrice": maximum budget mentioned in INR, or null
3. "keywords": array of descriptive keywords
4. "aiMessage": a short, friendly response in customer language (${language}) acknowledging what they are looking for and what was found.

Output JSON only:
{
  "category": string,
  "maxPrice": number | null,
  "keywords": string[],
  "aiMessage": string
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '{}';
      return res.json(JSON.parse(text));
    }

    // Default response
    return res.json({
      category: 'All',
      maxPrice: null,
      keywords: [query],
      aiMessage: `I found authentic handmade crafts matching "${query}". Select any item and tap ✨ Ask AI below for guidance!`,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/customer-search:', err);
    res.status(500).json({ error: 'Search analysis failed' });
  }
});

// 7. Customer "✨ Ask AI" Guidance for a Specific Product
app.post('/api/ai/order-guidance', validateBody(['question', 'product', 'language', 'productId', 'productTitle', 'intent', 'customQuestion'], ['language']), validateString('question', 2000), validateString('customQuestion', 2000), validateLanguage('language'), validateGuidanceProduct, async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    const question = req.body.question || req.body.customQuestion || req.body.intent || 'How do I order?';
    const product = req.body.product || { title: req.body.productTitle };
    const ai = getGemini();
    const langName = LANGUAGE_NAMES[language] || 'English';

    if (ai) {
      const prompt = `
You are the interactive shopping assistant on Craft Mastery.
A customer is viewing this authentic handcrafted product:
- Title: ${product.title}
- Price: ₹${product.finalPrice}
- Material: ${product.material}
- Technique: ${product.craftTechnique}
- Time to craft: ${product.timeToMake}
- Region: ${product.region}
- Artisan: ${product.artisanName}

The customer asked in ${langName}:
"${question}"

Provide clear, helpful, trustworthy guidance in ${langName}.
If they ask "How do I order?":
Explain the simple verified flow:
1. Choose required quantity.
2. If bulk (e.g., 20+ or 100+ pieces), tap "Send Inquiry" to receive special wholesale artisan pricing.
3. Confirm delivery details; the artisan receives notification in their native language and confirms dispatch.

If they ask to contact the artisan or ask for 100 pieces:
Explain that clicking the "Contact Artisan / Bulk Order" button directly sends a translated message to the artisan.

Output JSON only:
{
  "answer": string,
  "suggestedAction": "ORDER" | "CONTACT_ARTISAN" | "NONE",
  "recommendedQuantity": number | null
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return res.json({
        guidance: parsed.answer || parsed.guidance || 'Direct artisan assistance available.',
        ...parsed,
      });
    }

    let answer = `You can order "${product.title}" by choosing your quantity and clicking Contact Artisan. For bulk orders like 100 pieces, the artisan will offer wholesale rates.`;
    if (language === 'te') {
      answer = `మీరు ఈ "${product.title}" వస్తువును సులభంగా ఆర్డర్ చేయవచ్చు. మీకు 100 ముక్కలు లేదా బల్క్ ఆర్డర్ కావాలంటే "కళాకారుడిని సంప్రదించండి" బటన్ ద్వారా నేరుగా విచారణ పంపవచ్చు. కళాకారుడు ప్రత్యేక హోల్‌సేల్ ధరను అందిస్తారు.`;
    }

    return res.json({
      guidance: answer,
      answer,
      suggestedAction: 'CONTACT_ARTISAN',
      recommendedQuantity: 100,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/order-guidance:', err);
    res.status(500).json({ error: 'Guidance failed' });
  }
});

// 8. Products CRUD
function serializeInquiry(inquiry: any, auth: NonNullable<Express.Request['auth']>) {
  if (auth.role === 'ADMIN') return inquiry;
  const { customerId, artisanId, ...safeInquiry } = inquiry;
  return safeInquiry;
}

app.get('/api/products', (req, res) => {
  const auth = req.auth!;
  res.json(visibleProductsFor(auth));
});

app.post('/api/products', requireRole('ARTISAN', 'ADMIN'), validateBody([...PRODUCT_FIELDS, 'id', 'artisanId', 'artisanPhone', 'artisanName', 'artisanLanguage', 'status', 'createdAt']), validateProductInput, (req, res) => {
  const auth = req.auth!;
  const profile = usersDb.find((user) => user.uid === auth.uid);
  const productId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newProduct = {
    ...req.body,
    id: productId,
    artisanId: auth.uid,
    artisanPhone: auth.phone,
    artisanName: profile?.name || 'Artisan Maker',
    createdAt: new Date().toISOString(),
    status: 'PUBLISHED',
  };
  try {
    const storedProduct = storeProductMedia(newProduct, auth.uid);
    productsDb.unshift(storedProduct);
    saveStoreToDisk();
    res.status(201).json({ product: hydrateProductMedia(storedProduct, auth) });
  } catch (err) {
    console.error('[Media] Product upload rejected:', err instanceof Error ? err.message : err);
    clientError(res, 400, 'Invalid product image');
  }
});

app.delete('/api/products/:id', requireRole('ARTISAN', 'ADMIN'), validateParam('id', /^[A-Za-z0-9_-]{1,100}$/), (req, res) => {
  const product = productsDb.find((item) => item.id === req.params.id);
  if (!product) return clientError(res, 404, 'Product not found');
  if (req.auth!.role !== 'ADMIN' && product.artisanId !== req.auth!.uid && !samePhone(product.artisanPhone, req.auth!.phone)) {
    return clientError(res, 403, 'You cannot modify this product');
  }
  for (const file of filesDb.filter((item) => item.productId === product.id)) removeStoredFile(file);
  filesDb = filesDb.filter((item) => item.productId !== product.id);
  productsDb = productsDb.filter((item) => item.id !== product.id);
  saveStoreToDisk();
  return res.status(204).send();
});

// 9. Inquiries & 2-way Messages CRUD
app.get('/api/inquiries', (req, res) => {
  const auth = req.auth!;
  const visible = visibleInquiriesFor(auth);
  res.json(visible.map((inquiry) => serializeInquiry(inquiry, auth)));
});

app.post('/api/inquiries', requireRole('CUSTOMER', 'ADMIN'), validateBody([
  'productId', 'productTitle', 'productImage', 'artisanId', 'artisanPhone', 'artisanName', 'customerId',
  'customerName', 'customerPhone', 'customerLanguage', 'artisanLanguage', 'requestedQuantity', 'initialMessage',
  'id', 'createdAt', 'updatedAt', 'status', 'messages',
], ['productId']), validateString('productId', 100, true), validateString('initialMessage', 5000), validateLanguage('customerLanguage'), validateInquiryInput, async (req, res) => {
  const auth = req.auth!;
  const profile = usersDb.find((user) => user.uid === auth.uid);
  const product = visibleProductsFor(auth).find((item) => item.id === req.body.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const initialMessage = typeof req.body.initialMessage === 'string' ? req.body.initialMessage.trim().slice(0, 5000) : '';
  const newInquiry = {
    productId: product.id,
    productTitle: product.title,
    productImage: product.enhancedImageUrl || product.originalImageUrl,
    artisanId: product.artisanId,
    artisanPhone: product.artisanPhone,
    artisanName: product.artisanName,
    customerId: auth.uid,
    customerName: profile?.name || 'Customer',
    customerPhone: auth.phone,
    customerLanguage: req.body.customerLanguage || 'en',
    artisanLanguage: product.artisanLanguage || 'te',
    requestedQuantity: req.body.requestedQuantity,
    initialMessage: req.body.initialMessage,
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'PENDING',
    messages: initialMessage
      ? [{
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          inquiryId: product.id,
          senderRole: 'CUSTOMER',
          senderName: profile?.name || 'Customer',
          originalText: initialMessage,
          originalLang: req.body.customerLanguage || 'en',
          timestamp: new Date().toISOString(),
        }]
      : [],
  };
  newInquiry.messages[0] && (newInquiry.messages[0].inquiryId = newInquiry.id);
  inquiriesDb.unshift(newInquiry);
  saveStoreToDisk();
  res.status(201).json({ inquiry: serializeInquiry(newInquiry, auth) });
});

app.post('/api/inquiries/:id/messages', validateParam('id', /^[A-Za-z0-9_-]{1,100}$/), validateBody(['originalText', 'text', 'senderRole', 'senderName', 'inquiryId']), validateMessageInput, (req, res) => {
  const { id } = req.params;
  const inquiry = inquiriesDb.find((inq) => inq.id === id);
  const auth = req.auth!;

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }
  const isParticipant =
    inquiry.customerId === auth.uid ||
    inquiry.artisanId === auth.uid ||
    samePhone(inquiry.customerPhone, auth.phone) ||
    samePhone(inquiry.artisanPhone, auth.phone);
  if (auth.role !== 'ADMIN' && !isParticipant) {
    return res.status(403).json({ error: 'You cannot access this inquiry' });
  }

  const message = {
    id: `msg-${Date.now()}`,
    inquiryId: id,
    senderRole: auth.role === 'ADMIN'
      ? 'ADMIN'
      : (inquiry.artisanId === auth.uid || samePhone(inquiry.artisanPhone, auth.phone) ? 'ARTISAN' : 'CUSTOMER'),
    senderName: auth.role === 'ADMIN'
      ? 'Administrator'
      : (inquiry.artisanId === auth.uid || samePhone(inquiry.artisanPhone, auth.phone) ? inquiry.artisanName : inquiry.customerName),
    originalText: String(req.body.originalText || req.body.text || '').slice(0, 5000),
    timestamp: new Date().toISOString(),
  };
  if (!message.originalText) return res.status(400).json({ error: 'Message text is required' });

  if (!inquiry.messages) inquiry.messages = [];
  inquiry.messages.push(message);
  inquiry.updatedAt = new Date().toISOString();
  saveStoreToDisk();
  res.status(201).json({ message, inquiry: serializeInquiry(inquiry, auth) });
});

// 2-Way Multilingual Reply Endpoint
app.post('/api/inquiries/:id/reply', validateParam('id', /^[A-Za-z0-9_-]{1,100}$/), validateBody(['originalText', 'originalLang', 'senderRole', 'senderName'], ['originalText']), validateString('originalText', 5000, true), validateLanguage('originalLang'), async (req, res) => {
  try {
    const { id } = req.params;
    const { originalText, originalLang } = req.body;
    const auth = req.auth!;
    const inquiry = inquiriesDb.find((inq) => inq.id === id);

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    const isAdmin = auth.role === 'ADMIN';
    const isArtisan = inquiry.artisanId === auth.uid || samePhone(inquiry.artisanPhone, auth.phone);
    const isCustomer = inquiry.customerId === auth.uid || samePhone(inquiry.customerPhone, auth.phone);
    if (auth.role !== 'ADMIN' && !isArtisan && !isCustomer) {
      return res.status(403).json({ error: 'You cannot access this inquiry' });
    }
    if (typeof originalText !== 'string' || !originalText.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const senderRole = isAdmin ? 'ADMIN' : isArtisan ? 'ARTISAN' : 'CUSTOMER';
    const targetLang = senderRole === 'ARTISAN' ? (inquiry.customerLanguage || 'en') : (inquiry.artisanLanguage || 'te');
    let translatedText = originalText;

    if (targetLang !== originalLang) {
      const ai = getGemini();
      if (ai) {
        try {
          const prompt = `Translate this message for an Indian handcrafted artisan marketplace from ${LANGUAGE_NAMES[originalLang] || originalLang} to ${LANGUAGE_NAMES[targetLang] || targetLang}. Keep it polite, clear, and natural.\n\n"${originalText}"`;
          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
          });
          translatedText = response.text?.trim() || originalText;
        } catch (translationErr) {
          console.warn('AI translation failed, using original text:', translationErr);
          translatedText = originalText;
        }
      }
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      inquiryId: id,
      senderRole,
      senderName: senderRole === 'ARTISAN' ? inquiry.artisanName : senderRole === 'CUSTOMER' ? inquiry.customerName : 'Administrator',
      originalText,
      originalLang: originalLang || 'te',
      translatedText,
      translatedLang: targetLang,
      timestamp: new Date().toISOString(),
    };

    if (!inquiry.messages) inquiry.messages = [];
    inquiry.messages.push(newMessage);
    inquiry.updatedAt = new Date().toISOString();
    inquiry.status = 'IN_PROGRESS';

    saveStoreToDisk();
    return res.status(200).json(serializeInquiry(inquiry, auth));
  } catch (err: any) {
    console.error('Error in /api/inquiries/:id/reply:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// 10. User Profiles (Auth/Onboarding Persistence)
app.get('/api/users/:phone', validateParam('phone', /^\+?[0-9 ()-]{7,20}$/), (req, res) => {
  const { phone } = req.params;
  if (!req.auth || (req.auth.role !== 'ADMIN' && !samePhone(phone, req.auth.phone))) {
    return res.status(403).json({ error: 'You cannot access this profile' });
  }
  const user = usersDb.find((u) => samePhone(u.phone, phone));
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.auth.role === 'ADMIN') return res.json({ user });
  const { uid, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/users', validateBody(['name', 'language', 'onboardingComplete', 'craftSpecialty', 'location', 'shoppingInterests', 'phone', 'role']), validateString('name', 200), validateString('craftSpecialty', 500), validateString('location', 300), validateString('shoppingInterests', 500), validateLanguage('language'), (req, res) => {
  const { name, language, onboardingComplete, craftSpecialty, location, shoppingInterests } = req.body;
  const auth = req.auth!;
  const phone = auth.phone;
  if (onboardingComplete !== undefined && typeof onboardingComplete !== 'boolean') return clientError(res, 400, 'Invalid onboarding state');

  let user = usersDb.find((u) => u.uid === auth.uid || samePhone(u.phone, phone));
  if (user) {
    Object.assign(user, {
      uid: auth.uid,
      name: name !== undefined ? name : user.name,
      role: auth.role,
      language: language !== undefined ? language : user.language,
      onboardingComplete: onboardingComplete !== undefined ? onboardingComplete : user.onboardingComplete,
      craftSpecialty: craftSpecialty !== undefined ? craftSpecialty : user.craftSpecialty,
      location: location !== undefined ? location : user.location,
      shoppingInterests: shoppingInterests !== undefined ? shoppingInterests : user.shoppingInterests,
      updatedAt: new Date().toISOString(),
    });
  } else {
    user = {
      uid: auth.uid,
      phone,
      name: name || (auth.role === 'ARTISAN' ? 'Artisan Maker' : 'Customer Buyer'),
      role: auth.role,
      language: language || 'en',
      onboardingComplete: Boolean(onboardingComplete),
      craftSpecialty: craftSpecialty || '',
      location: location || '',
      shoppingInterests: shoppingInterests || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    usersDb.push(user);
  }
  saveStoreToDisk();
  res.status(200).json({ user });
});

// Role changes are an administrative operation; clients cannot assign themselves a role.
app.post('/api/admin/users/:uid/role', requireRole('ADMIN'), validateParam('uid', /^[A-Za-z0-9_-]{1,128}$/), validateBody(['role'], ['role']), async (req, res) => {
  const { uid } = req.params;
  const role = req.body?.role;
  if (role !== 'ARTISAN' && role !== 'CUSTOMER') {
    return res.status(400).json({ error: 'Only ARTISAN or CUSTOMER roles may be provisioned' });
  }
  try {
    await provisionRole(uid, role);
    const user = usersDb.find((item) => item.uid === uid);
    if (user) {
      user.role = role;
      user.updatedAt = new Date().toISOString();
      saveStoreToDisk();
    }
    return res.json({ uid, role });
  } catch (err) {
    console.error('[Auth] Role provisioning failed:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Role provisioning failed' });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API] Unhandled request error:', err);
  return clientError(res, 500, 'Internal server error');
});

// Seed Initial Data if store is empty
const loaded = loadStoreFromDisk();
if (!loaded || productsDb.length === 0) {
  productsDb = [...INITIAL_PRODUCTS];
  inquiriesDb = [...INITIAL_INQUIRIES];
  saveStoreToDisk();
}
reconcileStoredFiles();

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Craft Mastery server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
