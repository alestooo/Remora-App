import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBRTLWunxy2NwFwzIFncSIb9sxkKqhHK0E",
  authDomain: "remora-suckerfish.firebaseapp.com",
  projectId: "remora-suckerfish",
  storageBucket: "remora-suckerfish.firebasestorage.app",
  messagingSenderId: "246677104580",
  appId: "1:246677104580:web:d6c62b3db2e5c269ffa691",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const messaging = getMessaging(app);