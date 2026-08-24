import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAK7e1KgLWJpwWUu-dlMoJ_76wtTvMY0OU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "long-sweep-vlcf1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "long-sweep-vlcf1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "long-sweep-vlcf1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "433027456741",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:433027456741:web:8dd88aec15171279ad7e0c",
};

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-voyaraaiaitrippl-c0254eab-6cb5-4d67-bbb1-45a7fb48f24c";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom database ID if specified
const db = getFirestore(app, databaseId);

export { app, auth, db, googleProvider };
