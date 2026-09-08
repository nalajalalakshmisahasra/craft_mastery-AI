import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) || "AIzaSy_placeholder_key_dev",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' && process.env?.FIREBASE_AUTH_DOMAIN) || "craft-mastery.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) || "craft-mastery",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_BUCKET) || "craft-mastery.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' && process.env?.FIREBASE_MESSAGING_SENDER_ID) || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' && process.env?.FIREBASE_APP_ID) || "1:123456789012:web:abcdef123456",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;