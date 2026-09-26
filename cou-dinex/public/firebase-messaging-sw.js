// Firebase Cloud Messaging Background Service Worker
// Automatically receives background push notifications for CoU DineX

importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyACRE3ekGTE2tBYHKfh8RIwsEyrOzcM03M",
  authDomain: "cou-dinex.firebaseapp.com",
  projectId: "cou-dinex",
  storageBucket: "cou-dinex.firebasestorage.app",
  messagingSenderId: "821063297849",
  appId: "1:821063297849:web:f618c35832dbc899d896e8",
  measurementId: "G-C6N72QPBN8",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "CoU DineX Alert";
  const notificationOptions = {
    body: payload.notification?.body || "New update regarding your cafeteria order.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || "/orders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(actionUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
