import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, Building2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Wishlist = () => {
  const { showToast } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist/');
      setItems(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      showToast('Failed to load wishlist.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (hotelId, name) => {
    try {
      await api.post(`/wishlist/toggle/${hotelId}/`);
      showToast(`Removed "${name}" from wishlist.`);
      setItems(items.filter((item) => item.hotel !== hotelId));
    } catch (err) {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-teal-600 text-teal-600" /> Saved Stays
          </div>
          <h1 className="text-3xl font-black text-slate-900">My Wishlist</h1>
          <p className="text-xs text-slate-500 font-semibold">Your favorite hotels and luxury property collections</p>
        </div>

        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading saved wishlist properties...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <Heart className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Save your favorite luxury hotels and boutique suites to quickly compare room tariffs and plan upcoming trips.
            </p>
            <Link to="/search" className="btn-teal py-2.5 px-6 text-xs font-extrabold inline-flex">
              Explore Hotels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const h = item.hotel_details;
              if (!h) return null;
              return (
                <div key={item.id} className="card-white overflow-hidden flex flex-col group border border-slate-200 hover:shadow-lg transition-all">
                  <div className="relative h-48 bg-slate-200">
                    <img
                      src={h.primary_image}
                      alt={h.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 glass-pill px-3 py-1 rounded-full text-[11px] font-black text-white flex items-center gap-1.5 border border-white/30 shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      {h.reviews_count > 0 && h.guest_rating ? (
                        <>
                          <span className="font-black text-amber-300">{Number(h.guest_rating).toFixed(1)}</span>
                          <span className="text-[10px] text-white/80 font-semibold">({h.reviews_count})</span>
                        </>
                      ) : (
                        <span className="text-amber-300 font-black text-[10.5px]">New</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(h.id, h.name)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-rose-600 shadow-md hover:bg-rose-600 hover:text-white transition-colors"
                      title="Remove from Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="p-5 flex-grow space-y-3">
                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{h.name}</h3>
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {h.address}, {h.city}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 font-bold">
                      <span className="text-slate-500">Starting Tariff:</span>
                      <span className="text-teal-600 font-black text-sm">₹{h.starting_price}/night</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Link
                      to={`/hotels/${h.id}`}
                      className="btn-teal w-full py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
                    >
                      View Available Rooms
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Wishlist;
