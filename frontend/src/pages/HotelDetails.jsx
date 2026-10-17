import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Calendar, Users, BedDouble, Utensils, CheckCircle2,
  ShieldCheck, Clock, FileText, ArrowLeft, Building2, Heart, Sparkles,
  Camera, X, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const getRatingLabel = (rating) => {
  const num = parseFloat(rating);
  if (isNaN(num)) return 'Newly Listed';
  if (num >= 4.7) return 'Exceptional';
  if (num >= 4.5) return 'Superb';
  if (num >= 4.0) return 'Very Good';
  if (num >= 3.5) return 'Good';
  return 'Rated';
};

const HotelDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Search parameters
  const checkIn = searchParams.get('check_in') || getTodayStr();
  const checkOut = searchParams.get('check_out') || getTomorrowStr();
  const numRooms = parseInt(searchParams.get('rooms') || '1');
  const numGuests = parseInt(searchParams.get('guests') || '2');

  const [selectedCheckIn, setSelectedCheckIn] = useState(checkIn);
  const [selectedCheckOut, setSelectedCheckOut] = useState(checkOut);
  const [selectedRooms, setSelectedRooms] = useState(numRooms);

  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);

  // Room Lightbox Modal State
  const [activeRoomModal, setActiveRoomModal] = useState(null);
  const [activeRoomImgIdx, setActiveRoomImgIdx] = useState(0);

  // Wishlist State
  const [isSavedWishlist, setIsSavedWishlist] = useState(false);

  useEffect(() => {
    if (user && id) {
      checkWishlistStatus();
    }
  }, [user, id]);

  const checkWishlistStatus = async () => {
    try {
      const res = await api.get('/wishlist/');
      const list = res.data.results || res.data;
      const isSaved = list.some((item) => item.hotel === parseInt(id));
      setIsSavedWishlist(isSaved);
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      showToast('Please sign in as a Customer to save hotels to your wishlist.', 'info');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/wishlist/toggle/${id}/`);
      if (res.data.is_favorited) {
        setIsSavedWishlist(true);
        showToast(`Saved "${hotel?.name}" to your wishlist! ❤️`);
      } else {
        setIsSavedWishlist(false);
        showToast(`Removed "${hotel?.name}" from your wishlist.`);
      }
    } catch (err) {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  useEffect(() => {
    fetchHotelDetails();
    fetchHotelReviews();
  }, [id]);

  useEffect(() => {
    fetchAvailableRooms();
  }, [id, searchParams]);

  const saveRecentlyViewed = (hotelData) => {
    try {
      const existing = JSON.parse(localStorage.getItem('bmr_recently_viewed') || '[]');
      const filtered = existing.filter(item => item.id !== hotelData.id);
      const itemToSave = {
        id: hotelData.id,
        name: hotelData.name,
        city: hotelData.city,
        image: hotelData.primary_image || hotelData.cover_image || (hotelData.images && hotelData.images[0]?.display_url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        starting_price: hotelData.starting_price || 2500,
        guest_rating: hotelData.guest_rating || 4.8,
        viewedAt: new Date().toISOString()
      };
      const updated = [itemToSave, ...filtered].slice(0, 5);
      localStorage.setItem('bmr_recently_viewed', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save recently viewed stay', err);
    }
  };

  const fetchHotelDetails = async () => {
    try {
      const res = await api.get(`/hotels/${id}/`);
      setHotel(res.data);
      saveRecentlyViewed(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setSelectedImage(res.data.images[0].display_url || res.data.images[0].image_url);
      }
    } catch (err) {
      console.error('Failed to load hotel details:', err);
      showToast('Hotel details not found.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelReviews = async () => {
    try {
      const res = await api.get(`/reviews/?hotel_id=${id}`);
      setReviews(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load hotel reviews:', err);
    }
  };

  const fetchAvailableRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get(
        `/rooms/by-hotel/${id}/?check_in=${checkIn}&check_out=${checkOut}&rooms=${numRooms}`
      );
      setRooms(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleDateUpdate = (e) => {
    e.preventDefault();
    setSearchParams({
      check_in: selectedCheckIn,
      check_out: selectedCheckOut,
      rooms: selectedRooms.toString(),
      guests: numGuests.toString(),
    });
  };

  const handleBookRoom = (roomId, roomTitle, price) => {
    if (!user) {
      showToast('Please sign in as a Customer to proceed with room booking.', 'info');
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      showToast('Only Customer accounts can book rooms. Hotel Owners & Admins manage properties.', 'error');
      return;
    }
    const params = new URLSearchParams({
      hotel_id: id,
      room_id: roomId.toString(),
      check_in: checkIn,
      check_out: checkOut,
      rooms: numRooms.toString(),
      guests: numGuests.toString(),
    });
    navigate(`/booking?${params.toString()}`);
  };

  // Next / Previous Hotel Property Image Navigation
  const hotelImages = hotel?.images || [];
  const activeHotelImgIndex = hotelImages.findIndex(
    (img) => (img.display_url || img.image_url) === selectedImage
  );

  const handlePrevHotelImage = () => {
    if (!hotelImages || hotelImages.length <= 1) return;
    const newIndex = activeHotelImgIndex > 0 ? activeHotelImgIndex - 1 : hotelImages.length - 1;
    setSelectedImage(hotelImages[newIndex].display_url || hotelImages[newIndex].image_url);
  };

  const handleNextHotelImage = () => {
    if (!hotelImages || hotelImages.length <= 1) return;
    const newIndex = activeHotelImgIndex < hotelImages.length - 1 ? activeHotelImgIndex + 1 : 0;
    setSelectedImage(hotelImages[newIndex].display_url || hotelImages[newIndex].image_url);
  };

  const openRoomModal = (room) => {
    setActiveRoomModal(room);
    setActiveRoomImgIdx(0);
  };

  const closeRoomModal = () => {
    setActiveRoomModal(null);
    setActiveRoomImgIdx(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="card-white p-8 max-w-md text-center">
          <h2 className="text-xl font-black text-teal-600">Hotel Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">The requested hotel property does not exist or has been unlisted.</p>
          <button onClick={() => navigate('/search')} className="btn-teal text-xs py-2.5 px-6">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-16">
      
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-extrabold text-slate-600 hover:text-teal-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Back to Search Results
          </button>

          <div className="flex items-center gap-2">
            <span className="badge badge-customer">{hotel.star_rating || 5} Star Luxury</span>
            {hotel.reviews_count > 0 && hotel.guest_rating ? (
              <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span className="font-black text-slate-900">{Number(hotel.guest_rating).toFixed(1)} / 5.0</span>
                <span className="text-slate-500 font-semibold">• {getRatingLabel(hotel.guest_rating)} ({hotel.reviews_count} {hotel.reviews_count === 1 ? 'review' : 'reviews'})</span>
              </span>
            ) : (
              <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>New Property (0 guest reviews)</span>
              </span>
            )}

            {/* Save to Wishlist Button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                isSavedWishlist
                  ? 'bg-rose-50 border-rose-200 text-rose-600 font-black'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSavedWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isSavedWishlist ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Hotel Main Header Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{hotel.name}</h1>
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            {hotel.address}, {hotel.city}, {hotel.state} {hotel.zip_code}
          </p>
        </div>

        {/* GALLERY GRID (HOTEL PROPERTY PHOTOS WITH ARROW CONTROLS & COMPACT THUMBNAILS) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" /> Property Overview & Exterior Photos
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              {hotelImages.length} Property Photos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* MAIN SELECTED PHOTO WITH PREV / NEXT ARROWS */}
            <div className="lg:col-span-8 h-96 sm:h-[450px] rounded-3xl overflow-hidden bg-slate-900 shadow-md relative group">
              <img
                src={selectedImage || hotel.primary_image}
                alt={hotel.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Photo Counter Overlay Badge */}
              {hotelImages.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-black border border-white/20 shadow-md flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-400" />
                  <span>Photo {activeHotelImgIndex >= 0 ? activeHotelImgIndex + 1 : 1} of {hotelImages.length}</span>
                </div>
              )}

              {/* LEFT NAVIGATION ARROW BUTTON */}
              {hotelImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevHotelImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-teal-600 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* RIGHT NAVIGATION ARROW BUTTON */}
              {hotelImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextHotelImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-teal-600 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
                  title="Next Photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* THUMBNAILS GRID (COMPACT NO-GAP ALIGNMENT) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 content-start max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
              {hotelImages.map((img, idx) => {
                const imgUrl = img.display_url || img.image_url;
                const isSelected = selectedImage === imgUrl;
                return (
                  <div
                    key={img.id || idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`h-28 sm:h-32 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                      isSelected
                        ? 'border-teal-600 ring-4 ring-teal-500/30 scale-[1.02] shadow-md opacity-100'
                        : 'border-transparent opacity-75 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <img src={imgUrl} alt={img.caption || hotel.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-teal-500 rounded-2xl pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Date & Guest Availability Filter Bar */}
        <div className="card-white p-6 border border-teal-100 shadow-md">
          <form onSubmit={handleDateUpdate} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            <div className="sm:col-span-4">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> Check-in Date
              </label>
              <input
                type="date"
                required
                value={selectedCheckIn}
                onChange={(e) => setSelectedCheckIn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold outline-none focus:border-teal-600"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> Check-out Date
              </label>
              <input
                type="date"
                required
                value={selectedCheckOut}
                onChange={(e) => setSelectedCheckOut(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold outline-none focus:border-teal-600"
              />
            </div>

            <div className="sm:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-teal-600" /> Rooms
                </label>
                <select
                  value={selectedRooms}
                  onChange={(e) => setSelectedRooms(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold outline-none focus:border-teal-600"
                >
                  <option value={1}>1 Room</option>
                  <option value={2}>2 Rooms</option>
                  <option value={3}>3 Rooms</option>
                </select>
              </div>

              <button type="submit" className="btn-teal w-full sm:w-auto py-2.5 px-5 text-xs font-extrabold uppercase justify-center text-center">
                Check Dates
              </button>
            </div>

          </form>
        </div>

        {/* Hotel Details & Available Rooms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column: Available Rooms */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-teal-600" /> Available Rooms for Your Dates
              </h2>
              <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                100% Real-Time Inventory Checked
              </span>
            </div>

            {roomsLoading ? (
              <div className="text-center py-12 card-white">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs font-bold text-slate-500">Checking room date-overlap availability...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="card-white p-8 text-center space-y-3">
                <BedDouble className="w-10 h-10 text-teal-600 mx-auto opacity-50" />
                <h3 className="text-base font-black text-slate-900">No Rooms Available For Selected Dates</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All rooms at this property are fully booked for {checkIn} → {checkOut}. Please try selecting alternative travel dates above.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {rooms.map((room) => {
                  const roomImgList = room.images || [];
                  const roomPrimaryImg = room.primary_image || (roomImgList[0]?.display_url) || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80';

                  return (
                    <div key={room.id} className="card-white p-4 sm:p-5 border border-slate-200 hover:shadow-md transition-shadow">
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* ROOM CATEGORY PHOTO THUMBNAIL (Fixed Compact Height) */}
                        <div className="md:col-span-4 relative group rounded-2xl overflow-hidden bg-slate-100 h-44 sm:h-44 border border-slate-200 shrink-0">
                          <img
                            src={roomPrimaryImg}
                            alt={room.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => openRoomModal(room)}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />

                          {/* Room Photos Counter Badge */}
                          <button
                            type="button"
                            onClick={() => openRoomModal(room)}
                            className="absolute bottom-2.5 right-2.5 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md border border-white/20 transition-transform active:scale-95 cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-teal-400" />
                            <span>{roomImgList.length > 0 ? `${roomImgList.length} Photos` : 'View Photos'}</span>
                          </button>
                        </div>

                        {/* ROOM DETAILS CONTENT */}
                        <div className="md:col-span-8 space-y-2.5 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900">{room.title}</h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                  {room.room_type}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{room.bed_type}</span> • <span>{room.capacity_adults} Adults, {room.capacity_children} Kids</span>
                            </p>
                          </div>

                          {/* Room Badges & Amenities */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {room.breakfast_included && (
                              <span className="inline-flex items-center gap-1 text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[11px]">
                                <Utensils className="w-3 h-3" /> Breakfast Included
                              </span>
                            )}
                            
                            {room.free_cancellation && (
                              <span className="inline-flex items-center gap-1 text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> Free Cancellation
                              </span>
                            )}

                            {room.all_room_numbers && room.all_room_numbers.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-slate-700 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                                Units: {room.all_room_numbers.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {room.description && (
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-1">
                              {room.description}
                            </p>
                          )}

                          {/* Price & Book Button Footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-black text-teal-600">₹{room.price_per_night}</div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Per Night + Taxes</p>
                            </div>

                            {user && user.role !== 'CUSTOMER' ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                Customer Role Needed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleBookRoom(room.id, room.title, room.price_per_night)}
                                className="btn-teal py-2 px-5 text-xs uppercase tracking-wider font-extrabold shadow-md shadow-teal-600/20 cursor-pointer"
                              >
                                Book Room
                              </button>
                            )}
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* CUSTOMER REVIEWS & RATINGS SECTION */}
            <div className="card-white p-6 space-y-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Guest Ratings & Reviews
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time ratings from verified guests</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-2xl font-black text-white leading-none">
                      {hotel.reviews_count > 0 && hotel.guest_rating ? Number(hotel.guest_rating).toFixed(1) : 'New'}
                    </span>
                  </div>
                  <div className="border-l border-slate-700 pl-3 text-left">
                    <span className="text-xs font-extrabold text-amber-300 block leading-tight">
                      {hotel.reviews_count > 0 ? getRatingLabel(hotel.guest_rating) : 'Newly Listed'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {hotel.reviews_count || 0} verified {hotel.reviews_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-semibold">
                  No guest reviews submitted yet for this hotel stay.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {(rev.user_name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{rev.user_name || 'Verified Guest'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span>{rev.rating}.0</span>
                          <span className="text-slate-400 font-semibold text-[10px]">/ 5</span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed font-medium pl-9">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Hotel Amenities & Policies */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Amenities Card */}
            <div className="card-white p-6 space-y-4 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Hotel Amenities
              </h3>
              <div className="space-y-2.5">
                {(hotel.amenities || []).map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Policies Card */}
            <div className="card-white p-6 space-y-4 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Hotel Policies & Timings
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Check-in Time:
                  </span>
                  <span className="font-black text-slate-900">{hotel.check_in_time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Check-out Time:
                  </span>
                  <span className="font-black text-slate-900">{hotel.check_out_time}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-bold block mb-1">House Rules:</span>
                  <p className="text-slate-600 leading-relaxed font-semibold">{hotel.rules}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-bold block mb-1">Cancellation Policy:</span>
                  <p className="text-slate-600 leading-relaxed font-semibold">{hotel.cancellation_policy}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ROOM PHOTOS LIGHTBOX MODAL */}
      {activeRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-4 p-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-teal-400" />
                  {activeRoomModal.title} - Room Photos
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeRoomModal.images && activeRoomModal.images.length > 0
                    ? `Photo ${activeRoomImgIdx + 1} of ${activeRoomModal.images.length}`
                    : 'Default Room Preview Photo'}
                </p>
              </div>

              <button
                onClick={closeRoomModal}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image Display */}
            <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              {activeRoomModal.images && activeRoomModal.images.length > 0 ? (
                <img
                  src={activeRoomModal.images[activeRoomImgIdx]?.display_url || activeRoomModal.images[activeRoomImgIdx]?.image_url}
                  alt={activeRoomModal.title}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={activeRoomModal.primary_image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'}
                  alt={activeRoomModal.title}
                  className="max-h-full max-w-full object-contain"
                />
              )}

              {/* Prev / Next Navigation Arrows */}
              {activeRoomModal.images && activeRoomModal.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveRoomImgIdx((prev) => (prev > 0 ? prev - 1 : activeRoomModal.images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-teal-600 transition-colors shadow-lg cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => setActiveRoomImgIdx((prev) => (prev < activeRoomModal.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-teal-600 transition-colors shadow-lg cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Carousel Footer */}
            {activeRoomModal.images && activeRoomModal.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-2 scrollbar-thin">
                {activeRoomModal.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveRoomImgIdx(idx)}
                    className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeRoomImgIdx === idx
                        ? 'border-teal-400 ring-2 ring-teal-400/40 scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.display_url || img.image_url} alt="Room Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default HotelDetails;
