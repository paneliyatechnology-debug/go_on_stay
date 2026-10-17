import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Minus, Plus, Building2,
  Sparkles, Compass, Check, Palmtree, Landmark, Waves
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import VoiceSearchButton from './VoiceSearchButton';

const destinationsList = [
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    desc: 'Heritage city & Sabarmati Riverfront',
    icon: Landmark,
    color: 'bg-teal-50 text-teal-600'
  },
  {
    name: 'Surat',
    state: 'Gujarat',
    desc: 'Diamond & Silk city of India',
    icon: Building2,
    color: 'bg-amber-50 text-amber-600'
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
  }
];

const InteractiveSearchBar = ({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn || getTodayStr());
  const [checkOut, setCheckOut] = useState(initialCheckOut || getTomorrowStr());
  const [rooms, setRooms] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // 'where' | 'when' | 'who' | null

  // Dynamic Cities from API
  const [dynamicCities, setDynamicCities] = useState([]);

  useEffect(() => {
    fetchActiveCities();
  }, []);

  const fetchActiveCities = async () => {
    try {
      const res = await api.get('/hotels/cities/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDynamicCities(res.data);
      }
    } catch (err) {
      console.error('Failed to load active cities:', err);
    }
  };

  const activeDestinations = dynamicCities.length > 0
    ? dynamicCities.map((cityName) => {
        const found = destinationsList.find((d) => d.name.toLowerCase() === cityName.toLowerCase());
        return found || {
          name: cityName,
          state: 'India',
          desc: `Explore luxury stays & hotels in ${cityName}`,
          icon: Building2,
          color: 'bg-rose-50 text-rose-600'
        };
      })
    : destinationsList;

  const searchBarRef = useRef(null);

  // Scroll shrink listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setActiveTab(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveTab(null);

    const params = new URLSearchParams({
      city: destination,
      check_in: checkIn,
      check_out: checkOut,
      rooms: rooms.toString(),
      guests: (adults + children).toString()
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleQuickPresetDays = (days) => {
    const start = new Date();
    const end = new Date(Date.now() + days * 86400000);
    setCheckIn(start.toISOString().split('T')[0]);
    setCheckOut(end.toISOString().split('T')[0]);
  };

  return (
    <div
      ref={searchBarRef}
      className="relative z-30 mx-auto max-w-4xl my-1 transition-all duration-300 ease-out px-2 sm:px-0"
    >
      
      {/* Outer Capsule Pill Container */}
      <div
        className={`rounded-full border transition-all duration-300 flex items-center justify-between gap-1 shadow-xl hover:shadow-2xl ${
          isScrolled ? 'p-1.5 bg-white/95 backdrop-blur-md border-slate-300/90 ring-1 ring-slate-900/5' : 'p-2 sm:p-2.5'
        } ${
          activeTab
            ? 'bg-slate-100/95 border-slate-300 shadow-2xl ring-4 ring-slate-900/5'
            : 'bg-white border-slate-200/90 hover:border-slate-300'
        }`}
      >
        
        {/* Segment 1: WHERE */}
        <div
          onClick={() => setActiveTab(activeTab === 'where' ? null : 'where')}
          className={`flex-1 rounded-full cursor-pointer transition-all min-w-0 flex items-center justify-center ${
            isScrolled ? 'px-1.5 sm:px-4 py-1.5 sm:py-2' : 'px-2 sm:px-6 py-2 sm:py-3'
          } ${
            activeTab === 'where'
              ? 'bg-white shadow-md text-rose-600 border border-slate-200/90 font-black'
              : 'hover:bg-slate-100/80 text-slate-800 font-extrabold'
          }`}
        >
          <span className="text-[11px] sm:text-sm font-black tracking-tight truncate">Where</span>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-slate-200 shrink-0 h-4 sm:h-6 mx-0.5"></div>

        {/* Segment 2: WHEN */}
        <div
          onClick={() => setActiveTab(activeTab === 'when' ? null : 'when')}
          className={`flex-1 rounded-full cursor-pointer transition-all min-w-0 flex items-center justify-center ${
            isScrolled ? 'px-1.5 sm:px-4 py-1.5 sm:py-2' : 'px-2 sm:px-6 py-2 sm:py-3'
          } ${
            activeTab === 'when'
              ? 'bg-white shadow-md text-rose-600 border border-slate-200/90 font-black'
              : 'hover:bg-slate-100/80 text-slate-800 font-extrabold'
          }`}
        >
          <span className="text-[11px] sm:text-sm font-black tracking-tight truncate">When</span>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-slate-200 shrink-0 h-4 sm:h-6 mx-0.5"></div>

        {/* Segment 3: WHO */}
        <div
          onClick={() => setActiveTab(activeTab === 'who' ? null : 'who')}
          className={`flex-1 rounded-full cursor-pointer transition-all min-w-0 flex items-center justify-center ${
            isScrolled ? 'px-1.5 sm:px-4 py-1.5 sm:py-2' : 'px-2 sm:px-6 py-2 sm:py-3'
          } ${
            activeTab === 'who'
              ? 'bg-white shadow-md text-rose-600 border border-slate-200/90 font-black'
              : 'hover:bg-slate-100/80 text-slate-800 font-extrabold'
          }`}
        >
          <span className="text-[11px] sm:text-sm font-black tracking-tight truncate">Who</span>
        </div>

        {/* Voice Search Button */}
        <VoiceSearchButton
          onTranscript={(spokenCity) => {
            setDestination(spokenCity);
          }}
          onSearch={(spokenCity) => {
            setDestination(spokenCity);
            const params = new URLSearchParams({
              city: spokenCity || '',
              check_in: checkIn,
              check_out: checkOut,
              rooms: rooms.toString(),
              guests: (adults + children).toString(),
            });
            navigate(`/search?${params.toString()}`);
          }}
          className="ml-1"
        />

        {/* Search Button (Expands when activeTab is open or compact circle when closed) */}
        <button
          type="button"
          onClick={handleSearchSubmit}
          className={`rounded-full bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white flex items-center justify-center font-black shadow-lg shadow-rose-600/35 active:scale-95 hover:scale-105 transition-all shrink-0 ml-0.5 ${
            activeTab
              ? 'px-3 sm:px-5 py-2 sm:py-2.5 gap-1.5 sm:gap-2 h-9 sm:h-11'
              : isScrolled
              ? 'w-9 h-9 sm:w-10 sm:h-10'
              : 'w-10 h-10 sm:w-12 sm:h-12'
          }`}
          title="Search Hotels"
        >
          <Search className={`${activeTab ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]' : isScrolled ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]' : 'w-4 h-4 sm:w-5 sm:h-5 stroke-[3]'}`} />
          {activeTab && <span className="text-[11px] sm:text-xs uppercase tracking-wider font-extrabold hidden sm:inline">{t('search')}</span>}
        </button>

      </div>


      {/* FLOATING POPOVER: WHERE (DESTINATIONS) */}
      {activeTab === 'where' && (
        <div className="absolute top-full left-0 right-0 sm:right-auto mt-3 w-full sm:w-96 bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Popular Destinations
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded-xl">
              <span>Voice</span>
              <VoiceSearchButton
                onTranscript={(city) => {
                  setDestination(city);
                  setActiveTab('when');
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {activeDestinations.map((dest) => {
              const IconComp = dest.icon;
              const isSelected = destination === dest.name;
              return (
                <div
                  key={dest.name}
                  onClick={() => {
                    setDestination(dest.name);
                    setActiveTab('when');
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dest.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-900 truncate">{dest.name}, {dest.state}</h5>
                      {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{dest.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING POPOVER: WHEN (DATES) */}
      {activeTab === 'when' && (
        <div className="absolute top-full left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 w-full sm:w-[480px] bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Select Check-in & Check-out Dates
            </h4>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-rose-200">
              Real-Time Dates
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Check-in Date
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Check-out Date
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Stay Options
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickPresetDays(1)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
              >
                1 Night Stay
              </button>
              <button
                type="button"
                onClick={() => handleQuickPresetDays(2)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
              >
                ± 2 Days Weekend
              </button>
              <button
                type="button"
                onClick={() => handleQuickPresetDays(3)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
              >
                ± 3 Days Holiday
              </button>
              <button
                type="button"
                onClick={() => handleQuickPresetDays(7)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-rose-600 hover:text-rose-600 transition-colors"
              >
                ± 7 Days Week
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('who')}
            className="w-full py-2.5 text-xs font-extrabold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-md shadow-rose-600/20"
          >
            Continue to Guests & Rooms
          </button>
        </div>
      )}


      {/* FLOATING POPOVER: WHO (GUESTS & ROOMS COUNTER) */}
      {activeTab === 'who' && (
        <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-3 w-full sm:w-96 bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-4 sm:space-y-5">
          
          {/* Adult Counter */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h5 className="text-xs font-black text-slate-900">Adults</h5>
              <p className="text-[11px] font-semibold text-slate-400">Ages 13 or above</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 disabled:opacity-30 disabled:hover:border-slate-300 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-slate-900 w-4 text-center">{adults}</span>
              <button
                type="button"
                onClick={() => setAdults(Math.min(10, adults + 1))}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Children Counter */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h5 className="text-xs font-black text-slate-900">Children</h5>
              <p className="text-[11px] font-semibold text-slate-400">Ages 2-12</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setChildren(Math.max(0, children - 1))}
                disabled={children <= 0}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 disabled:opacity-30 disabled:hover:border-slate-300 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-slate-900 w-4 text-center">{children}</span>
              <button
                type="button"
                onClick={() => setChildren(Math.min(6, children + 1))}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rooms Counter */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h5 className="text-xs font-black text-slate-900">Rooms Required</h5>
              <p className="text-[11px] font-semibold text-slate-400">Number of rooms needed</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRooms(Math.max(1, rooms - 1))}
                disabled={rooms <= 1}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 disabled:opacity-30 disabled:hover:border-slate-300 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-slate-900 w-4 text-center">{rooms}</span>
              <button
                type="button"
                onClick={() => setRooms(Math.min(6, rooms + 1))}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-800 hover:text-slate-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearchSubmit}
            className="btn-rose w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 bg-rose-600 text-white rounded-xl hover:bg-rose-700"
          >
            <Search className="w-4 h-4 stroke-[3]" /> Search Available Stays
          </button>
        </div>
      )}

    </div>
  );
};

export default InteractiveSearchBar;
