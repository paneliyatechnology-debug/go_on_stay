import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Building2, ShieldCheck, Tag,
  ArrowLeft, User, Mail, Phone, KeyRound, CheckCircle2, Lock, Utensils, Clock, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const hotelId = searchParams.get('hotel_id');
  const roomId = searchParams.get('room_id');
  const checkIn = searchParams.get('check_in') || '2026-10-10';
  const checkOut = searchParams.get('check_out') || '2026-10-12';
  const roomsCount = Math.max(1, parseInt(searchParams.get('rooms') || '1'));
  const guestsCount = Math.max(1, parseInt(searchParams.get('guests') || '2'));

  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomNumbersList, setRoomNumbersList] = useState([]);
  const [selectedRoomNumbers, setSelectedRoomNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Meal Plan Upgrade State
  const [selectedMealPlan, setSelectedMealPlan] = useState('ROOM_ONLY');

  // Estimated Arrival Time State
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('12:00 PM - 02:00 PM');

  // Guest Form
  const [guestName, setGuestName] = useState(user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone_number || '9876543210');
  const [specialRequests, setSpecialRequests] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  const fetchAvailableCoupons = async () => {
    try {
      const res = await api.get('/coupons/available/');
      setAvailableCoupons(res.data.results || res.data || []);
    } catch (err) {
      console.warn('Failed to load available coupons:', err);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'CUSTOMER') {
      showToast('Only Customer accounts can book rooms. Hotel Owners & Admins manage properties.', 'error');
      navigate('/');
      return;
    }
    fetchBookingDetails();
  }, [hotelId, roomId, user, checkIn, checkOut, roomsCount]);

  const fetchBookingDetails = async () => {
    try {
      const [hotelRes, roomRes, availabilityRes] = await Promise.all([
        api.get(`/hotels/${hotelId}/`),
        api.get(`/rooms/${roomId}/`),
        api.get('/rooms/check-availability/', {
          params: { room_id: roomId, check_in: checkIn, check_out: checkOut, rooms: roomsCount }
        }).catch(err => {
          console.warn('Check availability failed, fallback to default:', err);
          return { data: null };
        })
      ]);

      setHotel(hotelRes.data);
      setRoom(roomRes.data);

      if (availabilityRes.data && availabilityRes.data.room_numbers) {
        const numbers = availabilityRes.data.room_numbers;
        setRoomNumbersList(numbers);
        
        // Auto-select first `roomsCount` available room numbers
        const availables = numbers.filter(r => r.is_available).map(r => r.number);
        setSelectedRoomNumbers(availables.slice(0, roomsCount));
      } else if (roomRes.data) {
        const defaultNums = roomRes.data.all_room_numbers || ['101', '102', '103', '104'];
        setRoomNumbersList(defaultNums.map(n => ({ number: n, is_available: true })));
        setSelectedRoomNumbers(defaultNums.slice(0, roomsCount));
      }
    } catch (err) {
      console.error('Failed to load booking info:', err);
      showToast('Failed to load booking details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoomNumber = (num) => {
    if (selectedRoomNumbers.includes(num)) {
      setSelectedRoomNumbers(selectedRoomNumbers.filter(n => n !== num));
    } else {
      if (roomsCount === 1) {
        setSelectedRoomNumbers([num]);
      } else {
        if (selectedRoomNumbers.length < roomsCount) {
          setSelectedRoomNumbers([...selectedRoomNumbers, num]);
        } else {
          setSelectedRoomNumbers([...selectedRoomNumbers.slice(1), num]);
          showToast(`Selected room ${num} (Replaced oldest selection).`, 'info');
        }
      }
    }
  };

  // Meal Plan Pricing Dictionary
  const mealPrices = {
    ROOM_ONLY: 0,
    BREAKFAST: 350,
    HALF_BOARD: 850,
    FULL_BOARD: 1400,
  };

  // Price Calculations
  const calculateNights = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const roomPrice = room ? parseFloat(room.price_per_night) : 0;
  const mealPricePerNight = mealPrices[selectedMealPlan] || 0;
  
  const roomSubtotal = roomPrice * nights * roomsCount;
  const mealSubtotal = mealPricePerNight * nights * roomsCount;
  const grossSubtotal = roomSubtotal + mealSubtotal;

  const handleApplyCoupon = async (codeToApply) => {
    const targetCode = (typeof codeToApply === 'string' ? codeToApply : couponCode).trim().toUpperCase();
    if (!targetCode) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/apply/', {
        code: targetCode,
        amount: grossSubtotal
      });
      setAppliedCoupon(res.data);
      setCouponCode(targetCode);
      const savedAmount = res.data.discount_amount || ((grossSubtotal * parseFloat(res.data.discount_percentage)) / 100);
      showToast(`🎉 Coupon '${targetCode}' applied! Saved ₹${Math.round(savedAmount)} (${res.data.discount_percentage}% OFF)`, 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired coupon code.';
      showToast(msg, 'error');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed.', 'info');
  };

  const taxes = grossSubtotal * 0.18; // 18% GST
  const discount = appliedCoupon
    ? (appliedCoupon.discount_amount !== undefined
        ? parseFloat(appliedCoupon.discount_amount)
        : Math.min((grossSubtotal * parseFloat(appliedCoupon.discount_percentage)) / 100, parseFloat(appliedCoupon.max_discount_amount || 999999)))
    : 0;
  const totalAmount = Math.max(0, grossSubtotal + taxes - discount);

  const handleCreatePendingBooking = async (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      showToast('Please fill in all guest contact details.', 'error');
      return;
    }

    if (selectedRoomNumbers.length < roomsCount) {
      showToast(`Please select ${roomsCount} room number(s) to match your requested room count. (${selectedRoomNumbers.length}/${roomsCount} selected)`, 'error');
      return;
    }

    setCreatingBooking(true);
    try {
      const bookingPayload = {
        hotel: parseInt(hotelId),
        room: parseInt(roomId),
        room_number: selectedRoomNumbers.join(', '),
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: guestsCount,
        number_of_rooms: roomsCount,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        meal_plan: selectedMealPlan,
        estimated_arrival_time: estimatedArrivalTime,
        special_requests: specialRequests,
        discount: discount,
      };

      const res = await api.post('/bookings/', bookingPayload);
      const createdBooking = res.data;

      showToast(`Reservation ${createdBooking.booking_id} (${selectedRoomNumbers.join(', ')}) initiated. Proceeding to payment...`);
      navigate(`/payment?booking_id=${createdBooking.booking_id}`);
    } catch (err) {
      console.error('Booking creation error:', err.response?.data || err.message);
      const data = err.response?.data;
      // Extract exact backend validation error message
      let msg = 'Failed to initiate booking reservation.';
      if (data) {
        if (data.error) msg = data.error;
        else if (data.room) msg = Array.isArray(data.room) ? data.room[0] : data.room;
        else if (data.room_number) msg = Array.isArray(data.room_number) ? data.room_number[0] : data.room_number;
        else if (data.check_out) msg = Array.isArray(data.check_out) ? data.check_out[0] : data.check_out;
        else if (data.non_field_errors) msg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        else if (typeof data === 'string') msg = data;
        else msg = JSON.stringify(data);
      }
      showToast(msg, 'error');
    } finally {
      setCreatingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Preparing room checkout & availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-extrabold text-slate-600 hover:text-teal-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Back to Hotel Details
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> 100% Price Lock & Secure Reservation
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900">Complete Your Stay Reservation</h1>
          <p className="text-xs text-slate-500 font-semibold">
            Select {roomsCount} Room/Villa Number{roomsCount > 1 ? 's' : ''}, meal plan upgrade, arrival time, and proceed to Razorpay payment
          </p>
        </div>

        <form onSubmit={handleCreatePendingBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column: Stay Summary, Room Number Picker, Meal Plan, Arrival Time, Guest Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stay Summary Banner */}
            <div className="card-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Stay Summary
              </h2>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{hotel?.name}</h3>
                  <p className="text-xs font-bold text-slate-500">{hotel?.address}, {hotel?.city}</p>
                  <p className="text-xs font-bold text-teal-600 mt-1">{room?.title} ({room?.bed_type})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Check-in</span>
                  <span className="text-slate-900 font-black">{checkIn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Check-out</span>
                  <span className="text-slate-900 font-black">{checkOut}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Duration</span>
                  <span className="text-slate-900 font-black">{nights} Night(s)</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Guests & Rooms</span>
                  <span className="text-slate-900 font-black">{guestsCount} Guests, {roomsCount} Room{roomsCount > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* 🔑 ROOM NUMBER SELECTION CARD */}
            <div className="card-white p-6 border-2 border-teal-500/30 shadow-md space-y-4 bg-gradient-to-b from-teal-50/30 to-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-teal-600" />
                    {roomsCount === 1
                      ? 'Select Room / Villa Number'
                      : `Select ${roomsCount} Room Numbers`}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {roomsCount === 1
                      ? 'Click on any available room unit to select it'
                      : `You requested ${roomsCount} rooms. Select ${roomsCount} room units for your stay.`}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className={`inline-block px-3 py-1.5 rounded-full font-mono text-xs font-black shadow-xs ${selectedRoomNumbers.length === roomsCount
                    ? 'bg-slate-900 text-teal-400'
                    : 'bg-amber-500 text-white'
                    }`}>
                    SELECTED ({selectedRoomNumbers.length}/{roomsCount}): {selectedRoomNumbers.length > 0 ? selectedRoomNumbers.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                {roomNumbersList.map((item) => {
                  const isSelected = selectedRoomNumbers.includes(item.number);
                  const isAvailable = item.is_available;

                  return (
                    <button
                      key={item.number}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleToggleRoomNumber(item.number)}
                      className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between relative overflow-hidden ${!isAvailable
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                        : isSelected
                          ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/30 scale-[1.02]'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-teal-500 hover:bg-teal-50/50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-teal-100' : isAvailable ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                          {item.number.includes('Villa') ? 'Villa Unit' : 'Room Unit'}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        ) : !isAvailable ? (
                          <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <span className={`text-base font-black font-mono block ${isSelected ? 'text-white' : 'text-slate-900'
                          }`}>
                          {item.number}
                        </span>

                        <span className={`text-[10px] font-bold block mt-0.5 ${isSelected
                          ? 'text-teal-100 font-extrabold'
                          : isAvailable
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                          }`}>
                          {isSelected
                            ? '✓ Selected'
                            : isAvailable
                              ? '🟢 Available'
                              : '🔴 Reserved'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRoomNumbers.length < roomsCount && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold text-center">
                  ⚠️ Please select {roomsCount - selectedRoomNumbers.length} more room number(s) to complete your selection of {roomsCount} rooms.
                </div>
              )}
            </div>

            {/* 🍽️ MEAL PLAN SELECTION CARD */}
            <div className="card-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-teal-600" /> Select Meal Plan Upgrade
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Room Only */}
                <div
                  onClick={() => setSelectedMealPlan('ROOM_ONLY')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMealPlan === 'ROOM_ONLY'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">Room Only</span>
                    <span className="text-xs font-bold text-slate-500">Standard Tariff</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">No meals included in tariff</p>
                  <div className="mt-2 text-xs font-black text-teal-600">₹0 / night</div>
                </div>

                {/* Breakfast Included */}
                <div
                  onClick={() => setSelectedMealPlan('BREAKFAST')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMealPlan === 'BREAKFAST'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">Daily Breakfast</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Popular
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Buffet spread at hotel restaurant</p>
                  <div className="mt-2 text-xs font-black text-teal-600">+₹350 / night / room</div>
                </div>

                {/* Half Board */}
                <div
                  onClick={() => setSelectedMealPlan('HALF_BOARD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMealPlan === 'HALF_BOARD'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">Half Board</span>
                    <span className="text-xs font-bold text-slate-500">Breakfast + Dinner</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Includes daily breakfast & buffet dinner</p>
                  <div className="mt-2 text-xs font-black text-teal-600">+₹850 / night / room</div>
                </div>

                {/* Full Board */}
                <div
                  onClick={() => setSelectedMealPlan('FULL_BOARD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMealPlan === 'FULL_BOARD'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">Full Board</span>
                    <span className="text-xs font-bold text-slate-500">All Meals Included</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Includes breakfast, lunch & dinner</p>
                  <div className="mt-2 text-xs font-black text-teal-600">+₹1,400 / night / room</div>
                </div>

              </div>
            </div>



            {/* Guest Details Form */}
            <div className="card-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" /> Guest Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Guest Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Priya Patel"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address (For Voucher & Receipt)
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Late check-in required, quiet rooms, extra pillows"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Pricing Breakdown & Payment Trigger */}
          <div className="lg:col-span-4 space-y-6">

            {/* Promo Code Card */}
            <div className="card-white p-5 border border-slate-200/90 shadow-xs space-y-3.5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-rose-600" /> Apply Promotional Coupon
                </h3>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BMR20"
                  disabled={!!appliedCoupon}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider focus:border-rose-600 focus:bg-white outline-none disabled:bg-slate-100/80"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(couponCode)}
                  disabled={couponLoading || !couponCode.trim() || !!appliedCoupon}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                >
                  {couponLoading ? '...' : appliedCoupon ? 'Applied ✓' : 'Apply'}
                </button>
              </div>

              {/* Applied feedback */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Code <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discount_percentage}% OFF)</span>
                  </div>
                  <span className="text-emerald-700 font-black">-₹{discount.toFixed(2)}</span>
                </div>
              )}

              {/* Available Coupons list */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Available Offers & Deals</span>
                    <span className="text-[10px] font-bold text-rose-600">{availableCoupons.length} coupons</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableCoupons.map((c) => (
                      <div
                        key={c.id || c.code}
                        onClick={() => handleApplyCoupon(c.code)}
                        className="group p-2 rounded-xl border border-dashed border-rose-200 bg-rose-50/40 hover:bg-rose-100/70 hover:border-rose-400 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[11px] font-black text-slate-900 flex items-center gap-1.5">
                            <span className="bg-rose-600 text-white font-mono font-black px-1.5 py-0.5 rounded text-[10px] tracking-wider">{c.code}</span>
                            <span className="text-slate-700 font-extrabold">{c.discount_percentage}% OFF</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                            Min spend ₹{parseFloat(c.min_booking_amount).toLocaleString()} • Max ₹{parseFloat(c.max_discount_amount).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-rose-600 shrink-0 group-hover:underline">Apply →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary Card */}
            <div className="card-white p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Price Breakdown
              </h3>

              <div className="space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Assigned Rooms ({selectedRoomNumbers.length}/{roomsCount})</span>
                  <span className="font-mono font-black text-slate-900 text-right max-w-[150px] truncate">
                    {selectedRoomNumbers.length > 0 ? selectedRoomNumbers.join(', ') : 'None'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Room Charge (₹{roomPrice} × {nights}n × {roomsCount}r)</span>
                  <span>₹{roomSubtotal.toFixed(2)}</span>
                </div>

                {mealPricePerNight > 0 && (
                  <div className="flex justify-between text-teal-700 font-bold">
                    <span>Meal Plan ({selectedMealPlan})</span>
                    <span>+₹{mealSubtotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Taxes (18% GST)</span>
                  <span>+₹{taxes.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-teal-600 font-extrabold">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between text-slate-900 font-black text-base">
                  <span>Total Amount</span>
                  <span className="text-teal-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingBooking || selectedRoomNumbers.length < roomsCount}
                className="btn-teal w-full py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 disabled:opacity-50"
              >
                {creatingBooking ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Reserving {selectedRoomNumbers.join(', ')}...</span>
                  </div>
                ) : (
                  `Reserve ${roomsCount} Room${roomsCount > 1 ? 's' : ''} & Pay ₹${totalAmount.toFixed(2)}`
                )}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};

export default BookingPage;
