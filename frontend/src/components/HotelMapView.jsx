import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, MapPin, Heart, X, ArrowRight } from 'lucide-react';

// Known coordinates for common Indian cities to provide realistic map centering & fallback
const CITY_COORDINATES = {
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  goa: [15.2993, 74.1240],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  udaipur: [24.5854, 73.7125],
  surat: [21.1702, 72.8311],
  pune: [18.5204, 73.8567],
  hyderabad: [17.3850, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  manali: [32.2432, 77.1892],
  shimla: [31.1048, 77.1734],
  agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739],
  rishikesh: [30.0869, 78.2676],
  kochi: [9.9312, 76.2673],
  chandigarh: [30.7333, 76.7794],
  amritsar: [31.6340, 74.8723],
};

// Deterministic scatter for multiple hotels in the same city to avoid exact pin overlap
const getHotelCoordinates = (hotel) => {
  let lat = hotel.latitude ? parseFloat(hotel.latitude) : null;
  let lng = hotel.longitude ? parseFloat(hotel.longitude) : null;

  // If coordinates are invalid or default (19.0760, 72.8777) but city is different, resolve city coords
  const cityKey = (hotel.city || '').trim().toLowerCase();
  const knownCity = CITY_COORDINATES[cityKey];

  if ((!lat || !lng || (lat === 19.076 && lng === 72.8777 && cityKey !== 'mumbai')) && knownCity) {
    lat = knownCity[0];
    lng = knownCity[1];
  } else if (!lat || !lng) {
    // Default fallback to Mumbai
    lat = 19.0760;
    lng = 72.8777;
  }

  // Jitter based on hotel id so pins spread naturally around the neighborhood
  const idNum = typeof hotel.id === 'number' ? hotel.id : (hotel.id ? hotel.id.charCodeAt(0) : 1);
  const jitterLat = (Math.sin(idNum * 12.9898) * 0.018);
  const jitterLng = (Math.cos(idNum * 78.233) * 0.018);

  return [lat + jitterLat, lng + jitterLng];
};


const HotelMapView = ({
  hotels = [],
  checkIn,
  checkOut,
  rooms = 1,
  guests = 2,
  userWishlist = [],
  onToggleWishlist,
  activeCity = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const defaultCenter = [20.5937, 78.9629]; // Center of India
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Sleek OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Close popup when clicking on empty map space
      map.on('click', () => {
        setSelectedHotel(null);
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!hotels || hotels.length === 0) {
      // If a specific city is selected with no hotels, center on city if known
      const cityKey = (activeCity || '').trim().toLowerCase();
      if (CITY_COORDINATES[cityKey]) {
        map.setView(CITY_COORDINATES[cityKey], 12);
      }
      return;
    }

    const bounds = L.latLngBounds();

    hotels.forEach((hotel) => {
      const coords = getHotelCoordinates(hotel);
      bounds.extend(coords);

      const price = hotel.starting_price || 2499;
      const formattedPrice = `₹${Number(price).toLocaleString('en-IN')}`;
      const isSelected = false;

      // Airbnb Style Price Badge Icon
      const customIcon = L.divIcon({
        className: 'airbnb-price-marker-wrapper',
        html: `
          <div class="airbnb-price-badge ${isSelected ? 'active' : ''}" id="marker-hotel-${hotel.id}">
            <span class="badge-price">${formattedPrice}</span>
          </div>
        `,
        iconSize: [76, 32],
        iconAnchor: [38, 16],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedHotel(hotel);
        map.panTo(coords, { animate: true, duration: 0.5 });
      });

      markersRef.current.push(marker);
    });

    // Fit map bounds smoothly
    if (markersRef.current.length > 0) {
      if (markersRef.current.length === 1) {
        map.setView(bounds.getCenter(), 13);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }

    // Force map invalidation to prevent grey tile glitches when toggling view
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

  }, [hotels, activeCity]);

  // Update active marker styling when selectedHotel changes
  useEffect(() => {
    hotels.forEach((h) => {
      const el = document.getElementById(`marker-hotel-${h.id}`);
      if (el) {
        if (selectedHotel && selectedHotel.id === h.id) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }, [selectedHotel, hotels]);

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
      
      {/* Interactive Map DOM */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />



      {/* Floating Airbnb Style Hotel Preview Card (Pops up when badge is clicked) */}
      {selectedHotel && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-500 w-[94%] max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
          
          {/* Close Button */}
          <button
            onClick={() => setSelectedHotel(null)}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md cursor-pointer"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row">
            {/* Thumbnail Image */}
            <div className="w-full sm:w-44 h-44 relative bg-slate-200 shrink-0 overflow-hidden">
              <img
                src={selectedHotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                alt={selectedHotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{selectedHotel.star_rating || 4}★ Hotel</span>
              </div>

              {/* Wishlist Button */}
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={(e) => onToggleWishlist(e, selectedHotel)}
                  className={`absolute top-2 left-2 p-2 rounded-full backdrop-blur-md shadow-md transition-all z-10 cursor-pointer ${
                    userWishlist.includes(selectedHotel.id)
                      ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                      : 'bg-slate-900/60 text-white hover:bg-rose-600'
                  }`}
                  title={userWishlist.includes(selectedHotel.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <Heart className={`w-3.5 h-3.5 ${userWishlist.includes(selectedHotel.id) ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-sm font-black text-slate-900 line-clamp-1 hover:text-rose-600 transition-colors">
                    {selectedHotel.name}
                  </h4>
                  {selectedHotel.guest_rating ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0 border border-emerald-200">
                      ★ {Number(selectedHotel.guest_rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                  <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                  {selectedHotel.address || selectedHotel.city}, {selectedHotel.city}
                </p>

                <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-1">
                  {selectedHotel.description || 'Premium comfort and luxury amenities.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Starts From</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-rose-600">
                      ₹{Number(selectedHotel.starting_price || 2499).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">/ night</span>
                  </div>
                </div>

                <Link
                  to={`/hotels/${selectedHotel.id}?check_in=${checkIn}&check_out=${checkOut}&rooms=${rooms}&guests=${guests}`}
                  className="btn-rose py-2 px-3.5 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 group shrink-0"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Airbnb Price Marker & Map Global Styles */}
      <style>{`
        .airbnb-price-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .airbnb-price-badge {
          background-color: #ffffff;
          color: #0f172a;
          font-weight: 800;
          font-size: 12px;
          line-height: 1;
          padding: 6px 10px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(226, 232, 240, 0.9);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center center;
          user-select: none;
        }
        .airbnb-price-badge:hover {
          transform: scale(1.12);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
          background-color: #f8fafc;
          border-color: #cbd5e1;
          z-index: 999 !important;
        }
        .airbnb-price-badge.active {
          background-color: #e11d48 !important; /* Rose-600 */
          color: #ffffff !important;
          transform: scale(1.18);
          box-shadow: 0 8px 24px rgba(225, 29, 72, 0.45);
          border-color: #ffffff !important;
          z-index: 1000 !important;
        }
        .airbnb-price-badge.active .badge-price {
          color: #ffffff !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-control-zoom {
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          border: 1px solid #e2e8f0 !important;
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #0f172a !important;
          font-weight: 900 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #e11d48 !important;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
};

export default HotelMapView;
