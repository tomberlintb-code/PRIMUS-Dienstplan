// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Deine Firebase-Konfiguration eintragen
const firebaseConfig = {
  apiKey: "AIzaSyCcFpFqq7yetIiI6vamQNiMPGtmqX1WW58",
  authDomain: "kt-primus-webapp.firebaseapp.com",
  projectId: "kt-primus-webapp",
  storageBucket: "kt-primus-webapp.firebasestorage.app",
  messagingSenderId: "1041543293517",
  appId: "1:1041543293517:web:37c7f360789d9cce3dca04"
};

// 🔒 Nur einmal initialisieren
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
