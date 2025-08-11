// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Nur im Browser initialisieren – verhindert Fehler beim Build/Prerender (Vercel)
const isBrowser = typeof window !== "undefined";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (isBrowser) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  _db = getFirestore(app);
}

// Hinweis: Auf dem Server sind diese Werte null; in Client-Komponenten (Browser) gesetzt.
export const auth = _auth as unknown as Auth;
export const db = _db as unknown as Firestore;
export default app as FirebaseApp;
