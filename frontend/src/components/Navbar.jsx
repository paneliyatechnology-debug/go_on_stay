import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Hotel, Heart, CalendarCheck, User, LogOut, ShieldCheck,
  Building2, Sparkles, Tag, Menu, X, Search, Globe, Check,
  MapPin, Minus, Plus, Palmtree, Landmark, Waves, Compass, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

const destinationsList = [
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    desc: 'Heritage city & Sabarmati Riverfront',
    icon: Landmark,
    color: 'bg-teal-50 text-teal-600'
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    desc: 'For sights like Gateway of India',
    icon: Building2,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    name: 'Goa',
    state: 'Goa',
    desc: 'Popular beach resort destination',
    icon: Palmtree,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    name: 'Udaipur',
    state: 'Rajasthan',
    desc: 'For lake palaces & romantic stays',
    icon: Waves,
    color: 'bg-cyan-50 text-cyan-600'
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    desc: 'Pink city heritage forts & palaces',
    icon: Landmark,
    color: 'bg-rose-50 text-rose-600'
  },
  {
    name: 'Delhi NCR',
    state: 'Delhi',
    desc: 'For its stunning capital architecture',
    icon: Building2,
    color: 'bg-indigo-50 text-indigo-600'
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    desc: 'Garden city & luxury tech hubs',
    icon: Compass,
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    desc: 'Popular with travellers near you',
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600'
  }
];

