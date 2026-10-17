import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Building2, MapPin, CheckCircle2, XCircle, Clock, Printer, AlertTriangle, Star, X, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RATING_LABELS = {
  1: '1 ★ - Poor / Needs Improvement',
  2: '2 ★ - Fair / Could Be Better',
  3: '3 ★ - Good / Satisfactory',
  4: '4 ★ - Very Good / Pleasant',
  5: '5 ★ - Exceptional / Outstanding'
};

const MyBookings = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/');
      setBookings(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load trips:', err);
      showToast('Failed to load your booking history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id, bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;
    try {
      await api.post(`/bookings/${id}/cancel/`);
      showToast(`Booking ${bookingId} has been cancelled. Refund will be processed.`);
      fetchMyBookings();
    } catch (err) {
      showToast('Failed to cancel booking.', 'error');
    }
  };

  const handleOpenRatingModal = (booking) => {
    setRatingBooking(booking);
    setSelectedRating(booking.user_review ? booking.user_review.rating : 5);
    setRatingComment(booking.user_review ? booking.user_review.comment || '' : '');
    setHoverRating(0);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingBooking) return;
    setSubmittingRating(true);
    try {
      await api.post('/reviews/', {
        booking: ratingBooking.id,
        rating: selectedRating,
        comment: ratingComment
      });
      showToast('Thank you! Your rating has been recorded and hotel average updated.');
      setRatingBooking(null);
      fetchMyBookings();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit rating.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const canCancelBooking = (b) => {
    if (!b) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (['CHECKED_OUT', 'COMPLETED', 'CHECKED_IN', 'CANCELLED', 'REFUNDED'].includes(b.booking_status)) {
      return false;
    }
    if (b.check_out && b.check_out <= todayStr) {
      return false;
    }
    return b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING_PAYMENT';
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'CONFIRMED') return b.booking_status === 'CONFIRMED' || b.booking_status === 'CHECKED_IN';
    if (activeTab === 'CANCELLED') return b.booking_status === 'CANCELLED' || b.booking_status === 'REFUNDED';
    if (activeTab === 'COMPLETED') return b.booking_status === 'COMPLETED' || b.booking_status === 'CHECKED_OUT';
    return true;
  });

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-black text-slate-900">My Trips & Reservations</h1>
          <p className="text-xs text-slate-500 font-semibold">View upcoming stays, rate completed trips, download receipts, or manage active bookings</p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Reservations' : tab}
            </button>
          ))}
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading your reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <Calendar className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Reservations Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} room reservations yet.
            </p>
            <Link to="/search" className="btn-teal py-2.5 px-6 text-xs font-extrabold inline-flex">
              Explore Hotels & Book
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((b) => (
              <div key={b.id} className="card-white overflow-hidden flex flex-col md:flex-row border border-slate-200 hover:shadow-md transition-all">
                
                {/* Image */}
                <div className="w-full md:w-64 h-48 md:h-[220px] bg-slate-200 relative shrink-0 overflow-hidden">
                  <img
                    src={b.hotel_details?.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                    alt={b.hotel_details?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 glass-pill text-white font-mono text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-white/30">
                    {b.booking_id}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{b.hotel_details?.name}</h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          {b.hotel_details?.address}, {b.hotel_details?.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.user_review && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span>You Rated {b.user_review.rating}/5</span>
                          </div>
                        )}
                        <span className={`badge ${
                          b.booking_status === 'CONFIRMED' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          b.booking_status === 'CANCELLED' || b.booking_status === 'REFUNDED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          b.booking_status === 'COMPLETED' || b.booking_status === 'CHECKED_OUT' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          b.booking_status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {b.booking_status === 'CHECKED_OUT' ? 'CHECKED OUT' : b.booking_status === 'CHECKED_IN' ? 'CHECKED IN' : b.booking_status}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex flex-wrap gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Reserved Unit / Room</span>
                        <span className="font-extrabold text-slate-900">
                          {b.room_details?.title} {b.room_number ? `(${b.room_number})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Dates</span>
                        <span className="text-teal-600">{b.check_in} → {b.check_out} ({b.number_of_nights} Nights)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Guest</span>
                        <span>{b.guest_name}</span>
                      </div>
                    </div>

                    {b.user_review?.comment && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] text-amber-700 uppercase block">Your Feedback</span>
                          <p className="italic font-medium">{b.user_review.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Amount Paid</span>
                      <span className="text-lg font-black text-teal-600">₹{b.total_amount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Rate Stay Button */}
                      {(b.booking_status === 'CONFIRMED' || b.booking_status === 'COMPLETED' || b.booking_status === 'CHECKED_OUT') && !b.user_review && (
                        <button
                          onClick={() => handleOpenRatingModal(b)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" /> Rate Your Stay
                        </button>
                      )}

                      <Link
                        to={`/booking-confirmation/${b.id}`}
                        className="btn-dark py-2 px-4 text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </Link>

                      {canCancelBooking(b) && (
                        <button
                          onClick={() => handleCancelBooking(b.id, b.booking_id)}
                          className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-extrabold hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Cancel Stay
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* RATING & REVIEW MODAL */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Rate Your Stay</h3>
                <p className="text-xs font-bold text-slate-500 truncate max-w-[280px]">
                  {ratingBooking.hotel_details?.name}
                </p>
              </div>
              <button
                onClick={() => setRatingBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-5">
              {/* Star Rating Input */}
              <div className="text-center space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                  Select Rating Stars
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= (hoverRating || selectedRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-extrabold text-amber-600 min-h-[20px]">
                  {RATING_LABELS[hoverRating || selectedRating]}
                </p>
              </div>

              {/* Review Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Write Review / Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Tell us about your room cleanliness, staff behavior, facilities..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;

