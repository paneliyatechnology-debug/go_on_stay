// Firebase Cloud Messaging Push Service
// Initialized with your real Firebase project config.

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ✅ Your Firebase VAPID Web Push Certificate Key
// (Get from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates)
export const VAPID_KEY = "BD-GmeedeEEfm9_k_jaZ6BxM7vC191SHP8A-bhmuVEHczL1J1Y0tQsKF8zA7iEnY5xauPhPftav-9CZ4nH69jF0";

// ✅ Your real Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9oo0jAasBQydkJGPP8kWfpvnJ6L2jPwA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bookmyroom-pt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bookmyroom-pt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bookmyroom-pt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "395311941472",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:395311941472:web:01dd0cce7b5ca2c2004005",
};

let app = null;
let messaging = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  // Only initialize messaging in browser with service worker support
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn('[Firebase] Initialization failed:', e?.message);
}

/**
 * Requests Notification permission and obtains Firebase FCM Device Token.
 * The FCM token should be sent to your backend to enable push delivery.
 */
export const requestFcmToken = async () => {
  if (!messaging) {
    // Fallback: at least request browser notification permission
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        console.log('[FCM] Browser permission:', perm);
        return perm === 'granted' ? 'browser-only' : null;
      }
    } catch (e) {
      console.warn('[FCM] Permission request failed:', e?.message);
    }
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }
    // Reuse existing SW registration (registered in main.jsx at startup)
    // This avoids double-registration and scope conflicts
    let swReg = null;
    const registrations = await navigator.serviceWorker.getRegistrations();
    swReg = registrations.find(r => r.active?.scriptURL?.includes('firebase-messaging-sw.js'));
    if (!swReg) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (token) {
      console.log('[FCM] ✅ Token obtained:', token.slice(0, 25) + '...');
    } else {
      console.warn('[FCM] No token — check VAPID key in Firebase Console > Cloud Messaging > Web Push certificates');
    }
    return token;
  } catch (err) {
    console.warn('[FCM] Error obtaining FCM token:', err?.message);
    return null;
  }
};

/**
 * Listens for foreground push messages (when app tab is active/open).
 * Returns an unsubscribe function.
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => { };
  try {
    return onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload);
      if (callback) callback(payload);
    });
  } catch (e) {
    console.warn('[FCM] onMessage setup failed:', e?.message);
    return () => { };
  }
};

export { app, messaging };
