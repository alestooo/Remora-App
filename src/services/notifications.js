import { getToken } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { messaging, db } from "./firebase";

const VAPID_KEY =
"BPE_dK3eZrsX1_IGvw9Cg6WVRSlogsFxKYi25yOvsM0jqiTjY7diaI4BQRocoE95TmPmmel5e9CSjYQkfRKq7MK";

export const requestNotificationPermission = async (user) => {
  if (!("Notification" in window)) {
    throw new Error("Este navegador no soporta notificaciones.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("No diste permiso para enviar notificaciones.");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  await setDoc(
    doc(db, "users", user.uid, "meta", "notifications"),
    {
      fcmToken: token,
      enabled: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return token;
};