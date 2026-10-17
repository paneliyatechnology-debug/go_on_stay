import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BedDouble, Plus, ArrowLeft, Trash2, Edit, Users, Utensils, CheckCircle, IndianRupee, DoorClosed, CalendarCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ManageRooms = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotelAndRooms();
  }, [hotelId]);

  const fetchHotelAndRooms = async () => {
    try {
      const [hotelRes, roomsRes, bookingsRes] = await Promise.all([
        api.get(`/hotels/${hotelId}/`),
        api.get(`/rooms/by-hotel/${hotelId}/`),
        api.get('/bookings/')
      ]);
      setHotel(hotelRes.data);
      setRooms(roomsRes.data.results || roomsRes.data);
      
      const allBookings = bookingsRes.data.results || bookingsRes.data;
      const hotelBookings = allBookings.filter(
        (b) => b.hotel.toString() === hotelId.toString() || b.hotel_details?.id?.toString() === hotelId.toString()
      );
      setBookings(hotelBookings);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      showToast('Failed to load hotel rooms.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId, title) => {
    if (!window.confirm(`Are you sure you want to delete room category "${title}"?`)) return;
    try {
      await api.delete(`/rooms/${roomId}/`);
      showToast(`Room category "${title}" deleted.`);
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) {
      showToast('Failed to delete room.', 'error');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/owner/dashboard')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-teal-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Manage Rooms: {hotel?.name || 'Hotel Property'}
              </h1>
              <p className="text-xs text-slate-500 font-semibold">{hotel?.city}, {hotel?.state} • Set pricing, room units & view reserved bookings</p>
            </div>
          </div>

          <Link
            to={`/owner/hotels/${hotelId}/rooms/new`}
            className="btn-teal text-sm py-3 px-5 shadow-lg shadow-teal-600/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Room Category
          </Link>
        </div>

        {/* Room Categories Grid */}
        {loading ? (
          <div className="text-center py-16 card-white">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading hotel rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <BedDouble className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Rooms Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your first room category (e.g. Deluxe Room, Executive Suite) with price per night, capacity, and bed options to start receiving bookings.
            </p>
            <Link
              to={`/owner/hotels/${hotelId}/rooms/new`}
              className="btn-teal py-2.5 px-6 text-xs font-bold inline-flex"
            >
              <Plus className="w-4 h-4" /> Add First Room Category
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const activeStatuses = ['CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT'];
                const activeRoomBookings = bookings.filter(
                  (b) => (b.room === room.id || b.room_details?.id === room.id) &&
                  activeStatuses.includes(b.booking_status)
                );

                const roomNums = room.all_room_numbers || Array.from({ length: room.total_rooms }, (_, i) => `Room ${101 + i}`);

                return (
                  <div key={room.id} className="card-white overflow-hidden flex flex-col group hover:shadow-lg transition-all border border-slate-200">
                    
                    {/* Image */}
                    <div className="relative h-44 bg-slate-200">
                      <img
                        src={room.primary_image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'}
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black text-teal-600 shadow-sm">
                        ₹{room.price_per_night}/night
                      </div>
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5">
                        <DoorClosed className="w-3.5 h-3.5 text-teal-400" />
                        {room.total_rooms} Physical Room Units
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-grow space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-slate-900">{room.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {room.room_type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500">{room.bed_type}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          {room.capacity_adults} Adults, {room.capacity_children} Kids
                        </span>
                        
                        {room.breakfast_included && (
                          <span className="flex items-center gap-1 text-teal-700 font-bold">
                            <Utensils className="w-3.5 h-3.5" /> Breakfast Included
                          </span>
                        )}
                      </div>

                      {/* Reserved Unit Status Pills */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Physical Units Status:</span>
                          <span className="text-rose-600 font-black">{activeRoomBookings.length} Booked</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {roomNums.map((numStr) => {
                            const isReserved = activeRoomBookings.some((b) => (b.room_number || '').includes(numStr));
                            return (
                              <span
                                key={numStr}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  isReserved
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {numStr} {isReserved ? '(Booked)' : '(Open)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {room.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/owner/hotels/${hotelId}/rooms/${room.id}/edit`}
                        className="btn-dark py-2 px-4 text-xs font-extrabold flex-1 text-center"
                      >
                        Edit Room Details
                      </Link>

                      <button
                        onClick={() => handleDeleteRoom(room.id, room.title)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Reserved Bookings Table for this Hotel */}
            <div className="card-white p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-teal-600" /> Active Reservations for {hotel?.name}
                </h3>
                <span className="text-xs font-bold text-slate-500">{bookings.length} Total Bookings</span>
              </div>

              {bookings.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold py-4 text-center">No room bookings placed for this hotel yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Booking ID</th>
                        <th className="p-3">Room Category</th>
                        <th className="p-3">Reserved Room Unit(s)</th>
                        <th className="p-3">Guest Name & Phone</th>
                        <th className="p-3">Stay Dates</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">#{b.id}</td>
                          <td className="p-3 font-bold text-slate-900">{b.room_details?.title || `Room #${b.room}`}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 font-mono font-bold text-rose-700">
                              {b.room_number || 'Room 101'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{b.guest_phone || 'No phone'}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            {b.check_in} → {b.check_out} ({b.number_of_nights} nights)
                          </td>
                          <td className="p-3 text-teal-600 font-black">₹{parseFloat(b.total_amount).toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              b.booking_status === 'CONFIRMED' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                              b.booking_status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              b.booking_status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ManageRooms;
