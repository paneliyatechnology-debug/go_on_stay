import React, { useState, useEffect } from 'react';
import {
  UserCheck, UserX, Clock, Search, CalendarCheck, Hotel, CheckCircle2, AlertCircle, Building2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StaffDashboard = () => {
  const { user, showToast } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffBookings();
  }, []);

  const fetchStaffBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/');
      setBookings(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load staff bookings:', err);
      showToast('Failed to load booking reservations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/check-in/`);
      showToast(res.data.message || 'Guest checked in successfully!');
      fetchStaffBookings();
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-in failed.';
      showToast(msg, 'error');
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/check-out/`);
      showToast(res.data.message || 'Guest checked out successfully!');
      fetchStaffBookings();
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-out failed.';
      showToast(msg, 'error');
    }
  };

  const handleNoShow = async (bookingId) => {
    if (!window.confirm('Mark this booking reservation as NO-SHOW?')) return;
    try {
      const res = await api.post(`/bookings/${bookingId}/no-show/`);
      showToast(res.data.message || 'Booking marked as NO-SHOW.');
      fetchStaffBookings();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update status.';
      showToast(msg, 'error');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const bId = b.id.toString();
    const guest = (b.guest_name || '').toLowerCase();
    const roomNums = (b.room_number || '').toLowerCase();
    const roomCategory = (b.room_details?.title || '').toLowerCase();
    return bId.includes(q) || guest.includes(q) || roomNums.includes(q) || roomCategory.includes(q);
  });

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Hotel className="w-3.5 h-3.5 text-sky-600" /> Front Desk Staff Console
            </div>
            <h1 className="text-3xl font-black text-slate-900">Hotel Staff Desk</h1>
            <p className="text-xs text-slate-500 font-semibold">Manage real-time guest check-ins, check-outs, room allocation status, and no-shows</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="card-white p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Booking ID, Guest Name, Room Number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:border-sky-600 outline-none"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing {filteredBookings.length} of {bookings.length} reservations
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading hotel desk reservations...</p>
          </div>
        ) : (
          <div className="card-white overflow-hidden border border-slate-200 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Booking Code</th>
                    <th className="p-4">Guest Name</th>
                    <th className="p-4">Hotel Property</th>
                    <th className="p-4">Room Number(s)</th>
                    <th className="p-4">Stay Dates</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">No reservations found matching search query.</td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#{b.id}</td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900">{b.guest_name || `User #${b.user}`}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{b.guest_phone || 'No phone'}</span>
                        </td>
                        <td className="p-4 font-extrabold text-slate-900">{b.hotel_details?.name}</td>
                        <td className="p-4">
                          <div className="font-extrabold text-teal-800">{b.room_details?.title || `Room #${b.room}`}</div>
                          <div className="mt-1 inline-flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                            <span>Units: {b.room_number || 'Room 101'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{b.check_in} → {b.check_out}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            b.booking_status === 'CONFIRMED' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                            b.booking_status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            b.booking_status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            b.booking_status === 'NO_SHOW' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.booking_status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => handleCheckIn(b.id)}
                                  className="py-1 px-3 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] hover:bg-emerald-700 transition-colors flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Check-In
                                </button>

                                <button
                                  onClick={() => handleNoShow(b.id)}
                                  className="py-1 px-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 font-extrabold text-[11px] transition-colors"
                                >
                                  No-Show
                                </button>
                              </>
                            )}

                            {b.booking_status === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleCheckOut(b.id)}
                                className="py-1 px-3 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] hover:bg-slate-800 transition-colors flex items-center gap-1"
                              >
                                <UserX className="w-3.5 h-3.5" /> Check-Out
                              </button>
                            )}

                            {b.booking_status === 'CHECKED_OUT' && (
                              <span className="text-[10px] font-bold text-slate-400 italic">Stay Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffDashboard;
