import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let initError: Error | null = null;

// Log configuration status for debugging in production
if (!isFirebaseConfigured) {
  console.warn('Firebase is not configured. Missing environment variables:');
  if (!firebaseConfig.apiKey) console.warn('  - VITE_FIREBASE_API_KEY is missing');
  if (!firebaseConfig.projectId) console.warn('  - VITE_FIREBASE_PROJECT_ID is missing');
  if (!firebaseConfig.appId) console.warn('  - VITE_FIREBASE_APP_ID is missing');
  console.warn('Please configure these in your Vercel environment variables and redeploy.');
}

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log('Firebase initialized successfully for project:', firebaseConfig.projectId);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    initError = error instanceof Error ? error : new Error(String(error));
  }
}

export const auth = authInstance;
export const isFirebaseReady = isFirebaseConfigured && !!authInstance;
export const firebaseInitError = initError;

export async function signInWithGoogle() {
  if (!authInstance || !googleProvider) {
    throw new Error("Firebase no está configurado. Por favor, configure las variables de entorno de Firebase.");
  }
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  if (!authInstance) {
    throw new Error("Firebase no está configurado. Por favor, configure las variables de entorno de Firebase.");
  }
  const result = await signInWithEmailAndPassword(authInstance, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!authInstance) {
    throw new Error("Firebase no está configurado. Por favor, configure las variables de entorno de Firebase.");
  }
  const result = await createUserWithEmailAndPassword(authInstance, email, password);
  return result.user;
}

export async function logOut() {
  if (!authInstance) {
    throw new Error("Firebase no está configurado.");
  }
  await signOut(authInstance);
}

export async function getIdToken(): Promise<string | null> {
  if (!authInstance) return null;
  const user = authInstance.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
}

export type { FirebaseUser };
