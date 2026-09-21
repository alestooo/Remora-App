import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
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

let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  console.warn("No se pudo iniciar la caché persistente de Firestore:", error);
  firestore = getFirestore(app);
}

export const db = firestore;
let messagingInstance = null;
try {
  messagingInstance = getMessaging(app);
} catch (error) {
  console.warn("Firebase Messaging no está disponible en este navegador:", error);
}
export const messaging = messagingInstance;
