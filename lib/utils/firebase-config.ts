import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Log Firebase configuration (masking secrets)
console.log('[FIREBASE] Configuration:', {
  apiKeyExists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomainExists: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucketExists: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  environment: process.env.NODE_ENV
});

// Clean up storage bucket value - remove trailing commas and whitespace
const cleanStorageBucket = (bucket?: string): string | undefined => {
  if (!bucket) return undefined;
  return bucket.trim().replace(/,+$/, '');
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: cleanStorageBucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Print the storage bucket which is crucial for file uploads
console.log('[FIREBASE] Storage bucket:', firebaseConfig.storageBucket);

// Initialize Firebase app if it hasn't been initialized already
let app: FirebaseApp;
try {
  console.log('[FIREBASE] Initializing Firebase app');
  const existingApps = getApps();
  console.log('[FIREBASE] Existing Firebase apps:', existingApps.length);
  
  if (!existingApps.length) {
    app = initializeApp(firebaseConfig);
    console.log('[FIREBASE] New Firebase app initialized');
  } else {
    app = existingApps[0];
    console.log('[FIREBASE] Using existing Firebase app');
  }
} catch (error) {
  console.error('[FIREBASE] Error initializing Firebase app:', error);
  throw error;
}

// Get storage instance
let storage: FirebaseStorage;
try {
  console.log('[FIREBASE] Initializing Firebase storage');
  storage = getStorage(app);
  console.log('[FIREBASE] Firebase storage initialized successfully');
} catch (error) {
  console.error('[FIREBASE] Error initializing Firebase storage:', error);
  throw error;
}

// Function to check if Firebase storage is properly initialized
export const validateFirebaseStorage = () => {
  console.log('[FIREBASE] Validating Firebase storage');
  
  if (!app) {
    console.error('[FIREBASE] Firebase app not initialized');
    return false;
  }
  
  if (!storage) {
    console.error('[FIREBASE] Firebase storage not initialized');
    return false;
  }
  
  if (!firebaseConfig.storageBucket) {
    console.error('[FIREBASE] Missing storage bucket configuration');
    return false;
  }
  
  console.log('[FIREBASE] Firebase storage validation passed');
  return true;
};

export { app, storage }; 