import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Firebase Messaging Service Worker as early as possible
// This enables background push notifications even when the app tab is not active.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] firebase-messaging-sw.js registered:', registration.scope);
      })
      .catch((err) => {
        console.warn('[SW] Service worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
