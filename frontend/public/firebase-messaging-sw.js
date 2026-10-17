// Firebase Cloud Messaging Background Service Worker
// This file MUST be in the public/ folder so it's served at the root URL /firebase-messaging-sw.js
// Service workers cannot use ES modules or import.meta.env — config must be hardcoded here.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Auto-activate immediately on mobile & desktop
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ✅ Real Firebase project config
firebase.initializeApp({
  apiKey: "AIzaSyD9oo0jAasBQydkJGPP8kWfpvnJ6L2jPwA",
  authDomain: "bookmyroom-pt.firebaseapp.com",
  projectId: "bookmyroom-pt",
  storageBucket: "bookmyroom-pt.firebasestorage.app",
  messagingSenderId: "395311941472",
  appId: "1:395311941472:web:01dd0cce7b5ca2c2004005"
});

const messaging = firebase.messaging();

// Handle Background Push Notifications
// This fires when the app is in the background or tab is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message received:', payload);

  const notificationTitle = payload.notification?.title
    || payload.data?.title
    || '🏨 BookMyRoom Alert';

  const notificationOptions = {
    body: payload.notification?.body
      || payload.data?.body
      || 'You have a new notification from BookMyRoom.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'bookmyroom-notification-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Listen for direct messages from the frontend to show Android status bar notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🔔 BookMyRoom Notification';
    const options = {
      body: event.data.body || 'New update available.',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [300, 100, 300],
      tag: 'bmr-mobile-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: event.data.data || { url: self.location.origin }
    };
    self.registration.showNotification(title, options);
  }
});

// Handle notification click — open the app when user taps notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app tab already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
