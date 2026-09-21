importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBRTLWunxy2NwFwzIFncSIb9sxkKqhHK0E",
  authDomain: "remora-suckerfish.firebaseapp.com",
  projectId: "remora-suckerfish",
  storageBucket: "remora-suckerfish.firebasestorage.app",
  messagingSenderId: "246677104580",
  appId: "1:246677104580:web:d6c62b3db2e5c269ffa691",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Remora";
  const body = payload.notification?.body || "Tienes un recordatorio pendiente.";

  self.registration.showNotification(title, {
    body,
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => "focus" in client);
      if (existing) return existing.focus();
      if (clients.openWindow) return clients.openWindow("/");
      return undefined;
    })
  );
});

/* App shell offline cache */
const REMORA_CACHE = "remora-shell-v2";
const REMORA_SHELL = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(REMORA_CACHE).then((cache) => cache.addAll(REMORA_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("remora-shell-") && key !== REMORA_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(REMORA_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(REMORA_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
