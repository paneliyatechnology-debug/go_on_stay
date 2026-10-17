import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, Calendar, MapPin, Building2, User, Phone, Mail, ShieldCheck, Clock, FileText, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const autoPrint = searchParams.get('autoPrint') === 'true';

  useEffect(() => {
    fetchBookingReceipt();
  }, [id]);

  useEffect(() => {
    if (booking && autoPrint) {
      // Trigger print prompt automatically after page render
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [booking, autoPrint]);

  const fetchBookingReceipt = async () => {
    try {
      const res = await api.get(`/bookings/${id}/`);
      setBooking(res.data);
    } catch (err) {
      console.error('Failed to load booking receipt:', err);
      showToast('Failed to load booking confirmation details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Generating Official Tax Invoice & Receipt...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="card-white p-8 max-w-md text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Receipt Not Found</h2>
          <p className="text-xs text-slate-500">Could not find booking records for ID: {id}</p>
          <button onClick={() => navigate('/')} className="btn-teal text-xs py-2.5 px-6 w-full font-bold">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto space-y-8 print:max-w-none">
        
        {/* Navigation & Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate('/my-bookings')}
            className="text-xs font-extrabold text-slate-600 hover:text-teal-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Back to My Bookings
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn-dark py-2.5 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" /> Print / Download Receipt
            </button>
          </div>
        </div>

        {/* Success Banner (Hidden when printing) */}
        <div className="card-white p-8 border-2 border-teal-500/30 text-center space-y-3 bg-gradient-to-b from-teal-50/60 via-white to-white shadow-lg print:hidden">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-600/30">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Payment Verified & Booking Confirmed! ✓</h1>
          <p className="text-xs text-slate-600 font-bold max-w-md mx-auto">
            Your stay reservation has been locked and confirmed with the hotel owner. A printable receipt has been generated below.
          </p>
          
          <div className="pt-2">
            <span className="inline-block px-5 py-2 rounded-full bg-slate-900 text-white font-mono text-sm font-black tracking-widest shadow-md">
              BOOKING ID: {booking.booking_id}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 📜 OFFICIAL PRINTABLE TAX INVOICE & RECEIPT VOUCHER       */}
        {/* ======================================================== */}
        <div className="card-white p-8 sm:p-10 border border-slate-200 shadow-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
          
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md">
                B
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Book<span className="text-teal-600">My</span>Room</h2>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-extrabold">Official Stay Reservation & Tax Invoice</p>
              </div>
            </div>

            <div className="text-left sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-slate-200">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider mb-1">
                STATUS: {booking.booking_status}
              </div>
              <p className="text-xs text-slate-600 font-bold">
                Date & Time: <span className="text-slate-900">{formatDateTime(booking.confirmed_at || booking.created_at)}</span>
              </p>
            </div>
          </div>

          {/* Core Reference Identifiers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Booking Code</span>
              <span className="text-slate-900 font-black font-mono text-sm">{booking.booking_id}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Payment Status</span>
              <span className="text-emerald-700 font-black text-sm uppercase">{booking.payment_status} (PAID)</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Razorpay Order ID</span>
              <span className="text-slate-700 font-bold font-mono text-xs truncate block">{booking.razorpay_order_id || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Payment Txn ID</span>
              <span className="text-teal-700 font-bold font-mono text-xs truncate block">
                {booking.payment_details?.razorpay_payment_id || 'Captured via Gateway'}
              </span>
            </div>
          </div>

          {/* Hotel & Guest Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs border-b border-slate-200 pb-6">
            
            {/* Property Details */}
            <div className="space-y-2">
              <span className="text-teal-700 uppercase tracking-wider font-black text-[10px] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Property & Location
              </span>
              <h3 className="text-base font-black text-slate-900">{booking.hotel_details?.name}</h3>
              <p className="font-bold text-slate-600 flex items-start gap-1.5 leading-snug">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                {booking.hotel_details?.address}, {booking.hotel_details?.city}
              </p>
              <p className="text-slate-500 font-semibold text-[11px] pt-1">
                Contact Phone: {booking.hotel_details?.phone || 'Front Desk Assistance'}
              </p>
            </div>

            {/* Primary Guest Details */}
            <div className="space-y-2">
              <span className="text-teal-700 uppercase tracking-wider font-black text-[10px] flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Primary Guest Information
              </span>
              <h3 className="text-base font-black text-slate-900">{booking.guest_name}</h3>
              <div className="space-y-1 font-bold text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {booking.guest_email}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {booking.guest_phone}
                </p>
              </div>
              {booking.special_requests && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  Note: "{booking.special_requests}"
                </p>
              )}
            </div>

          </div>

          {/* Stay Timeline & Room Capacity */}
          <div className="space-y-3">
            <span className="text-slate-400 uppercase tracking-wider font-black text-[10px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Reservation Timeline & Room Details
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900 text-white text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-In Date</span>
                <span className="font-black text-sm text-teal-400">{formatDate(booking.check_in)}</span>
                <span className="text-slate-400 text-[10px] block font-medium">Standard: 12:00 PM</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-Out Date</span>
                <span className="font-black text-sm text-teal-400">{formatDate(booking.check_out)}</span>
                <span className="text-slate-400 text-[10px] block font-medium">Standard: 11:00 AM</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reserved Room / Villa</span>
                <span className="font-black text-sm text-white truncate block">{booking.room_details?.title || 'Deluxe Stay'}</span>
                {booking.room_number ? (
                  <span className="text-teal-300 text-[11px] block font-mono font-black">
                    Unit / Room #: {booking.room_number}
                  </span>
                ) : (
                  <span className="text-teal-300 text-[10px] block font-bold">{booking.number_of_rooms} Room(s) • {booking.number_of_nights} Night(s)</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Guests</span>
                <span className="font-black text-sm text-white">{booking.number_of_guests} Guest(s)</span>
                <span className="text-slate-400 text-[10px] block font-medium">Confirmed Capacity</span>
              </div>
            </div>
          </div>

          {/* Itemized Financial Breakdown Table */}
          <div className="space-y-4 pt-2">
            <span className="text-slate-900 uppercase tracking-wider font-black text-xs border-b border-slate-200 pb-2 block">
              Itemized Payment & Tax Breakdown (भुगतान विवरण)
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Rate / Calculation</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-bold">
                      Room Tariff ({booking.room_details?.title || 'Room'})
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {booking.number_of_nights} Night(s) × {booking.number_of_rooms} Room(s) @ ₹{booking.price_per_night}/night
                    </td>
                    <td className="py-3 px-4 text-right font-black">₹{parseFloat(booking.subtotal).toFixed(2)}</td>
                  </tr>

                  {parseFloat(booking.cleaning_fee) > 0 && (
                    <tr>
                      <td className="py-3 px-4">Cleaning & Maintenance Fee</td>
                      <td className="py-3 px-4 text-center text-slate-500">Fixed Property Charge</td>
                      <td className="py-3 px-4 text-right font-bold">₹{parseFloat(booking.cleaning_fee).toFixed(2)}</td>
                    </tr>
                  )}

                  {parseFloat(booking.service_fee) > 0 && (
                    <tr>
                      <td className="py-3 px-4">Platform Service Fee</td>
                      <td className="py-3 px-4 text-center text-slate-500">Service Fee</td>
                      <td className="py-3 px-4 text-right font-bold">₹{parseFloat(booking.service_fee).toFixed(2)}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-3 px-4">Goods & Services Tax (18% GST)</td>
                    <td className="py-3 px-4 text-center text-slate-500">Government Mandatory Tax</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">+₹{parseFloat(booking.taxes).toFixed(2)}</td>
                  </tr>

                  {parseFloat(booking.discount) > 0 && (
                    <tr className="bg-teal-50/50 text-teal-800">
                      <td className="py-3 px-4 font-bold">Applied Coupon Discount</td>
                      <td className="py-3 px-4 text-center text-teal-600 font-extrabold">Promo Savings</td>
                      <td className="py-3 px-4 text-right font-black text-teal-700">-₹{parseFloat(booking.discount).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-sm">
                    <td colSpan="2" className="py-4 px-4 uppercase tracking-wider">Total Amount Paid (Razorpay Gateway)</td>
                    <td className="py-4 px-4 text-right text-teal-400 text-base">₹{parseFloat(booking.total_amount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Footer / Security Certificate */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-semibold gap-3">
            <div className="flex items-center gap-1.5 text-teal-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Verified 256-Bit Encrypted Payment Certificate • BookMyRoom Official Invoice
            </div>
            <div>
              Support Email: <span className="text-slate-900 font-bold">support@bookmyroom.com</span>
            </div>
          </div>

        </div>

        {/* Bottom Actions (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden pb-12">
          <button
            onClick={handlePrint}
            className="btn-dark py-3.5 px-8 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF Receipt
          </button>

          <Link
            to="/my-bookings"
            className="btn-teal py-3.5 px-8 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 text-center w-full sm:w-auto"
          >
            View All My Bookings
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmation;