const languagesList = [
  { id: 'en-IN', name: 'English (IN)', native: 'English', region: 'India' },
  { id: 'hi-IN', name: 'Hindi', native: 'हिन्दी', region: 'भारत' },
  { id: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', region: 'ભારત' },
  { id: 'mr-IN', name: 'Marathi', native: 'मराठी', region: 'भारत' },
  { id: 'bn-IN', name: 'Bengali', native: 'বাংলা', region: 'भारत' },
  { id: 'ta-IN', name: 'Tamil', native: 'தமிழ்', region: 'இந்தியா' },
  { id: 'te-IN', name: 'Telugu', native: 'తెలుగు', region: 'భారతదేశం' },
  { id: 'en-US', name: 'English (US)', native: 'English', region: 'United States' },
  { id: 'es-ES', name: 'Spanish', native: 'Español', region: 'España' },
  { id: 'fr-FR', name: 'French', native: 'Français', region: 'France' },
  { id: 'de-DE', name: 'German', native: 'Deutsch', region: 'Deutschland' },
  { id: 'ja-JP', name: 'Japanese', native: '日本語', region: '日本' },
];

const currenciesList = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const Navbar = () => {
  const { user, logout, isCustomer, isHotelOwner, isAdmin } = useAuth();
  const { currentLang, currentCurrency, changeLanguage, changeCurrency, t } = useLanguage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Language & Currency Modal State
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState('language'); // 'language' | 'currency'

  // Interactive Search Bar State
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [searchDestination, setSearchDestination] = useState('');
  const [searchCheckIn, setSearchCheckIn] = useState(getTodayStr());
  const [searchCheckOut, setSearchCheckOut] = useState(getTomorrowStr());
  const [searchRooms, setSearchRooms] = useState(1);
  const [searchAdults, setSearchAdults] = useState(2);
  const [searchChildren, setSearchChildren] = useState(0);

  const [activeNavSearchTab, setActiveNavSearchTab] = useState(null); // 'where' | 'when' | 'who' | null
  const navSearchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Hide main website navbar on Admin and Owner dashboard pages so Sidebar takes full screen height
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navSearchRef.current && !navSearchRef.current.contains(event.target)) {
        setActiveNavSearchTab(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveNavSearchTab(null);
    const params = new URLSearchParams({
      city: searchDestination || 'Ahmedabad',
      check_in: searchCheckIn,
      check_out: searchCheckOut,
      rooms: searchRooms.toString(),
      guests: (searchAdults + searchChildren).toString()
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleQuickPresetDays = (days) => {
    const start = new Date();
    const end = new Date(Date.now() + days * 86400000);
    setSearchCheckIn(start.toISOString().split('T')[0]);
    setSearchCheckOut(end.toISOString().split('T')[0]);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const roleBadges = {
    CUSTOMER: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">Customer</span>,
    HOTEL_OWNER: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">Hotel Owner</span>,
    HOTEL_STAFF: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">Hotel Staff</span>,
    ADMIN: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">Admin</span>,
    SUPER_ADMIN: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">Super Admin</span>,
    SUPPORT_AGENT: <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">Support Agent</span>,
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 glass-header text-slate-900 transition-all duration-300 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 group shrink-0">
            <img
              src="/logo.png"
              alt="GoOnStay Logo"
              className="h-12 sm:h-14 w-auto object-contain rounded-xl hover:scale-105 transition-transform duration-300"
            />
            <div>
              <div className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-center gap-1 text-slate-900 leading-tight">
                <span>Go<span className="text-rose-600">On</span>Stay</span>
              </div>
              <p className="hidden sm:block text-[10px] text-rose-600/80 uppercase tracking-widest font-bold">Premium Vacation & Hotel Stays</p>
            </div>
          </Link>

          {/* Center Navbar Section: Fully Interactive Airbnb Search Capsule Bar */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-4 relative" ref={navSearchRef}>
            <div
              className={`inline-flex items-center gap-1.5 p-1 px-2.5 rounded-full border transition-all duration-500 ease-out ${
                location.pathname === '/' && !isScrolled
                  ? 'opacity-0 -translate-y-4 scale-90 pointer-events-none'
                  : 'opacity-100 translate-y-0 scale-100 pointer-events-auto shadow-sm hover:shadow-md'
              } ${
                activeNavSearchTab
                  ? 'bg-white/95 border-slate-300 ring-4 ring-rose-500/10 backdrop-blur-md'
                  : 'glass-pill-light border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Where Button */}
              <button
                type="button"
                onClick={() => setActiveNavSearchTab(activeNavSearchTab === 'where' ? null : 'where')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  activeNavSearchTab === 'where'
                    ? 'bg-white shadow-md text-rose-600 border border-slate-200/80'
                    : 'hover:bg-slate-100/80 text-slate-800'
                }`}
                title="Choose Destination"
              >
                <span>Where</span>
              </button>

              <span className="w-px h-4 bg-slate-200 shrink-0"></span>

              {/* When Button */}
              <button
                type="button"
                onClick={() => setActiveNavSearchTab(activeNavSearchTab === 'when' ? null : 'when')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  activeNavSearchTab === 'when'
                    ? 'bg-white shadow-md text-rose-600 border border-slate-200/80'
                    : 'hover:bg-slate-100/80 text-slate-800'
                }`}
                title="Select Dates"
              >
                <span>When</span>
              </button>

              <span className="w-px h-4 bg-slate-200 shrink-0"></span>

              {/* Who Button */}
              <button
                type="button"
                onClick={() => setActiveNavSearchTab(activeNavSearchTab === 'who' ? null : 'who')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  activeNavSearchTab === 'who'
                    ? 'bg-white shadow-md text-rose-600 border border-slate-200/80'
                    : 'hover:bg-slate-100/80 text-slate-800'
                }`}
                title="Select Guests & Rooms"
              >
                <span>Who</span>
              </button>

              {/* Search Button (Pink Circle) */}
              <button
                type="button"
                onClick={handleNavSearchSubmit}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 flex items-center justify-center text-white shrink-0 ml-1 shadow-md shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Search Stays"
              >
                <Search className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* FLOATING DROPDOWN POPOVERS BELOW NAVBAR */}
            {activeNavSearchTab === 'where' && (
              <div className="absolute top-full left-0 mt-3 w-96 bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Search City or Destination
                  </h4>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    Popular Stays
                  </span>
                </div>

                {/* Custom City Input */}
                <div className="relative mb-3">
                  <MapPin className="w-4 h-4 text-rose-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Type city name (e.g. Goa, Mumbai, Udaipur)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {destinationsList.map((dest) => {
                    const IconComp = dest.icon;
                    const isSelected = searchDestination === dest.name;
                    return (
                      <div
                        key={dest.name}
                        onClick={() => {
                          setSearchDestination(dest.name);
                          setActiveNavSearchTab('when');
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dest.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-slate-900 truncate">{dest.name}, {dest.state}</h5>
                            {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{dest.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeNavSearchTab === 'when' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Select Check-in & Check-out Dates
                  </h4>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    Real-Time Stays
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={searchCheckIn}
                      onChange={(e) => setSearchCheckIn(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={searchCheckOut}
                      onChange={(e) => setSearchCheckOut(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                {/* Quick Stay Presets */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Stay Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(1)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
                    >
                      1 Night Stay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(2)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
                    >
                      2 Nights Weekend
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(7)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
                    >
                      7 Nights Week
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNavSearchTab('who')}
                  className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-md shadow-rose-600/20"
                >
                  Continue to Guests & Rooms
                </button>
              </div>
            )}

            {activeNavSearchTab === 'who' && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 text-left space-y-4">
                
                {/* Adults */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Adults</h5>
                    <p className="text-[10px] font-semibold text-slate-400">Ages 13+</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSearchAdults(Math.max(1, searchAdults - 1))}
                      disabled={searchAdults <= 1}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{searchAdults}</span>
                    <button
                      type="button"
                      onClick={() => setSearchAdults(Math.min(10, searchAdults + 1))}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Children</h5>
                    <p className="text-[10px] font-semibold text-slate-400">Ages 2-12</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSearchChildren(Math.max(0, searchChildren - 1))}
                      disabled={searchChildren <= 0}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{searchChildren}</span>
                    <button
                      type="button"
                      onClick={() => setSearchChildren(Math.min(6, searchChildren + 1))}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rooms */}
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Rooms</h5>
                    <p className="text-[10px] font-semibold text-slate-400">Total rooms</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSearchRooms(Math.max(1, searchRooms - 1))}
                      disabled={searchRooms <= 1}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{searchRooms}</span>
                    <button
                      type="button"
                      onClick={() => setSearchRooms(Math.min(6, searchRooms + 1))}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNavSearchSubmit}
                  className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4 stroke-[3]" /> Search Available Stays
                </button>
              </div>
            )}
          </div>


          {/* User Auth & Host Section Desktop */}
          <div className="hidden md:flex items-center gap-3 text-xs font-extrabold">
            {/* Become a Host Link */}
            <Link
              to={user && (isHotelOwner || isAdmin) ? "/owner/hotels/new" : "/become-host"}
              className="px-4 py-2 rounded-full glass-pill-light hover:bg-rose-50/90 text-rose-600 transition-all font-black text-xs flex items-center gap-1.5 border border-rose-200/90 shadow-2xs hover:shadow-md hover:scale-[1.02]"
            >
              {t('become_host')}
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Button */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-sm shadow-sm hover:shadow-md border-2 border-white ring-2 ring-slate-200/80 hover:ring-rose-500 transition-all cursor-pointer overflow-hidden backdrop-blur-md"
                title={user ? `${user.first_name || user.username}` : 'User Profile'}
              >
                {user ? (
                  user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()
                  )
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-2.5 animate-fade-in z-50">
                  {user ? (
                    <>
                      <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1 bg-rose-50/50 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                          {roleBadges[user.role]}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <User className="w-4 h-4 text-rose-600" />
                        Manage Profile
                      </Link>

                      <Link
                        to="/my-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-rose-600" />
                        My Bookings
                      </Link>

                      <Link
                        to="/support/tickets"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Help & Support
                      </Link>

                      {isCustomer && (
                        <Link
                          to="/become-host"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Become a Host (List Hotel)
                        </Link>
                      )}

                      {(user.role === 'HOTEL_OWNER' || user.role === 'ADMIN' || user.is_superuser) && (
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          Hotel Owner Portal
                        </Link>
                      )}

                      {(user.role === 'HOTEL_STAFF' || user.role === 'HOTEL_OWNER' || user.role === 'ADMIN' || user.is_superuser) && (
                        <Link
                          to="/staff/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          <Hotel className="w-4 h-4 text-indigo-600" />
                          Hotel Staff Desk
                        </Link>
                      )}

                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.is_superuser) && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/profile?tab=settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors border-t border-slate-100 mt-1 pt-2"
                      >
                        <Settings className="w-4 h-4 text-slate-600" />
                        Settings & Language
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 mt-1 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-900 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Create Account
                      </Link>
                      <Link
                        to="/become-host"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        Become a Host (List Hotel)
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1 pt-2"
                      >
                        About GoOnStay
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Mobile Menu Toggle & Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            <NotificationBell />

            {/* Hamburger Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 px-2 space-y-2 animate-fade-in bg-white">
            
            {/* Become Host Mobile Menu Link */}
            <Link
              to={user && (isHotelOwner || isAdmin) ? "/owner/hotels/new" : "/become-host"}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <span>Become a Host (List Property)</span>
            </Link>

            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
            >
              Stays
            </Link>
            <Link
              to="/search"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
            >
              Explore Hotels
            </Link>
            <Link
              to="/offers"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
            >
              Offers
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                >
                  My Bookings
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                >
                  My Profile
                </Link>
                <Link
                  to="/profile?tab=settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                >
                  Settings & Language
                </Link>
                {isHotelOwner && (
                  <Link
                    to="/owner/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-teal-700 font-bold"
                  >
                    Hotel Owner Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-cyan-700 font-bold"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 font-bold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl bg-slate-100 text-sm font-bold text-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn-teal w-full text-center py-2.5 text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AIRBNB-STYLE LANGUAGE & REGION MODAL (RENDERED VIA PORTAL TO BODY) */}
      {langModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveLangTab('language')}
                  className={`text-sm font-extrabold pb-1 transition-all border-b-2 cursor-pointer ${
                    activeLangTab === 'language'
                      ? 'text-slate-900 border-slate-900'
                      : 'text-slate-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  Language and region
                </button>
                <button
                  onClick={() => setActiveLangTab('currency')}
                  className={`text-sm font-extrabold pb-1 transition-all border-b-2 cursor-pointer ${
                    activeLangTab === 'currency'
                      ? 'text-slate-900 border-slate-900'
                      : 'text-slate-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  Currency
                </button>
              </div>

              <button
                onClick={() => setLangModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeLangTab === 'language' ? (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                    Suggested languages & regions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {languagesList.map((lang) => {
                      const isSelected = currentLang === lang.id.split('-')[0];
                      return (
                        <div
                          key={lang.id}
                          onClick={() => {
                            changeLanguage(lang.id);
                            setLangModalOpen(false);
                          }}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-slate-200/80 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {lang.name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                          </div>
                          <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {lang.native} • {lang.region}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                    Choose a currency
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currenciesList.map((curr) => {
                      const isSelected = currentCurrency === curr.code;
                      return (
                        <div
                          key={curr.code}
                          onClick={() => {
                            changeCurrency(curr.code);
                            setLangModalOpen(false);
                          }}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-slate-200/80 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {curr.name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                          </div>
                          <p className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {curr.code} – {curr.symbol}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;
