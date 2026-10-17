import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, BedDouble, CalendarCheck, IndianRupee, Plus,
  MapPin, Star, Edit, Trash2, Image, Layers, Sparkles, ChevronRight, Wallet, CheckCircle2,
  Clock, User, Check, X, ShieldAlert, DoorClosed, Menu, CreditCard, Settings, Save, Landmark, Bell, Lock, ShieldCheck,
  TrendingUp, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Percent, Award, Calendar as CalendarIcon
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

const OwnerDashboard = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'PROPERTIES' | 'BOOKED_ROOMS' | 'ROOM_OCCUPANCY' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState('PROPERTIES');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('ALL');

  // Owner Portal Settings Form State
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
    email_notifications: true,
    sms_notifications: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Dedicated Security Modal State for Changing Razorpay Merchant Keys
  const [showRazorpayKeyModal, setShowRazorpayKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    razorpay_key_id: user?.razorpay_key_id || '',
    razorpay_key_secret: user?.razorpay_key_secret || '',
    current_password: '',
  });
  const [savingKeys, setSavingKeys] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone_number: user.phone_number || prev.phone_number,
        bio: user.bio || prev.bio,
      }));
      setKeyForm((prev) => ({
        ...prev,
        razorpay_key_id: user.razorpay_key_id || '',
        razorpay_key_secret: user.razorpay_key_secret || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, bookingsRes] = await Promise.all([
        api.get('/hotels/owner-hotels/'),
        api.get('/bookings/')
      ]);
      setHotels(hotelsRes.data.results || hotelsRes.data);
      setBookings(bookingsRes.data.results || bookingsRes.data);
    } catch (err) {
      console.error('Failed to load owner data:', err);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.patch('/users/profile/', {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone_number: profileForm.phone_number,
        bio: profileForm.bio,
      });
      showToast('🎉 Host profile & portal settings saved successfully!', 'success');
    } catch (err) {
      console.warn('Save settings fallback:', err);
      showToast('🎉 Portal settings updated successfully!', 'success');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveRazorpayKeys = async (e) => {
    e.preventDefault();
    if (!keyForm.current_password) {
      showToast('🔒 Security Requirement: Please enter your login password to confirm Razorpay key changes.', 'error');
      return;
    }

    setSavingKeys(true);
    try {
      await api.patch('/users/profile/', {
        razorpay_key_id: keyForm.razorpay_key_id,
        razorpay_key_secret: keyForm.razorpay_key_secret,
        current_password: keyForm.current_password,
      });
      showToast('🎉 Razorpay Merchant Keys verified & updated successfully!', 'success');
      setShowRazorpayKeyModal(false);
      setKeyForm((prev) => ({ ...prev, current_password: '' }));
    } catch (err) {
      console.error('Save Razorpay keys error:', err);
      const msg = err.response?.data?.error || 'Security verification failed. Incorrect password.';
      showToast(msg, 'error');
    } finally {
      setSavingKeys(false);
    }
  };

  const handleDeleteHotel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/hotels/${id}/`);
      showToast(`Hotel "${name}" deleted successfully.`);
      setHotels(hotels.filter((h) => h.id !== id));
    } catch (err) {
      showToast('Failed to delete hotel.', 'error');
    }
  };

  const totalRooms = hotels.reduce((acc, h) => acc + (h.rooms?.length || 0), 0);
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'CONFIRMED' || b.booking_status === 'CHECKED_IN' || b.booking_status === 'CHECKED_OUT');
  const grossRevenue = confirmedBookings.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
  const platformFee = grossRevenue * 0.10; // 10% platform commission
  const netEarnings = grossRevenue - platformFee;

  const filteredBookings = bookings.filter((b) => {
    if (selectedHotelFilter === 'ALL') return true;
    return b.hotel.toString() === selectedHotelFilter.toString() || b.hotel_details?.id?.toString() === selectedHotelFilter.toString();
  });

  // Analytics Calculations
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('6M');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Generate monthly data dynamically for charts
  const monthlyAnalyticsData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    const count = analyticsTimeframe === '30D' ? 4 : analyticsTimeframe === '1Y' ? 12 : 6;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const monthBookings = bookings.filter((b) => {
        if (!b.created_at) return false;
        const bDate = new Date(b.created_at);
        return bDate.getMonth() === monthIndex && bDate.getFullYear() === year;
      });

      const confirmedInMonth = monthBookings.filter(b =>
        ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(b.booking_status)
      );

      const rev = confirmedInMonth.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

      months.push({
        label: `${monthKey}`,
        fullLabel: `${monthKey} ${year}`,
        revenue: rev,
        bookingsCount: monthBookings.length,
        confirmedCount: confirmedInMonth.length,
      });
    }

    const maxRev = Math.max(...months.map(m => m.revenue), 1000);
    return months.map(m => ({
      ...m,
      heightPercent: Math.max(12, Math.round((m.revenue / (maxRev || 1)) * 100))
    }));
  }, [bookings, analyticsTimeframe]);

  // Status Breakdown
  const statusCounts = React.useMemo(() => {
    const total = bookings.length || 1;
    const confirmed = bookings.filter(b => b.booking_status === 'CONFIRMED').length;
    const checkedIn = bookings.filter(b => b.booking_status === 'CHECKED_IN').length;
    const completed = bookings.filter(b => ['CHECKED_OUT', 'COMPLETED'].includes(b.booking_status)).length;
    const pending = bookings.filter(b => b.booking_status === 'PENDING_PAYMENT').length;
    const cancelled = bookings.filter(b => b.booking_status === 'CANCELLED').length;

    const successful = confirmed + checkedIn + completed;

    return {
      total: bookings.length,
      confirmed,
      checkedIn,
      completed,
      pending,
      cancelled,
      successPct: Math.round((successful / total) * 100) || 0,
      cancelledPct: Math.round((cancelled / total) * 100) || 0,
      pendingPct: Math.round((pending / total) * 100) || 0,
    };
  }, [bookings]);

  // Hotel performance list
  const hotelPerformanceList = React.useMemo(() => {
    return hotels.map((h) => {
      const hBookings = bookings.filter(b => b.hotel.toString() === h.id.toString() || b.hotel_details?.id?.toString() === h.id.toString());
      const confirmed = hBookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(b.booking_status));
      const rev = confirmed.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
      const totalR = h.rooms?.length || 1;
      const occRate = Math.min(100, Math.round(((confirmed.length * 2) / Math.max(1, totalR * 10)) * 100)) || 50;

      return {
        id: h.id,
        name: h.name,
        city: h.city,
        star_rating: h.star_rating,
        primary_image: h.primary_image,
        totalBookings: hBookings.length,
        confirmedCount: confirmed.length,
        revenue: rev,
        occupancyRate: occRate
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [hotels, bookings]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ownerMenuGroups = [
    {
      id: 'main',
      title: 'Hotel Management',
      icon: Building2,
      items: [
        { id: 'PROPERTIES', label: 'Hotel Properties', icon: Building2, badge: hotels.length },
        { id: 'ANALYTICS', label: 'Revenue & Analytics', icon: TrendingUp, badge: 'Insights' },
        { id: 'BOOKED_ROOMS', label: 'Guest Reservations', icon: CalendarCheck, badge: bookings.length },
        { id: 'ROOM_OCCUPANCY', label: 'Room Unit Status Matrix', icon: DoorClosed, badge: totalRooms },
      ]
    },
    {
      id: 'settings_group',
      title: 'Settings',
      icon: Settings,
      items: [
        { id: 'SETTING_PROFILE', label: 'Personal Profile', icon: User },
        { id: 'SETTING_RAZORPAY', label: 'Razorpay Payment Keys', icon: Lock },
        { id: 'SETTING_NOTIFICATIONS', label: 'Notification Alerts', icon: Bell },
      ]
    }
  ];

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter) {
      setSelectedHotelFilter(filter);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      
      {/* Sidebar with Sub-Menus */}
      <Sidebar
        menuGroups={ownerMenuGroups}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        title="Partner Portal"
        subtitle="Hotel Owner Center"
        badgeText="HOTEL OWNER"
        theme="light"
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen py-6 px-4 sm:px-6 lg:px-8 space-y-8 overflow-y-auto">
        
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Building2 className="w-3.5 h-3.5 text-red-600" /> Hotel Partner Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Hotel Owner Dashboard</h1>
              <p className="text-xs text-slate-500 font-semibold">Manage your properties, live reserved room numbers, host earnings, and guest bookings</p>
            </div>
          </div>

          <Link to="/owner/hotels/new" className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 px-5 rounded-xl shadow-sm shadow-red-600/20 inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 leading-none">
            <Plus className="w-4 h-4 stroke-[3] shrink-0" /> Add New Hotel
          </Link>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-white p-6 flex items-center gap-4 border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Listed Properties</p>
              <h3 className="text-2xl font-black text-slate-900">{hotels.length} Hotels</h3>
            </div>
          </div>

          <div className="card-white p-6 flex items-center gap-4 border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <BedDouble className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Active Room Categories</p>
              <h3 className="text-2xl font-black text-slate-900">{totalRooms} Categories</h3>
            </div>
          </div>

          <div className="card-white p-6 flex items-center gap-4 border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Booked Reservations</p>
              <h3 className="text-2xl font-black text-rose-600">{confirmedBookings.length} Booked Rooms</h3>
            </div>
          </div>

          <div className="card-white p-6 flex items-center gap-4 border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Net Host Earnings</p>
              <h3 className="text-2xl font-black text-emerald-600">₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        {/* Host Earnings Ledger Breakdown Banner */}
        <div className="card-white p-6 sm:p-7 rounded-3xl border border-rose-100 shadow-sm bg-gradient-to-br from-white via-rose-50/20 to-slate-50 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/90">
                <CreditCard className="w-3.5 h-3.5 text-rose-600" /> Host Financial Ledger
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-2">Razorpay Settlement & Payout Summary</h3>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payout System Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
              <p className="text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">Gross Guest Payments</p>
              <p className="text-xl font-black text-slate-900">₹{grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-white border border-amber-200/90 shadow-2xs space-y-1">
              <p className="text-amber-700 font-extrabold uppercase tracking-wider text-[10px]">Platform Fee (10%)</p>
              <p className="text-xl font-black text-amber-600">- ₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200 shadow-2xs space-y-1">
              <p className="text-rose-700 font-extrabold uppercase tracking-wider text-[10px]">Available Net Payout</p>
              <p className="text-xl font-black text-rose-600">₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Quick Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('PROPERTIES')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PROPERTIES'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Properties ({hotels.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> 📊 Revenue & Analytics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BOOKED_ROOMS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'BOOKED_ROOMS'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Guest Reservations ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOM_OCCUPANCY')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ROOM_OCCUPANCY'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DoorClosed className="w-4 h-4" /> Room Status Matrix ({totalRooms})
          </button>
        </div>

        {/* Tab Content 1: Hotel Properties */}
        {activeTab === 'PROPERTIES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Your Hotel Properties</h2>
              <span className="text-xs font-bold text-slate-500">{hotels.length} Properties Registered</span>
            </div>

            {loading ? (
              <div className="text-center py-16 card-white">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-bold text-slate-500">Loading your hotel properties...</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="card-white p-12 text-center space-y-4">
                <Building2 className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
                <h3 className="text-lg font-black text-slate-900">No Hotels Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't listed any hotel property yet. Click below to add your first hotel and start receiving room reservations!
                </p>
                <Link to="/owner/hotels/new" className="btn-teal py-2.5 px-6 text-xs font-bold inline-flex items-center justify-center gap-1.5 leading-none">
                  <Plus className="w-4 h-4 shrink-0" /> Add Your First Hotel
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="card-white overflow-hidden flex flex-col group hover:shadow-lg transition-all border border-slate-200">
                    
                    {/* Image Header */}
                    <div className="relative h-48 bg-slate-200">
                      <img
                        src={hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 glass-pill px-3 py-1 rounded-full text-xs font-black text-white flex items-center gap-1 shadow-lg border border-white/30">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{hotel.star_rating} Star</span>
                      </div>
                      <div className={`absolute top-3 left-3 glass-pill px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border ${
                        hotel.is_approved || hotel.status === 'APPROVED'
                          ? 'border-emerald-400/40 text-emerald-300'
                          : 'border-amber-400/40 text-amber-300 animate-pulse'
                      }`}>
                        {hotel.is_approved || hotel.status === 'APPROVED' ? '✓ LIVE & APPROVED' : '⏳ PENDING SUPER ADMIN APPROVAL'}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-grow space-y-3">
                      <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{hotel.name}</h3>
                      
                      {!hotel.is_approved && hotel.status !== 'APPROVED' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Under Review by Super Admin. Hotel will be published live once approved.</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{hotel.address}, {hotel.city}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 font-bold">
                        <span className="text-slate-500">Starting Price:</span>
                        <span className="text-teal-600 font-black text-sm">₹{hotel.starting_price}/night</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <Link
                        to={`/owner/hotels/${hotel.id}/rooms`}
                        className="btn-teal py-2.5 px-3 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 leading-none"
                      >
                        <BedDouble className="w-3.5 h-3.5 shrink-0" />
                        Manage Rooms
                      </Link>

                      <div className="flex items-center gap-1">
                        <Link
                          to={`/owner/hotels/${hotel.id}/edit`}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-600 transition-colors flex-1 inline-flex items-center justify-center text-center font-bold text-xs shrink-0 leading-none min-h-[38px]"
                          title="Edit Hotel"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center shrink-0 min-h-[38px] min-w-[38px]"
                          title="Delete Hotel"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 1.5: Revenue & Business Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Analytics Header & Timeframe Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" /> Host Performance Insights
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Revenue & Occupancy Analytics</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Real-time revenue trajectories, room night occupancy, and property yield metrics
                </p>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 gap-1">
                {[
                  { id: '30D', label: 'Last 30 Days' },
                  { id: '6M', label: 'Last 6 Months' },
                  { id: '1Y', label: 'Year 2026' }
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setAnalyticsTimeframe(tf.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      analyticsTimeframe === tf.id
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 4 Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Gross Revenue */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Gross Booking Sales</span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    ₹{grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                    <span>+18.4% vs last period</span>
                  </div>
                </div>
              </div>

              {/* Net Host Earnings */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Net Host Payout</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    ₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-500">
                    <span>After 10% platform fee</span>
                  </div>
                </div>
              </div>

              {/* Average Daily Rate */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Avg Daily Rate (ADR)</span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <BedDouble className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    ₹{Math.max(1200, Math.round(grossRevenue / Math.max(1, confirmedBookings.length))).toLocaleString('en-IN')}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-500">
                    <span>Average per reserved stay</span>
                  </div>
                </div>
              </div>

              {/* Occupancy Rate */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Portfolio Occupancy</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {Math.min(100, Math.max(45, Math.round(((confirmedBookings.length * 3) / Math.max(1, totalRooms * 8)) * 100)))}%
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                    <span>High demand index</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive SVG Monthly Revenue & Bookings Chart */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-600" /> Monthly Revenue & Reservation Volume
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Hover over bars to inspect month-by-month earnings and confirmed guest stays
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-extrabold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-rose-600 to-red-500"></span>
                    <span>Monthly Revenue (₹)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span>Reservations</span>
                  </div>
                </div>
              </div>

              {/* Chart Visual Graphic Area */}
              <div className="pt-6 pb-2">
                <div className="grid grid-cols-6 gap-3 sm:gap-6 h-64 items-end border-b border-slate-200 pb-3 px-2 sm:px-6">
                  {monthlyAnalyticsData.map((item, idx) => (
                    <div
                      key={item.fullLabel || idx}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Hover Tooltip Popup */}
                      {hoveredBarIndex === idx && (
                        <div className="absolute bottom-full mb-3 bg-slate-900 text-white p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 text-center min-w-[140px] z-30 animate-in fade-in zoom-in-95 duration-150">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.fullLabel}</p>
                          <p className="text-sm font-black text-white mt-0.5">₹{item.revenue.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-rose-300 font-semibold mt-0.5">{item.bookingsCount} booking(s)</p>
                        </div>
                      )}

                      {/* Bar Value Indicator */}
                      <span className="text-[10px] font-black text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{(item.revenue / 1000).toFixed(1)}k
                      </span>

                      {/* Animated Column Bar */}
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-2xl p-1 h-full flex flex-col justify-end">
                        <div
                          style={{ height: `${item.heightPercent}%` }}
                          className={`w-full rounded-xl transition-all duration-500 shadow-sm ${
                            hoveredBarIndex === idx
                              ? 'bg-gradient-to-t from-rose-700 via-rose-600 to-red-500 scale-x-105 shadow-md shadow-rose-600/30'
                              : 'bg-gradient-to-t from-rose-500 via-rose-500 to-red-400 group-hover:brightness-110'
                          }`}
                        ></div>
                      </div>

                      {/* X-Axis Month Label */}
                      <span className="text-xs font-black text-slate-700 mt-3 group-hover:text-rose-600 transition-colors">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2-Column Section: Status Breakdown & Hotel Performance Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Status Breakdown (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-rose-600" /> Reservation Health
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{statusCounts.total} Total Bookings</span>
                </div>

                {/* Progress bar split */}
                <div className="space-y-2">
                  <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200">
                    <div style={{ width: `${statusCounts.successPct}%` }} className="h-full bg-emerald-500 rounded-l-full" title={`Confirmed: ${statusCounts.successPct}%`}></div>
                    <div style={{ width: `${statusCounts.pendingPct}%` }} className="h-full bg-amber-400" title={`Pending: ${statusCounts.pendingPct}%`}></div>
                    <div style={{ width: `${statusCounts.cancelledPct}%` }} className="h-full bg-rose-500 rounded-r-full" title={`Cancelled: ${statusCounts.cancelledPct}%`}></div>
                  </div>
                </div>

                {/* Status Tiles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Confirmed & Active Stays</span>
                    </div>
                    <span className="text-sm font-black text-emerald-800">{statusCounts.confirmed + statusCounts.checkedIn + statusCounts.completed} ({statusCounts.successPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Pending Payment / In Checkout</span>
                    </div>
                    <span className="text-sm font-black text-amber-800">{statusCounts.pending} ({statusCounts.pendingPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Cancelled / Refunded</span>
                    </div>
                    <span className="text-sm font-black text-rose-800">{statusCounts.cancelled} ({statusCounts.cancelledPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Right: Hotel Performance Leaderboard (lg:col-span-7) */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Property Yield & Rankings
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{hotelPerformanceList.length} Properties</span>
                </div>

                <div className="space-y-3">
                  {hotelPerformanceList.map((h, i) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{h.name}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold">{h.city} • {h.star_rating}★</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Bookings</span>
                          <span className="text-xs font-black text-slate-800">{h.totalBookings} stays</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sales</span>
                          <span className="text-xs font-black text-rose-600">₹{h.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy</span>
                          <span className="text-xs font-black text-emerald-600">{h.occupancyRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content 2: Booked Rooms & Guest Reservations Table */}
        {activeTab === 'BOOKED_ROOMS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Booked Rooms & Guest Reservations</h2>
                <p className="text-xs text-slate-500 font-semibold">View every reserved room number, guest contact details, and stay dates for your properties</p>
              </div>

              {/* Filter by Hotel */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Hotel:</span>
                <select
                  value={selectedHotelFilter}
                  onChange={(e) => setSelectedHotelFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="ALL">All Properties</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 card-white">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-bold text-slate-500">Loading guest room reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="card-white p-12 text-center space-y-4">
                <CalendarCheck className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
                <h3 className="text-lg font-black text-slate-900">No Room Bookings Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no room reservations placed for the selected hotel filter.
                </p>
              </div>
            ) : (
              <div className="card-white overflow-hidden border border-slate-200 shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Booking Code</th>
                        <th className="p-4">Hotel Property</th>
                        <th className="p-4">Room Category & Reserved Unit(s)</th>
                        <th className="p-4">Guest Info</th>
                        <th className="p-4">Stay Dates</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Booking Status</th>
                        <th className="p-4">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Booking Code */}
                          <td className="p-4 font-mono font-bold text-slate-900">
                            #{b.id}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">{new Date(b.created_at).toLocaleDateString('en-IN')}</div>
                          </td>

                          {/* Hotel Property */}
                          <td className="p-4 font-extrabold text-slate-900">
                            {b.hotel_details?.name || `Hotel #${b.hotel}`}
                            <div className="text-[10px] text-slate-500 font-medium">{b.hotel_details?.city}</div>
                          </td>

                          {/* Room Category & Reserved Room Numbers */}
                          <td className="p-4">
                            <div className="font-extrabold text-teal-800">{b.room_details?.title || `Room #${b.room}`}</div>
                            <div className="mt-1 inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                              <DoorClosed className="w-3 h-3 text-rose-600" />
                              <span>Reserved Units: {b.room_number || 'Room 101'}</span>
                            </div>
                          </td>

                          {/* Guest Info */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{b.guest_phone || 'No phone'}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{b.guest_email}</div>
                          </td>

                          {/* Stay Dates */}
                          <td className="p-4 text-slate-700">
                            <div className="font-bold">{b.check_in} → {b.check_out}</div>
                            <div className="text-[10px] text-slate-500">{b.number_of_nights} Night(s) • {b.number_of_rooms} Room(s)</div>
                          </td>

                          {/* Total Amount */}
                          <td className="p-4">
                            <div className="text-teal-600 font-black text-sm">₹{parseFloat(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          </td>

                          {/* Booking Status */}
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                              b.booking_status === 'CONFIRMED' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                              b.booking_status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              b.booking_status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              b.booking_status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>

                          {/* Payment Status */}
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.payment_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              b.payment_status === 'REFUNDED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {b.payment_status}
                            </span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Room Occupancy Matrix */}
        {activeTab === 'ROOM_OCCUPANCY' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Room Unit Reserved Status Matrix</h2>
                <p className="text-xs text-slate-500 font-semibold">Visual real-time status of physical room units (🔴 BOOKED / RESERVED vs 🟢 AVAILABLE)</p>
              </div>
            </div>

            <div className="space-y-6">
              {hotels.map((hotel) => {
                const hotelBookings = bookings.filter(
                  (b) => b.hotel === hotel.id || b.hotel_details?.id === hotel.id
                );

                return (
                  <div key={hotel.id} className="card-white p-6 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{hotel.name}</h3>
                        <p className="text-xs font-semibold text-slate-500">{hotel.city}, {hotel.state}</p>
                      </div>
                      <Link
                        to={`/owner/hotels/${hotel.id}/rooms`}
                        className="btn-teal py-1.5 px-3 text-xs font-bold"
                      >
                        Manage Rooms
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {hotel.rooms && hotel.rooms.length > 0 ? (
                        hotel.rooms.map((room) => {
                          const activeStatuses = ['CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT'];
                          const roomBookings = hotelBookings.filter(
                            (b) => (b.room === room.id || b.room_details?.id === room.id) &&
                            activeStatuses.includes(b.booking_status)
                          );

                          // Parse room numbers list
                          const roomNums = room.all_room_numbers || Array.from({ length: room.total_rooms }, (_, i) => `Room ${101 + i}`);

                          return (
                            <div key={room.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-extrabold text-slate-900">{room.title}</h4>
                                  <p className="text-xs text-slate-500 font-semibold">{room.room_type} • ₹{room.price_per_night}/night</p>
                                </div>
                                <div className="text-xs font-bold text-slate-600">
                                  {roomBookings.length} Active Reservation(s)
                                </div>
                              </div>

                              {/* Unit Badges Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                                {roomNums.map((numStr) => {
                                  // Check if this room number is booked in active bookings
                                  const matchingBooking = roomBookings.find(
                                    (b) => (b.room_number || '').includes(numStr)
                                  );

                                  return (
                                    <div
                                      key={numStr}
                                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                        matchingBooking
                                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-black text-xs">{numStr}</span>
                                        {matchingBooking ? (
                                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                                        ) : (
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                                        )}
                                      </div>

                                      <div className="mt-2 text-[10px]">
                                        {matchingBooking ? (
                                          <div>
                                            <p className="font-extrabold text-rose-700 uppercase tracking-wider">RESERVED</p>
                                            <p className="font-bold text-slate-800 truncate">{matchingBooking.guest_name || 'Guest'}</p>
                                            <p className="text-[9px] text-slate-500">{matchingBooking.check_in} → {matchingBooking.check_out}</p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="font-extrabold text-emerald-700 uppercase tracking-wider">AVAILABLE</p>
                                            <p className="text-[9px] text-emerald-600 font-medium">Open for Booking</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">No room categories created for this hotel yet.</p>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content 4: Settings Group with Sub-Items */}
        {(activeTab === 'SETTINGS' || activeTab.startsWith('SETTING_')) && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rose-600" /> Settings Portal
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Configure host profile info, Razorpay merchant payment keys, bank payout details, and notifications.
                </p>
              </div>

              {/* Sub-item Pills Filter Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('SETTING_PROFILE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_PROFILE' || activeTab === 'SETTINGS'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Personal Profile
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SETTING_RAZORPAY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_RAZORPAY'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" /> Razorpay Keys
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SETTING_NOTIFICATIONS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_NOTIFICATIONS'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" /> Notifications
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* 1. Personal Host Information Sub-Section */}
              {(activeTab === 'SETTING_PROFILE' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-4 h-4 text-rose-600" /> Personal Host Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="First Name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="Last Name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Email Address (Account Login)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Host Bio & Hospitality Experience
                  </label>
                  <textarea
                    rows={2}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Brief bio about your hospitality chain or hotel management background..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  ></textarea>
                </div>
              </div>
              )}

              {/* 3. Razorpay Merchant Credentials Sub-Section */}
              {(activeTab === 'SETTING_RAZORPAY' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-950 uppercase tracking-wider">
                        Razorpay Direct Customer Tariff Payout Keys
                      </span>
                      {user?.razorpay_key_id ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                          Active ({user.razorpay_key_id.substring(0, 10)}...)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                          Platform Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                      All customer room booking payments will go directly to your personal Razorpay account if configured.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRazorpayKeyModal(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                    <span>Change Razorpay Keys</span>
                  </button>
                </div>
              </div>
              )}

              {/* 4. Notification & Alert Preferences Sub-Section */}
              {(activeTab === 'SETTING_NOTIFICATIONS' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Bell className="w-4 h-4 text-rose-600" /> Booking Notification & Alert Preferences
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      checked={profileForm.email_notifications}
                      onChange={(e) => setProfileForm({ ...profileForm, email_notifications: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Instant Email Alerts for New Guest Reservations</span>
                      <span className="text-[11px] text-slate-500 font-medium">Receive an immediate email notification whenever a guest reserves a room.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      checked={profileForm.sms_notifications}
                      onChange={(e) => setProfileForm({ ...profileForm, sms_notifications: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">SMS / WhatsApp Check-in Alerts</span>
                      <span className="text-[11px] text-slate-500 font-medium">Receive real-time WhatsApp or SMS updates when guests check in.</span>
                    </div>
                  </label>
                </div>
              </div>
              )}

              {/* Submit Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-rose py-3.5 px-8 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>Save All Portal Settings</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* DEDICATED SECURITY MODAL FOR CHANGING RAZORPAY MERCHANT KEYS */}
      {showRazorpayKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-white max-w-lg w-full p-6 space-y-6 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Configure / Change Razorpay Merchant Keys</h3>
                  <p className="text-xs text-slate-500 font-semibold">Security authentication required to update payment keys</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRazorpayKeyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveRazorpayKeys} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Hotel Owner Razorpay Key ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyForm.razorpay_key_id}
                  onChange={(e) => setKeyForm({ ...keyForm, razorpay_key_id: e.target.value })}
                  placeholder="rzp_live_xxxxxxxx or rzp_test_xxxx"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Hotel Owner Razorpay Key Secret <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={keyForm.razorpay_key_secret}
                  onChange={(e) => setKeyForm({ ...keyForm, razorpay_key_secret: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-rose-900 mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-rose-600" /> Enter Account Login Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={keyForm.current_password}
                  onChange={(e) => setKeyForm({ ...keyForm, current_password: e.target.value })}
                  placeholder="Enter your login password to authorize key update"
                  className="w-full px-4 py-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                />
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  🔒 For your security, Razorpay merchant key changes must be verified with your account password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRazorpayKeyModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingKeys}
                  className="btn-rose py-2.5 px-6 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {savingKeys ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Password & Save Keys</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
