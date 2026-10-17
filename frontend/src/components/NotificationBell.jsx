import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, Sparkles, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { requestFcmToken, onForegroundMessage } from '../services/firebase';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const dropdownRef = useRef(null);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(window.Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds for live push updates
      return () => clearInterval(interval);
    }
  }, [user]);

  // Firebase Cloud Messaging Push Listener
  useEffect(() => {
    if (user) {
      const unsubscribe = onForegroundMessage((payload) => {
        const title = payload.notification?.title || payload.data?.title || '🔥 GoOnStay Alert';
        const body = payload.notification?.body || payload.data?.body || 'New live update received.';
        playNotificationTone();
        triggerNativePushNotification(title, body);
        fetchUnreadCount();
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio chime tone for realistic notification sound
  const playNotificationTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12); // D6

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.debug('Notification audio playback error:', e);
    }
  };

  const triggerNativePushNotification = async (title, body) => {
    if (!("Notification" in window)) {
      console.warn('[Notification] Notifications not supported in this browser.');
      return;
    }

    try {
      let perm = window.Notification.permission;
      if (perm !== "granted") {
        perm = await window.Notification.requestPermission();
        setPushPermission(perm);
        if (perm !== "granted") {
          console.warn('[Notification] Permission not granted:', perm);
          return;
        }
      }

      // Haptic vibration feedback for mobile devices
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (e) {}
      }

      const options = {
        body: body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: 'bmr-notif-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: { url: window.location.origin }
      };

      let shown = false;

      // 1. Primary for Mobile Android: ServiceWorker Registration showNotification
      // In Android Chrome, window.Notification constructor is FORBIDDEN. ServiceWorker is mandatory.
      if ('serviceWorker' in navigator) {
        try {
          let reg = await navigator.serviceWorker.getRegistration();
          if (!reg) {
            reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
          }
          await navigator.serviceWorker.ready;

          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            shown = true;
            console.log('[Notification] Displayed in Android status bar via ServiceWorker!');
          }

          // Direct postMessage trigger to service worker
          if (reg && reg.active) {
            reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
          }
        } catch (swErr) {
          console.warn('[Notification] ServiceWorker display error:', swErr);
        }
      }

      // 2. Desktop Browser fallback (Only if SW showNotification was not supported and NOT Android Chrome)
      if (!shown) {
        try {
          new window.Notification(title, {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png'
          });
          console.log('[Notification] Displayed via window.Notification (desktop)');
        } catch (winErr) {
          console.warn('[Notification] window.Notification fallback error:', winErr?.message);
        }
      }
    } catch (err) {
      console.error('[Notification] Global trigger error:', err);
    }
  };

  const requestBrowserPushPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const token = await requestFcmToken();
      if (token) {
        setFcmToken(token);
        setPushPermission('granted');
        triggerNativePushNotification(
          "🔥 Firebase Push Notifications Activated!",
          "Firebase Cloud Messaging is live for instant stay alerts, hotel approvals, and booking updates."
        );
      } else {
        const perm = await window.Notification.requestPermission();
        setPushPermission(perm);
      }
    } catch (e) {
      console.error('Failed to request notification permission:', e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count/');
      const newCount = res.data.unread_count || 0;
      
      // If unread count increased, fetch latest notification and trigger native push
      if (newCount > prevUnreadRef.current && prevUnreadRef.current !== 0) {
        const listRes = await api.get('/notifications/');
        const list = listRes.data.results || listRes.data || [];
        const latest = list[0];
        if (latest && !latest.is_read) {
          playNotificationTone();
          triggerNativePushNotification(latest.title, latest.message);
        }
      }

      prevUnreadRef.current = newCount;
      setUnreadCount(newCount);
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/');
      const list = res.data.results || res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications list:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const diffSec = Math.floor((new Date() - d) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch (e) {
      return dateStr;
    }
  };

  if (!user) return null;

  return (
    <div className="relative flex items-center" ref={dropdownRef}>

      {/* Bell Button (Only if user logged in) */}
      {user && (
        <button
          onClick={handleToggle}
          className="relative p-2.5 rounded-full glass-pill-light hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-all cursor-pointer border border-slate-200/80 shadow-2xs flex items-center justify-center"
          title="Notifications & Stay Reminders"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md shadow-rose-600/40">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Dropdown Popover */}
      {user && isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-white/98 backdrop-blur-xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Push Alerts</h4>
                <p className="text-[10px] text-slate-400 font-bold">Stay reminders, bookings & approvals</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>


          {/* Browser Native Push Permission Banner */}
          {pushPermission !== 'granted' && (
            <div className="mb-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-[11px] truncate">Enable Desktop Push Notifications</span>
              </div>
              <button
                onClick={requestBrowserPushPermission}
                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] shrink-0 cursor-pointer shadow-xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[11px] font-bold text-slate-400">Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Notifications Yet</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Real-time alerts for hotel bookings, stay reminders, and approvals will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 relative ${
                    n.is_read
                      ? 'bg-slate-50/60 border-slate-100 text-slate-600'
                      : 'bg-rose-50/50 border-rose-200/80 text-slate-900 shadow-2xs hover:bg-rose-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-black leading-snug flex items-center gap-1.5">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>}
                      {n.title}
                    </h5>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[10px] font-bold text-slate-500">
                    <Link
                      to={n.notification_type === 'NEW_BOOKING_OWNER' ? '/owner/dashboard' : n.notification_type === 'HOTEL_APPROVED' || n.notification_type === 'HOTEL_REJECTED' ? '/owner/dashboard' : '/my-bookings'}
                      onClick={() => setIsOpen(false)}
                      className="text-teal-600 font-extrabold hover:underline"
                    >
                      View Details →
                    </Link>

                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
