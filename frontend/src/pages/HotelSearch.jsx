import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Star, Filter, ArrowUpDown,
  SlidersHorizontal, CheckCircle2, Hotel, ShieldCheck, Heart, Sparkles, Tag,
  Utensils, X, RotateCcw, Building2, Waves, Palmtree, Landmark, Compass,
  LayoutGrid, Map
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoiceSearchButton from '../components/VoiceSearchButton';
import HotelMapView from '../components/HotelMapView';

const availableAmenities = [
  'Free High-Speed Wi-Fi',
  'Swimming Pool',
  'Complimentary Breakfast',
  'Free Parking',
  'Spa & Wellness Center',
  'Air Conditioning',
  'Fitness Center & Gym'
];

const getRatingLabel = (rating) => {
  const num = parseFloat(rating);
  if (isNaN(num)) return 'Newly Listed';
  if (num >= 4.7) return 'Exceptional';
  if (num >= 4.5) return 'Superb';
  if (num >= 4.0) return 'Very Good';
  if (num >= 3.5) return 'Good';
  return 'Rated';
};

// Levenshtein similarity calculation (0.0 to 1.0)
const computeSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const l1 = s1.length;
  const l2 = s2.length;
  const maxLen = Math.max(l1, l2);
  if (maxLen === 0) return 1.0;

  const track = Array(l2 + 1).fill(null).map(() => Array(l1 + 1).fill(null));
  for (let i = 0; i <= l1; i += 1) track[0][i] = i;
  for (let j = 0; j <= l2; j += 1) track[j][0] = j;

  for (let j = 1; j <= l2; j += 1) {
    for (let i = 1; i <= l1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return (maxLen - track[l2][l1]) / maxLen;
};

// Common speech recognition variations, phonetics, and travel synonyms
const RELATED_SYNONYMS = {
  radison: ['radisson'],
  radisson: ['radison'],
  hyaat: ['hyatt'],
  hyat: ['hyatt'],
  hyatt: ['hyaat', 'hyat'],
  merriot: ['marriott'],
  mariott: ['marriott'],
  marriot: ['marriott'],
  marriott: ['merriot', 'mariott'],
  lila: ['leela'],
  leela: ['lila'],
  obroy: ['oberoi'],
  oberoy: ['oberoi'],
  oberoi: ['obroy', 'oberoy'],
  taaj: ['taj'],
  taj: ['taaj'],
  mahel: ['mahal'],
  mahal: ['mahel'],
  palace: ['heritage', 'royal', 'fort', 'haveli', 'mahal', 'lake', 'udaipur', 'jaipur'],
  resort: ['villas', 'spa', 'retreat', 'beach', 'goa', 'pool'],
  beach: ['sea', 'ocean', 'coast', 'waterfront', 'goa', 'beachfront'],
  sea: ['beach', 'ocean', 'waterfront', 'coast'],
  pool: ['swimming pool', 'water'],
  luxury: ['5-star', '5 star', 'premium', 'grand', 'palace'],
  budget: ['cheap', 'affordable', 'economy'],
};

const STOP_WORDS_SET = new Set([
  'hotel', 'hotels', 'in', 'at', 'the', 'a', 'an', 'near', 'me', 'pe', 'ke',
  'ka', 'ki', 'se', 'room', 'rooms', 'stay', 'stays', 'show', 'find', 'book',
  'best', 'good', 'mujhe', 'chahiye', 'karo', 'dikhao', 'dikhana', 'batao',
  'and', 'or', 'for', 'of', 'to', 'city'
]);

// Extract meaningful tokens
const extractQueryTokens = (query) => {
  if (!query) return [];
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const meaningful = words.filter(w => !STOP_WORDS_SET.has(w) && w.length > 1);
  return meaningful.length > 0 ? meaningful : words.filter(w => w.length > 1);
};

// Calculate match score for hotel against voice/text query
const calculateHotelMatchScore = (hotel, query) => {
  if (!query) return 100;
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return 100;

  const hName = (hotel.name || '').toLowerCase();
  const hCity = (hotel.city || '').toLowerCase();
  const hState = (hotel.state || '').toLowerCase();
  const hAddress = (hotel.address || '').toLowerCase();
  const hDesc = (hotel.description || '').toLowerCase();
  const hPropType = (hotel.property_type || '').toLowerCase();
  const hAmenities = (hotel.amenities || []).map(a => (a.name || '').toLowerCase()).join(' ');

  const allHotelText = `${hName} ${hCity} ${hState} ${hAddress} ${hPropType} ${hDesc} ${hAmenities}`;

  // 1. Direct full phrase match
  if (allHotelText.includes(cleanQ)) {
    return 100 + (hName.includes(cleanQ) ? 50 : 0);
  }

  // 2. Tokenized & fuzzy word-by-word matching
  const tokens = extractQueryTokens(cleanQ);
  if (tokens.length === 0) return 50;

  let score = 0;
  let matchedTokens = 0;

  const hotelWords = allHotelText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const nameWords = hName.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);

  tokens.forEach((token) => {
    let tokenMatched = false;

    // Check direct substring in hotel name, city, state, or property type
    if (hName.includes(token)) {
      score += 40;
      tokenMatched = true;
    } else if (hCity.includes(token) || hState.includes(token)) {
      score += 30;
      tokenMatched = true;
    } else if (hPropType.includes(token) || hDesc.includes(token) || hAmenities.includes(token)) {
      score += 15;
      tokenMatched = true;
    }

    // Fuzzy / Levenshtein word similarity (e.g. 'radison' vs 'radisson', 'hyaat' vs 'hyatt')
    if (!tokenMatched) {
      for (const hw of nameWords) {
        if (computeSimilarity(token, hw) >= 0.72) {
          score += 35;
          tokenMatched = true;
          break;
        }
      }
    }

    if (!tokenMatched) {
      for (const hw of hotelWords) {
        if (computeSimilarity(token, hw) >= 0.75) {
          score += 20;
          tokenMatched = true;
          break;
        }
      }
    }

    // Synonym / related words match
    if (!tokenMatched) {
      const syns = RELATED_SYNONYMS[token] || [];
      for (const syn of syns) {
        if (allHotelText.includes(syn)) {
          score += 18;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) {
      matchedTokens += 1;
    }
  });

  return matchedTokens > 0 ? score : 0;
};

const HotelSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Dynamic Cities from API
  const [activeCities, setActiveCities] = useState([]);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await api.get('/hotels/cities/');
      if (Array.isArray(res.data)) {
        setActiveCities(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch active hotel cities:', err);
    }
  };

  const quickCities = [
    { name: 'All Cities', value: '' },
    ...activeCities.map((c) => ({ name: c, value: c }))
  ];

  // URL search parameters
  const qCityParam = searchParams.get('city') || '';
  const qSearchParam = searchParams.get('search') || searchParams.get('query') || '';
  const checkIn = searchParams.get('check_in') || getTodayStr();
  const checkOut = searchParams.get('check_out') || getTomorrowStr();
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const guests = parseInt(searchParams.get('guests') || '2');

  // Filter States
  const [searchCityInput, setSearchCityInput] = useState(qCityParam || qSearchParam);
  const [priceMax, setPriceMax] = useState(15000);
  const [selectedStars, setSelectedStars] = useState([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Sorting State
  const [sortBy, setSortBy] = useState('recommended');

  // Hotels Data
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

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
        showToast(`Saved "${hotel.name}" to your wishlist! ❤️`);
      } else {
        setUserWishlist((prev) => prev.filter((id) => id !== hotel.id));
        showToast(`Removed "${hotel.name}" from your wishlist.`);
      }
    } catch (err) {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  // Sync search input when URL changes
  useEffect(() => {
    setSearchCityInput(qCityParam || qSearchParam);
  }, [qCityParam, qSearchParam]);

  // Fetch hotels whenever URL parameters change
  useEffect(() => {
    fetchHotels();
  }, [searchParams]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const activeCity = searchParams.get('city') || '';
      const activeQuery = searchParams.get('search') || searchParams.get('query') || '';
      
      const queryParams = new URLSearchParams();
      if (activeCity) queryParams.append('city', activeCity);
      if (activeQuery) queryParams.append('search', activeQuery);

      const res = await api.get(`/hotels/?${queryParams.toString()}`);
      setHotels(res.data.results || res.data);
    } catch (err) {
      console.error('Search API error:', err);
      showToast('Failed to fetch hotel search results.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchCityInput.trim()) {
      newParams.set('city', searchCityInput.trim());
      newParams.delete('search');
    } else {
      newParams.delete('city');
      newParams.delete('search');
    }
    setSearchParams(newParams, { preventScrollReset: true });
  };

  const handleQuickCitySelect = (cityName) => {
    setSearchCityInput(cityName);
    const newParams = new URLSearchParams(searchParams);
    if (cityName) {
      newParams.set('city', cityName);
      newParams.delete('search');
    } else {
      newParams.delete('city');
      newParams.delete('search');
    }
    setSearchParams(newParams, { preventScrollReset: true });
  };

  const handleStarToggle = (star) => {
    if (selectedStars.includes(star)) {
      setSelectedStars(selectedStars.filter((s) => s !== star));
    } else {
      setSelectedStars([...selectedStars, star]);
    }
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleResetFilters = () => {
    setPriceMax(15000);
    setSelectedStars([]);
    setFreeCancellation(false);
    setBreakfastIncluded(false);
    setSelectedAmenities([]);
    setSearchCityInput('');
    setSearchParams(
      new URLSearchParams({ check_in: checkIn, check_out: checkOut, rooms: rooms.toString(), guests: guests.toString() }),
      { preventScrollReset: true }
    );
  };

  // Client-Side Multi-Criteria Filtering with Intelligent Fuzzy & Partial Token Matching
  const activeCityFilter = (searchParams.get('city') || searchCityInput || '').trim();

  const filteredHotels = hotels
    .map((hotel) => {
      const score = activeCityFilter ? calculateHotelMatchScore(hotel, activeCityFilter) : 100;
      return { ...hotel, _matchScore: score };
    })
    .filter((hotel) => {
      // Voice / Text search match (must have score > 0 if active search filter is applied)
      if (activeCityFilter && hotel._matchScore <= 0) return false;

      // Price Filtering
      const startingPrice = hotel.starting_price || 0;
      if (startingPrice > priceMax) return false;

      // Star Rating Filtering
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.star_rating)) return false;

      // Booking Options Filtering
      if (freeCancellation && hotel.rooms && !hotel.rooms.some((r) => r.free_cancellation)) return false;
      if (breakfastIncluded && hotel.rooms && !hotel.rooms.some((r) => r.breakfast_included)) return false;

      // Amenities Filtering
      if (selectedAmenities.length > 0) {
        const hotelAmenityNames = (hotel.amenities || []).map((a) => (a.name || '').toLowerCase());
        const hasAllAmenities = selectedAmenities.every((selectedA) =>
          hotelAmenityNames.some((hA) => hA.includes(selectedA.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

  // Sorting (Relevance / Match Score first when searching -> Recommended / Price / Rating)
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    // When query is active, sort by highest match score first
    if (activeCityFilter && (b._matchScore || 0) !== (a._matchScore || 0)) {
      return (b._matchScore || 0) - (a._matchScore || 0);
    }

    if (sortBy === 'price_low') return (a.starting_price || 0) - (b.starting_price || 0);
    if (sortBy === 'price_high') return (b.starting_price || 0) - (a.starting_price || 0);
    
    // Rating / Recommended sorting: 5 rating first -> more reviews -> star rating
    const ratingA = a.guest_rating !== null && a.guest_rating !== undefined ? parseFloat(a.guest_rating) : (a.star_rating || 0);
    const ratingB = b.guest_rating !== null && b.guest_rating !== undefined ? parseFloat(b.guest_rating) : (b.star_rating || 0);
    if (ratingB !== ratingA) return ratingB - ratingA;

    const countA = a.reviews_count || 0;
    const countB = b.reviews_count || 0;
    if (countB !== countA) return countB - countA;

    return (b.star_rating || 0) - (a.star_rating || 0);
  });


  const activeFiltersCount =
    (selectedStars.length > 0 ? 1 : 0) +
    (priceMax < 15000 ? 1 : 0) +
    (freeCancellation ? 1 : 0) +
    (breakfastIncluded ? 1 : 0) +
    selectedAmenities.length;

  const displayCityName = searchParams.get('city') || searchCityInput || 'All Cities';

  // State for Filter Drawer Modal
  const [showFilterModal, setShowFilterModal] = useState(false);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-16">
      
      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Results Header, Filters Button & Sorting Bar */}
        <div className="card-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Hotels in <span className="text-rose-600">{displayCityName || 'All Destinations'}</span></span>
              <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 font-extrabold">
                {sortedHotels.length} Stays
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Verified available properties for {checkIn} → {checkOut} ({guests} Guests, {rooms} Room)
            </p>
          </div>

          {/* Search Input with Voice Search & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            
            {/* Quick City Search with Voice */}
            <form onSubmit={handleCitySearchSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-rose-600 focus-within:bg-white transition-all flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchCityInput}
                onChange={(e) => setSearchCityInput(e.target.value)}
                placeholder="Search destination..."
                className="w-full bg-transparent text-xs font-bold outline-none text-slate-900"
              />
              <VoiceSearchButton
                onTranscript={(spoken) => {
                  setSearchCityInput(spoken);
                }}
                onSearch={(spoken) => {
                  setSearchCityInput(spoken);
                  const newParams = new URLSearchParams(searchParams);
                  if (spoken.trim()) {
                    newParams.set('city', spoken.trim());
                  } else {
                    newParams.delete('city');
                  }
                  setSearchParams(newParams);
                }}
              />
            </form>

            {/* View Mode Toggle: List View / Map View */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`py-1.5 px-3 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Switch to List View"
              >
                <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'list' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`py-1.5 px-3 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Switch to Map View"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>

            {/* Filter Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:border-rose-600 hover:text-rose-600 text-slate-900 transition-all font-black text-xs flex items-center gap-2 shadow-2xs hover:shadow-md cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-600" />
              <span>Filters</span>
              {activeFiltersCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase">All</span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs font-extrabold flex-1 sm:flex-initial">
              <span className="text-slate-500 hidden sm:flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-rose-600" /> Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-xs text-slate-900 focus:border-rose-600 outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Star Rating: High to Low</option>
              </select>
            </div>

          </div>
        </div>

        {/* Hotel Cards List (Full Width) */}
        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Searching available hotels in {displayCityName}...</p>
          </div>
        ) : sortedHotels.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <Hotel className="w-12 h-12 text-rose-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Hotels Found for "{displayCityName}"</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We couldn't find any properties matching your current filter criteria in {displayCityName}. Try clearing filters or exploring another destination!
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="btn-rose px-5 py-2.5 text-xs font-extrabold uppercase rounded-xl"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => handleQuickCitySelect('')}
                className="btn-secondary px-5 py-2.5 text-xs font-extrabold uppercase rounded-xl"
              >
                View All Cities
              </button>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Map View with Airbnb Price Badges */
          <div className="space-y-4">
            <HotelMapView
              hotels={sortedHotels}
              checkIn={checkIn}
              checkOut={checkOut}
              rooms={rooms}
              guests={guests}
              userWishlist={userWishlist}
              onToggleWishlist={handleToggleWishlist}
              activeCity={displayCityName}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {sortedHotels.map((hotel) => (
              <div key={hotel.id} className="card-white overflow-hidden flex flex-col md:flex-row group border border-slate-200 hover:shadow-xl transition-all duration-300 rounded-3xl">
                
                {/* Hotel Cover Image & Frosted Glass Badges */}
                <div className="w-full md:w-80 h-56 md:h-[230px] relative bg-slate-200 shrink-0 overflow-hidden">
                  <img
                    src={hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Star Rating Frosted Glass Pill */}
                  <div className="absolute top-3 left-3 glass-pill text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-white/30 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{hotel.star_rating || 5}-Star Luxury</span>
                  </div>

                  {/* City Location Frosted Glass Pill */}
                  <div className="absolute bottom-3 left-3 glass-pill text-white text-[10.5px] font-black px-2.5 py-1 rounded-full shadow-md border border-white/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{hotel.city}</span>
                  </div>

                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(e, hotel)}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 z-10 cursor-pointer ${
                      userWishlist.includes(hotel.id)
                        ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                        : 'bg-slate-900/60 text-white hover:bg-rose-600 hover:text-white'
                    }`}
                    title={userWishlist.includes(hotel.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${userWishlist.includes(hotel.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Info Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                          {hotel.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          {hotel.address}, {hotel.city}, {hotel.state}
                        </p>
                      </div>

                      {hotel.reviews_count > 0 && hotel.guest_rating ? (
                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-2xl shrink-0 shadow-2xs">
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block leading-tight">
                              {getRatingLabel(hotel.guest_rating)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              {hotel.reviews_count} {hotel.reviews_count === 1 ? 'review' : 'reviews'}
                            </span>
                          </div>
                          <div className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                            <span>{Number(hotel.guest_rating).toFixed(1)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-2xl shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-900 block leading-tight">Newly Listed</span>
                            <span className="text-[10px] text-amber-700 font-semibold block">0 reviews</span>
                          </div>
                          <div className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>New</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {hotel.description || 'Experience world-class hospitality, fine dining, and prime city locations.'}
                    </p>
                  </div>

                  {/* Amenities Pills */}
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities && hotel.amenities.slice(0, 4).map((a) => (
                      <span key={a.id || a.name} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-100 text-[11px] font-bold">
                        {a.name}
                      </span>
                    ))}
                  </div>

                  {/* Pricing & View Rooms CTA */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Starts From</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-600">₹{(hotel.starting_price || 2500).toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-bold">/ night</span>
                      </div>
                    </div>

                    <Link
                      to={`/hotels/${hotel.id}?check_in=${checkIn}&check_out=${checkOut}&rooms=${rooms}&guests=${guests}`}
                      className="btn-rose w-full sm:w-auto py-2.5 sm:py-3 px-5 sm:px-6 text-xs uppercase tracking-wider font-extrabold shadow-md shadow-rose-600/25 justify-center text-center"
                    >
                      View Rooms & Book
                    </Link>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Floating Bottom Pill: Airbnb-style 1-click View Switcher */}
      {!loading && sortedHotels.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-700/80"
          >
            {viewMode === 'list' ? (
              <>
                <Map className="w-4 h-4 text-rose-400" />
                <span>Show Map ({sortedHotels.length})</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4 text-rose-400" />
                <span>Show List ({sortedHotels.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* FILTER SLIDE-OVER MODAL DRAWER */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slide-left">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">Filter Stays & Hotels</h3>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              
              {/* 1. Destination Search Box */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" /> Destination City
                </label>
                <form onSubmit={(e) => { handleCitySearchSubmit(e); }} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchCityInput}
                      onChange={(e) => setSearchCityInput(e.target.value)}
                      placeholder="Search city (e.g. Goa, Ahmedabad)..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white pr-9"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceSearchButton
                        onTranscript={(spoken) => setSearchCityInput(spoken)}
                        onSearch={(spoken) => {
                          setSearchCityInput(spoken);
                          const newParams = new URLSearchParams(searchParams);
                          if (spoken.trim()) newParams.set('city', spoken.trim());
                          else newParams.delete('city');
                          setSearchParams(newParams);
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-rose px-4 py-2.5 text-xs font-bold rounded-xl shrink-0"
                  >
                    <Search className="w-4 h-4 stroke-[3]" />
                  </button>
                </form>
              </div>

              {/* Quick Destination Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Popular Destinations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickCities.map((cityObj) => {
                    const isSelected = (searchParams.get('city') || '') === cityObj.value;
                    return (
                      <button
                        key={cityObj.name}
                        type="button"
                        onClick={() => handleQuickCitySelect(cityObj.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm font-black'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cityObj.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Price Range Filter */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-800 uppercase tracking-wider text-xs">Max Price / Night</span>
                  <span className="text-rose-600 font-extrabold text-sm">₹{priceMax.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={priceMax}
                  onChange={(e) => setPriceMax(parseInt(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>₹1,000</span>
                  <span>₹15,000+</span>
                </div>
              </div>

              {/* 3. Star Rating Filter */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                  Star Rating
                </label>
                <div className="space-y-2.5">
                  {[5, 4, 3].map((star) => (
                    <label key={star} className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer hover:text-slate-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedStars.includes(star)}
                          onChange={() => handleStarToggle(star)}
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <span>{star} Star Luxury</span>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: star }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Booking Perks & Options */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                  Booking Perks
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={freeCancellation}
                      onChange={(e) => setFreeCancellation(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free Cancellation
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={breakfastIncluded}
                      onChange={(e) => setBreakfastIncluded(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <Utensils className="w-4 h-4 text-amber-600" /> Breakfast Included
                    </span>
                  </label>
                </div>
              </div>

              {/* 5. Amenities Filter */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                  Amenities
                </label>
                <div className="space-y-2.5">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                      />
                      <span className="truncate">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-black text-rose-600 hover:underline px-3 py-2 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="btn-rose py-3 px-6 text-xs uppercase font-black rounded-xl shadow-md flex-grow text-center cursor-pointer"
              >
                Show {sortedHotels.length} Stays
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HotelSearch;
