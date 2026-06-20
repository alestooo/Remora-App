importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBRTLWunxy2NwFwzIFncSIb9sxkKqhHK0E",
  authDomain: "remora-suckerfish.firebaseapp.com",
  projectId: "remora-suckerfish",
  storageBucket: "remora-suckerfish.firebasestorage.app",
  messagingSenderId: "246677104580",
  appId: "1:246677104580:web:d6c62b3db2e5c269ffa691"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/web-app-manifest-192x192.png"
  });
});