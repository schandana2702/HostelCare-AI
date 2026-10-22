import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID     || ''
};

/**
 * isFirebaseConfigured — true when all required credentials are present
 * and VITE_ENABLE_DEMO_MODE is not explicitly set to 'true'.
 *
 * When false, App.jsx renders <FirebaseSetupRequired> instead of the
 * normal application — no mockDb fallback, no fake authentication.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id' &&
  env.VITE_ENABLE_DEMO_MODE !== 'true'
);

let app       = null;
let auth      = null;
let db        = null;   // Firestore (default) database
let storage   = null;
let functions = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);

    // Firebase Authentication — Email/Password provider
    auth = getAuth(app);

    // Cloud Firestore — (default) database for project hostelcare-ai
    // getFirestore() with no second argument always targets the (default) database
    db = getFirestore(app);

    // Firebase Storage — for complaint image uploads
    storage = getStorage(app);

    // Firebase Cloud Functions — for secure privileged operations
    functions = getFunctions(app);

    console.info(
      `✓ Firebase initialized — project: ${firebaseConfig.projectId} | auth: ${firebaseConfig.authDomain}`
    );
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
} else {
  console.warn(
    'Firebase credentials are not configured. Fill in .env with your Firebase project values.'
  );
}

export { app, auth, db, storage, functions };
