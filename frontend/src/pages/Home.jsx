import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Hotel, ShieldCheck,
  Star, Compass, CheckCircle2, ArrowRight, Tag,
  ChevronLeft, ChevronRight, Heart, Wifi, Coffee, Tv,
  Clock, ChevronDown, X, Palmtree, Waves, Building2,
  Percent, Copy, Check, Award, Headset, Zap, Flame, Landmark
} from 'lucide-react';
import api from '../services/api';
import InteractiveSearchBar from '../components/InteractiveSearchBar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, showToast } = useAuth();

  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Wishlist State & Handlers
  const [userWishlist, setUserWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setUserWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist/');
      const list = res.data.results || res.data;
      setUserWishlist(list.map((item) => item.hotel));
    } catch (err) {
      console.error('Failed to load user wishlist:', err);
    }
  };

  const handleToggleWishlist = async (e, hotel) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in as a Customer to save hotels to your wishlist.', 'info');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/wishlist/toggle/${hotel.id}/`);
      if (res.data.is_favorited) {
        setUserWishlist((prev) => [...prev, hotel.id]);
        showToast(`Saved "${hotel.name}" to your wishlist!`);
      } else {
        setUserWishlist((prev) => prev.filter((id) => id !== hotel.id));
        showToast(`Removed "${hotel.name}" from your wishlist.`);
      }
    } catch (err) {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  // Scroll Ref for Popular Cities horizontal navigation
  const cityScrollRef = useRef(null);

  useEffect(() => {
    fetchFeaturedHotels();
  }, []);

  const fetchFeaturedHotels = async () => {
    setLoadingHotels(true);
    try {
      const res = await api.get('/hotels/');
      const rawList = res.data.results || res.data;
      const sorted = [...rawList].sort((a, b) => {
        const ratingA = a.guest_rating !== null && a.guest_rating !== undefined ? parseFloat(a.guest_rating) : (a.star_rating || 0);
        const ratingB = b.guest_rating !== null && b.guest_rating !== undefined ? parseFloat(b.guest_rating) : (b.star_rating || 0);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.reviews_count || 0) - (a.reviews_count || 0);
      });
      setFeaturedHotels(sorted);
    } catch (err) {
      console.error('Failed to load featured hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  };

  // Auto-slide cities with manual pause/control
  const [isPaused, setIsPaused] = useState(false);

  const scrollCities = (direction) => {
    if (cityScrollRef.current) {
      const cardStep = 280;
      cityScrollRef.current.scrollBy({
        left: direction === 'left' ? -cardStep : cardStep,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      if (cityScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = cityScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          cityScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          cityScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Curated Popular Indian destinations with vibrant imagery
  const popularCities = [
    {
      name: 'Ahmedabad',
      state: 'Gujarat',
      tag: 'Heritage & Food',
      count: 'Verified Stays',
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-emerald-500'
    },
    {
      name: 'Goa',
      state: 'Goa',
      tag: 'Beach Resorts',
      count: 'Ocean Stays',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-amber-500'
    },
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      tag: 'City Luxury',
      count: 'Top Rated',
      image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-blue-500'
    },
    {
      name: 'Udaipur',
      state: 'Rajasthan',
      tag: 'Lake Palaces',
      count: 'Royal Haveli',
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-purple-500'
    },
    {
      name: 'Jaipur',
      state: 'Rajasthan',
      tag: 'Pink City Forts',
      count: 'Palace Stays',
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-rose-500'
    },
    {
      name: 'Surat',
      state: 'Gujarat',
      tag: 'Diamond City',
      count: 'Business Stays',
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
      badgeColor: 'bg-teal-500'
    },
  ];

  // City Filter State for Featured Stays
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');

  // Dynamic city categories from existing hotels
  const cityCategories = React.useMemo(() => {
    const cities = new Set(featuredHotels.map((h) => h.city).filter(Boolean));
    return ['ALL', ...Array.from(cities)];
  }, [featuredHotels]);

  const groupedHotelsByCity = React.useMemo(() => {
    const groups = {};
    featuredHotels.forEach((hotel) => {
      const cityKey = hotel.city || 'Other';
      if (!groups[cityKey]) groups[cityKey] = [];
      groups[cityKey].push(hotel);
    });
    return groups;
  }, [featuredHotels]);

  const activeCitiesList = Object.keys(groupedHotelsByCity);

  // Quick category filters
  const [activeCategory, setActiveCategory] = useState('all');
  const travelCategories = [
    { id: 'all', label: 'All Stays', icon: Hotel },
    { id: 'beach', label: 'Beachfront', icon: Palmtree, city: 'Goa' },
    { id: 'heritage', label: 'Heritage & Palaces', icon: Landmark, city: 'Jaipur' },
    { id: 'city', label: 'City Stays', icon: Building2, city: 'Mumbai' },
    { id: 'lakes', label: 'Lake Views', icon: Waves, city: 'Udaipur' },
    { id: 'deals', label: 'Top Value', icon: Percent },
  ];

  // Copy coupon handler
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showToast(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      
      {/* 1. HERO SECTION WITH VIBRANT ATMOSPHERIC BACKGROUND */}
      <section className="relative bg-gradient-to-b from-rose-900 via-rose-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Subtle decorative background light accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          
          {/* Subtle Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-rose-200">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Discover Unforgettable Stays Across India</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Book Hotels, Resorts & <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-200 to-amber-300">
              Vacation Homes with Ease
            </span>
          </h1>

          <p className="text-sm sm:text-base text-rose-100/90 max-w-2xl mx-auto font-medium">
            Direct owner prices, verified amenities, instant confirmation, and 24/7 dedicated traveler support.
          </p>

          {/* Interactive Search Bar Container */}
          <div className="pt-2 max-w-4xl mx-auto">
            <InteractiveSearchBar />
          </div>

          {/* Quick Category Icon Navigation Pills */}
          <div className="pt-4 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2">
            {travelCategories.map((cat) => {
              const Icon = cat.icon || Hotel;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (cat.city) {
                      navigate(`/search?city=${encodeURIComponent(cat.city)}`);
                    } else if (cat.id === 'deals') {
                      setSelectedCityFilter('ALL');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-rose-700 shadow-md scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-rose-300'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* 2. PROMOTIONAL DISCOUNT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 rounded-2xl p-4 sm:p-5 shadow-lg text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Special Welcome Deal: Get 10% OFF on your stay!</h3>
              <p className="text-xs text-white/90">Use coupon code at checkout on your next hotel reservation.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 rounded-lg bg-white/20 font-mono font-bold text-xs tracking-wider border border-white/30">
              WELCOME10
            </span>
            <button
              onClick={() => handleCopyCoupon('WELCOME10')}
              className="px-3.5 py-1.5 rounded-lg bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copiedCoupon ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoupon ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. POPULAR DESTINATIONS SLIDER WITH CONTROLS */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header with Left / Right Slider Controls */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Explore India</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Destinations
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCities('left')}
              className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
              title="Previous Destinations"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCities('right')}
              className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
              title="Next Destinations"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Destinations Row */}
        <div
          ref={cityScrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
        >
          {popularCities.map((city, index) => (
            <div
              key={`${city.name}-${index}`}
              onClick={() => navigate(`/search?city=${encodeURIComponent(city.name)}`)}
              className="group min-w-[240px] sm:min-w-[260px] h-72 rounded-2xl overflow-hidden relative cursor-pointer border border-slate-200 shrink-0 hover-lift shadow-xs bg-slate-900"
            >
              {/* Background Photo with smooth zoom */}
              <img
                src={city.image}
                alt={city.name}
                className="w-full h-full object-cover img-zoom opacity-90 group-hover:opacity-100"
              />

              {/* Dark Vignette Bottom Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              {/* Top Tag Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-slate-900/70 backdrop-blur-sm border border-white/20">
                  {city.tag}
                </span>
              </div>

              {/* Bottom City Information */}
              <div className="absolute bottom-3 left-3 right-3 text-white space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <h3 className="text-lg font-bold tracking-tight group-hover:text-rose-300 transition-colors">
                    {city.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 pl-5.5 font-medium">
                  {city.state} • {city.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED STAYS SECTION (GROUPED BY CITY ROWS) */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & City Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Handpicked Hotels</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Places to Stay
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verified luxury resorts, boutique villas, and hotels across major Indian cities
            </p>
          </div>

          {/* Interactive City Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {cityCategories.map((cityName) => {
              const isSelected = selectedCityFilter === cityName;
              return (
                <button
                  key={cityName}
                  onClick={() => setSelectedCityFilter(cityName)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cityName === 'ALL' ? 'All Cities' : cityName}
                </button>
              );
            })}
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loadingHotels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-3 animate-pulse">
                <div className="w-full h-44 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* If Single City Selected */}
            {selectedCityFilter !== 'ALL' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-600" />
                    <span>Hotels in {selectedCityFilter}</span>
                  </h3>
                  <button
                    onClick={() => navigate(`/search?city=${encodeURIComponent(selectedCityFilter)}`)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    View All in {selectedCityFilter}
                  </button>
                </div>

                {groupedHotelsByCity[selectedCityFilter] && groupedHotelsByCity[selectedCityFilter].length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {groupedHotelsByCity[selectedCityFilter].map((hotel) => (
                      <HotelCard
                        key={hotel.id}
                        hotel={hotel}
                        isWishlisted={userWishlist.includes(hotel.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onNavigate={() => navigate(`/hotels/${hotel.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                    <Hotel className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">No hotels currently listed in {selectedCityFilter}.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Grouped by City Rows */
              (activeCitiesList.length > 0 ? activeCitiesList : ['Ahmedabad', 'Mumbai', 'Goa']).map((cityName) => {
                const cityHotels = groupedHotelsByCity[cityName] || [];
                if (cityHotels.length === 0) return null;

                return (
                  <div key={cityName} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{cityName}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            ({cityHotels.length} {cityHotels.length === 1 ? 'Stay' : 'Stays'})
                          </span>
                        </h3>
                      </div>

                      <button
                        onClick={() => navigate(`/search?city=${encodeURIComponent(cityName)}`)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        See All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {cityHotels.map((hotel) => (
                        <HotelCard
                          key={hotel.id}
                          hotel={hotel}
                          isWishlisted={userWishlist.includes(hotel.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onNavigate={() => navigate(`/hotels/${hotel.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        )}
      </section>

      {/* 5. WHY CHOOSE GOONSTAY (TRUST & SERVICE PROPS) */}
      <section className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Why GoOnStay</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospitality You Can Count On
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              We connect you directly to premier hotel owners with total pricing transparency and verified service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Prop 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">100% Verified Stays</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Every property listing and room photograph is thoroughly reviewed for authentic guest experiences.
              </p>
            </div>

            {/* Prop 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Direct Owner Pricing</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                No middleman inflation. Room rates come straight from property hosts with transparent nightly breakdowns.
              </p>
            </div>

            {/* Prop 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Instant Confirmation</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Real-time calendar checking ensures rooms are booked instantly with no double-booking risks.
              </p>
            </div>

            {/* Prop 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Our support desk is always active to assist with modifications, check-in help, and questions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. PARTNER WITH GOONSTAY (HOST CALL TO ACTION) */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl">
          
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block">
              Host Community
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Own a Hotel, Resort, or Villa?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              List your property on GoOnStay. Get direct reservations, manage your room inventory, and connect directly with thousands of traveling guests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate('/become-host')}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              List Your Property
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors"
            >
              Host Sign In
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

// Reusable Hotel Card Component
const HotelCard = ({ hotel, isWishlisted, onToggleWishlist, onNavigate }) => {
  const imageUrl = hotel.primary_image || hotel.cover_image || (hotel.images && hotel.images[0]?.display_url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={onNavigate}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover-lift flex flex-col cursor-pointer"
    >
      {/* Hotel Photo Banner */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover img-zoom"
        />

        {/* Rating Pill */}
        <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs border border-white/10">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{hotel.guest_rating ? Number(hotel.guest_rating).toFixed(1) : (hotel.star_rating || 4.5)}</span>
        </div>

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => onToggleWishlist(e, hotel)}
          className={`absolute top-2.5 left-2.5 p-2 rounded-full transition-transform active:scale-90 shadow-sm cursor-pointer ${
            isWishlisted
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900/70 text-white hover:bg-rose-600'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* City Pill */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border border-white/10">
          <MapPin className="w-3 h-3 text-rose-400" />
          <span>{hotel.city}</span>
        </div>
      </div>

      {/* Hotel Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
            {hotel.name}
          </h4>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {hotel.description || 'Verified luxury hotel with modern hospitality and comfortable rooms.'}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Starts from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-rose-600">
                ₹{(hotel.starting_price || 2500).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            View Stay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
