import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, FileText, CheckCircle, Lock,
  Globe, DollarSign, Bell, Sliders, Languages, Check, Moon, Sun,
  Camera, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const languagesList = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
];

const currenciesList = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

const Profile = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const { user, updateProfile, showToast } = useAuth();
  const { currentLang, changeLanguage, currentCurrency, changeCurrency, t } = useLanguage();

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'settings' | 'security'

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
  });

  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('bmr_notifications');
    return saved ? JSON.parse(saved) : { email: true, promo: true, whatsapp: false };
  });

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local instant preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Prepare FormData
    setAvatarLoading(true);
    const data = new FormData();
    data.append('avatar', file);

    const res = await updateProfile(data);
    if (res.success) {
      showToast('Profile picture updated successfully!');
    }
    setAvatarLoading(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(formData);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await api.post('/users/change-password/', passwords);
      showToast('Password updated successfully!');
      setPasswords({ old_password: '', new_password: '' });
    } catch (err) {
      showToast('Failed to change password. Please check old password.', 'error');
    }
    setPassLoading(false);
  };

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('bmr_notifications', JSON.stringify(updated));
    showToast('Preference updated successfully!');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header Banner */}
        <div className="card-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            
            {/* Interactive Profile Pic Container with Camera Overlay */}
            <div
              className="relative group shrink-0 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-rose-600/30 border-4 border-white ring-2 ring-slate-200/80">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.first_name || user?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.first_name ? user.first_name[0].toUpperCase() : user?.username[0].toUpperCase()
                )}
              </div>

              {/* Hover Dark Overlay */}
              <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>

              {/* Camera Badge Icon */}
              <button
                type="button"
                disabled={avatarLoading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform duration-200 group-hover:scale-110"
              >
                {avatarLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl font-black text-slate-900">{user?.first_name} {user?.last_name}</h1>
                <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-mono">@{user?.username} • {user?.email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-rose-600 font-bold hover:underline flex items-center justify-center sm:justify-start gap-1 mt-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload / Change Profile Picture
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> Personal
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" /> Security
            </button>
          </div>
        </div>

        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === 'profile' && (
          <div className="card-white p-8 border border-slate-200 shadow-md space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-rose-600" />
              Personal Details & Bio
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Bio / Travel Preferences
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short bio or your preferred hotel room choices..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white resize-none outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-rose py-3 px-6 text-sm font-extrabold rounded-xl"
              >
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SETTINGS & LANGUAGE PREFERENCES */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            {/* Language & Currency Card */}
            <div className="card-white p-8 border border-slate-200 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-rose-600" />
                  Language & Currency Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your preferred application display language and currency format
                </p>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-rose-600" /> Display Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {languagesList.map((lang) => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          changeLanguage(lang.code);
                          showToast(`Language changed to ${lang.name}!`);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-500/20 font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{lang.flag}</span>
                          <div className="truncate">
                            <div className="text-xs truncate">{lang.native}</div>
                            <div className="text-[10px] text-slate-400 truncate">{lang.name}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-rose-600" /> Preferred Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {currenciesList.map((curr) => {
                    const isSelected = currentCurrency === curr.code;
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          changeCurrency(curr.code);
                          showToast(`Currency set to ${curr.code} (${curr.symbol})!`);
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-500/20 font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold'
                        }`}
                      >
                        <div className="text-lg font-black text-rose-600">{curr.symbol}</div>
                        <div className="text-xs font-bold">{curr.code}</div>
                        <div className="text-[9.5px] text-slate-400 truncate">{curr.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notification Preferences Card */}
            <div className="card-white p-8 border border-slate-200 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-600" />
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage how BookMyRoom alerts and updates are delivered to you
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Email Booking Receipts</h4>
                    <p className="text-[11px] text-slate-500">Receive instant booking confirmations and e-receipts via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Promotional Discounts & Deals</h4>
                    <p className="text-[11px] text-slate-500">Get exclusive hotel discount codes and seasonal offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.promo}
                    onChange={() => toggleNotification('promo')}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">WhatsApp Booking Alerts</h4>
                    <p className="text-[11px] text-slate-500">Receive check-in details & directions directly on WhatsApp</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.whatsapp}
                    onChange={() => toggleNotification('whatsapp')}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="card-white p-8 border border-slate-200 shadow-md space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="w-5 h-5 text-rose-600" />
              Account Security & Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.old_password}
                  onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                  placeholder="Enter old password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="btn-rose w-full py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl"
              >
                {passLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
