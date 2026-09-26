import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyACRE3ekGTE2tBYHKfh8RIwsEyrOzcM03M",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cou-dinex.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cou-dinex",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cou-dinex.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "821063297849",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:821063297849:web:f618c35832dbc899d896e8",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-C6N72QPBN8",
};

// Initialize Firebase App instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Request notification permission from the browser and register FCM device token
 */
export async function requestPushNotificationPermission(vapidKey?: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("[FCM] Push notifications are not supported by this browser environment.");
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Firebase messaging is not supported in this browser.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Notification permission was not granted:", permission);
      return null;
    }

    const messaging = getMessaging(app);

    // Register service worker if available
    let registration: ServiceWorkerRegistration | undefined = undefined;
    if ("serviceWorker" in navigator) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      // Save device token to user account via backend API
      await fetch("/api/notifications/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken }),
      });
      return currentToken;
    }

    return null;
  } catch (error) {
    console.error("[FCM] Failed to acquire device push token:", error);
    return null;
  }
}

/**
 * Listen for foreground push messages
 */
export async function listenForegroundMessages(onMessageReceived: (payload: any) => void) {
  if (typeof window === "undefined") return;
  try {
    const supported = await isSupported();
    if (!supported) return;
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      onMessageReceived(payload);
    });
  } catch (err) {
    console.error("[FCM] Error listening to foreground messages:", err);
  }
}
