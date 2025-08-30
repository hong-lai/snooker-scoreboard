// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "snookerscoremate",
  appId: "1:801637175468:web:884defda22414f1ae6cf09",
  storageBucket: "snookerscoremate.firebasestorage.app",
  apiKey: "AIzaSyB0K04f-UHHAeHpL-PYyC1DE5CHZGrSv4w",
  authDomain: "snookerscoremate.firebaseapp.com",
  messagingSenderId: "801637175468",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
