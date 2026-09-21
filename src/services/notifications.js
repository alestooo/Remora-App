import { getToken } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { messaging, db } from "./firebase";

const VAPID_KEY =
  "BPE_dK3eZrsX1_IGvw9Cg6WVRSlogsFxKYi25yOvsM0jqiTjY7diaI4BQRocoE95TmPmmel5e9CSjYQkfRKq7MK";

export const notificationSupported = () =>
  "Notification" in window && "serviceWorker" in navigator;

export const requestNotificationPermission = async (
  user,
  { notifyMinutesBefore = 120, timezone = "America/Costa_Rica" } = {}
) => {
  if (!notificationSupported()) {
    throw new Error("Este navegador no soporta notificaciones.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("No diste permiso para enviar notificaciones.");
  }

  if (!messaging) {
    throw new Error("Firebase Messaging no está disponible en este navegador.");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Firebase no devolvió un token de notificaciones.");
  }

  await setDoc(
    doc(db, "users", user.uid, "meta", "notifications"),
    {
      fcmToken: token,
      enabled: true,
      notifyMinutesBefore,
      timezone,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return token;
};
