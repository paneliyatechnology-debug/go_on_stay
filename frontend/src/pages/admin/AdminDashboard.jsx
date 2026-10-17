import React, { useState, useEffect } from 'react';
import {
  Users, Building2, BedDouble, CalendarCheck, IndianRupee,
  ShieldCheck, Lock, Unlock, CheckCircle2, XCircle, Search, RefreshCw, CreditCard, RotateCcw,
  Tag, Star, Download, Plus, Trash2, Filter, AlertCircle, Ban, Check, UserCheck, Shield,
  Layers, ArrowUpRight, ChevronRight, Activity, Sliders, CheckSquare, Sparkles, UserPlus, Menu
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

const AdminDashboard = () => {
  const { showToast, user: currentUser } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [refundsList, setRefundsList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: OVERVIEW, HOTELS, USERS, BOOKINGS, PAYMENTS, REFUNDS, COUPONS, REVIEWS
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percentage: '10',
    max_discount_amount: '1000',
    min_booking_amount: '2000',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true
  });

  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRoleInput, setNewRoleInput] = useState('HOTEL_OWNER');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, hotelsRes, bookingsRes, paymentsRes, refundsRes, couponsRes, reviewsRes] = await Promise.allSettled([
        api.get('/users/all/'),
        api.get('/hotels/?page_size=1000&sort_by=newest'),
        api.get('/bookings/'),
        api.get('/payments/admin/all/'),
        api.get('/payments/admin/refunds/'),
        api.get('/coupons/'),
        api.get('/reviews/')
      ]);

      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data.results || usersRes.value.data);
      if (hotelsRes.status === 'fulfilled') setHotelsList(hotelsRes.value.data.results || hotelsRes.value.data);
      if (bookingsRes.status === 'fulfilled') setBookingsList(bookingsRes.value.data.results || bookingsRes.value.data);
      if (paymentsRes.status === 'fulfilled') setPaymentsList(paymentsRes.value.data.results || paymentsRes.value.data);
      if (refundsRes.status === 'fulfilled') setRefundsList(refundsRes.value.data.results || refundsRes.value.data);
      if (couponsRes.status === 'fulfilled') setCouponsList(couponsRes.value.data.results || couponsRes.value.data);
      if (reviewsRes.status === 'fulfilled') setReviewsList(reviewsRes.value.data.results || reviewsRes.value.data);

    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Failed to load admin records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Super Admin Actions ---

  const handleToggleUserBlock = async (userId, username) => {
    try {
      const res = await api.post(`/users/${userId}/toggle-block/`);
      showToast(res.data.message);
      setUsersList(usersList.map((u) => (u.id === userId ? { ...u, is_blocked: res.data.is_blocked } : u)));
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to toggle user block status.';
      showToast(msg, 'error');
    }
  };

  const handleChangeUserRole = async () => {
    if (!selectedUserForRole) return;
    try {
      const res = await api.post(`/users/${selectedUserForRole.id}/change-role/`, { role: newRoleInput });
      showToast(res.data.message || `Role updated to ${newRoleInput}`);
      setUsersList(usersList.map(u => u.id === selectedUserForRole.id ? { ...u, role: newRoleInput } : u));
      setSelectedUserForRole(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user role.';
      showToast(msg, 'error');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ SUPER ADMIN CONFIRMATION:\nAre you sure you want to permanently delete user account '@${username}'? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}/delete/`);
      showToast(`User '@${username}' deleted permanently.`);
      setUsersList(usersList.filter(u => u.id !== userId));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user.', 'error');
    }
  };

  const handleHotelApproval = async (hotelId, actionName) => {
    let reason = '';
    if (actionName === 'reject' || actionName === 'suspend') {
      reason = window.prompt(`Enter reason to ${actionName} this hotel:`, 'Safety standard compliance pending') || '';
      if (!reason) return;
    }

    try {
      const res = await api.post(`/hotels/${hotelId}/approval/`, {
        action: actionName,
        reason: reason
      });
      showToast(res.data.message || `Hotel ${actionName}ed successfully!`);
      setHotelsList(hotelsList.map((h) => (h.id === hotelId ? { ...h, status: res.data.status, is_approved: res.data.is_approved } : h)));
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${actionName} hotel.`;
      showToast(msg, 'error');
    }
  };

  const handleDeleteHotel = async (hotelId, hotelName) => {
    if (!window.confirm(`⚠️ SUPER ADMIN CONFIRMATION:\nAre you sure you want to permanently delete '${hotelName}' and all associated rooms/bookings?`)) return;
    try {
      await api.delete(`/hotels/${hotelId}/`);
      showToast(`Hotel '${hotelName}' deleted.`);
      setHotelsList(hotelsList.filter(h => h.id !== hotelId));
    } catch (err) {
      showToast('Failed to delete hotel.', 'error');
    }
  };

  const handleInitiateRefund = async (payment) => {
    const amountStr = window.prompt(`Enter refund amount in ₹ for Booking #${payment.booking_id}:`, payment.amount);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      showToast('Invalid refund amount', 'error');
      return;
    }
    const reason = window.prompt('Enter reason for refund:', 'Admin requested refund') || 'Admin requested refund';

    try {
      const res = await api.post('/payments/refund/', {
        booking_id: payment.booking_id,
        amount: amount,
        reason: reason
      });
      showToast(res.data.message || 'Refund initiated successfully!');
      fetchAdminData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to process refund.';
      showToast(errorMsg, 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }
    try {
      const res = await api.post('/coupons/', couponForm);
      showToast(`Promo Code ${res.data.code} created successfully!`);
      setCouponsList([res.data, ...couponsList]);
      setShowCouponModal(false);
      setCouponForm({
        code: '',
        discount_percentage: '10',
        max_discount_amount: '1000',
        min_booking_amount: '2000',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.code?.[0] || 'Failed to create promo coupon.';
      showToast(msg, 'error');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete promo code '${code}'?`)) return;
    try {
      await api.delete(`/coupons/${id}/`);
      showToast(`Coupon ${code} deleted.`);
      setCouponsList(couponsList.filter(c => c.id !== id));
    } catch (err) {
      showToast('Failed to delete coupon.', 'error');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this guest review?')) return;
    try {
      await api.delete(`/reviews/${id}/`);
      showToast('Review removed.');
      setReviewsList(reviewsList.filter(r => r.id !== id));
    } catch (err) {
      showToast('Failed to delete review.', 'error');
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'PAYMENTS') {
      csvContent += 'Booking ID,Customer Email,Razorpay Order ID,Payment ID,Amount,Status,Paid At\n';
      paymentsList.forEach(p => {
        csvContent += `"${p.booking_id}","${p.user_email || ''}","${p.razorpay_order_id || ''}","${p.razorpay_payment_id || ''}","${p.amount}","${p.status}","${p.paid_at || ''}"\n`;
      });
    } else if (activeTab === 'HOTELS') {
      csvContent += 'Hotel Name,Owner Name,Owner Email,Owner Phone,City,Star Rating,Starting Price,Status\n';
      hotelsList.forEach(h => {
        csvContent += `"${h.name}","${h.owner_name || ''}","${h.owner_email || ''}","${h.owner_phone || ''}","${h.city}","${h.star_rating}","${h.starting_price}","${h.status}"\n`;
      });
    } else if (activeTab === 'BOOKINGS') {
      csvContent += 'Booking ID,Guest Name,Hotel Name,Owner Name,Check In,Check Out,Total Amount,Booking Status,Payment Status\n';
      bookingsList.forEach(b => {
        csvContent += `"${b.id}","${b.guest_name || b.customer_name || ''}","${b.hotel_details?.name || ''}","${b.hotel_details?.owner_name || ''}","${b.check_in}","${b.check_out}","${b.total_amount}","${b.booking_status}","${b.payment_status}"\n`;
      });
    } else if (activeTab === 'USERS') {
      csvContent += 'User ID,Username,Email,First Name,Last Name,Role,Status,Phone\n';
      usersList.forEach(u => {
        csvContent += `"${u.id}","${u.username}","${u.email}","${u.first_name || ''}","${u.last_name || ''}","${u.role}","${u.is_blocked ? 'Blocked' : 'Active'}","${u.phone_number || ''}"\n`;
      });
    } else {
      showToast('Export available for Payments, Hotels, Users & Bookings tabs.', 'info');
      return;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `superadmin_${activeTab.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const capturedPayments = paymentsList.filter((p) => p.status === 'CAPTURED');
  const totalRevenue = capturedPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const totalRefunded = refundsList.reduce((acc, r) => acc + parseFloat(r.amount || 0), 0);
  const approvedHotelsCount = hotelsList.filter((h) => h.is_approved || h.status === 'APPROVED').length;
  const pendingHotelsCount = hotelsList.filter((h) => h.status === 'SUBMITTED' || (!h.is_approved && h.status !== 'REJECTED')).length;
  const confirmedBookingsCount = bookingsList.filter((b) => b.booking_status === 'CONFIRMED' || b.booking_status === 'CHECKED_IN').length;
  const totalOwnersCount = usersList.filter(u => u.role === 'HOTEL_OWNER').length;

  // Search filter matching
  const q = searchQuery.toLowerCase().trim();
  const filteredPayments = paymentsList.filter(p => !q || p.booking_id?.toString().includes(q) || p.user_email?.toLowerCase().includes(q) || p.razorpay_payment_id?.toLowerCase().includes(q));
  const filteredRefunds = refundsList.filter(r => !q || r.booking_id?.toString().includes(q) || r.razorpay_refund_id?.toLowerCase().includes(q));
  const filteredUsers = usersList.filter(u => !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
  const filteredHotels = hotelsList.filter(h => {
    if (!q) return true;
    if (q === 'submitted' || q === 'pending') {
      return h.status === 'SUBMITTED' || (!h.is_approved && h.status !== 'REJECTED');
    }
    if (q === 'approved') {
      return h.is_approved || h.status === 'APPROVED';
    }
    if (q === 'rejected') {
      return h.status === 'REJECTED';
    }
    return (
      h.name?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q) ||
      h.owner_name?.toLowerCase().includes(q) ||
      h.owner_email?.toLowerCase().includes(q) ||
      h.status?.toLowerCase().includes(q)
    );
  });
  const filteredBookings = bookingsList.filter(b => !q || b.id?.toString().includes(q) || b.guest_name?.toLowerCase().includes(q) || b.hotel_details?.name?.toLowerCase().includes(q) || b.hotel_details?.owner_name?.toLowerCase().includes(q));
  const filteredCoupons = couponsList.filter(c => !q || c.code?.toLowerCase().includes(q));
  const filteredReviews = reviewsList.filter(r => !q || r.comment?.toLowerCase().includes(q) || r.user_name?.toLowerCase().includes(q) || r.hotel_name?.toLowerCase().includes(q));

  // Mobile Sidebar Drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Simplified 1-Click Clean Sidebar Menu Navigation
  const adminMenuGroups = [
    {
      id: 'main',
      title: 'Main Navigation',
      icon: Activity,
      items: [
        { id: 'OVERVIEW', label: 'Executive Overview', icon: Activity, badge: null },
        { id: 'HOTELS', label: 'Hotels & Properties', icon: Building2, badge: hotelsList.length },
        { id: 'USERS', label: 'Users & Roles', icon: Users, badge: usersList.length },
        { id: 'BOOKINGS', label: 'Reservations & Stays', icon: CalendarCheck, badge: bookingsList.length },
      ]
    },
    {
      id: 'finance_mgmt',
      title: 'Finance & Coupons',
      icon: IndianRupee,
      items: [
        { id: 'PAYMENTS', label: 'Payments Ledger', icon: CreditCard, badge: paymentsList.length },
        { id: 'REFUNDS', label: 'Refund Requests', icon: RotateCcw, badge: refundsList.length },
        { id: 'COUPONS', label: 'Promo Coupons', icon: Tag, badge: couponsList.length },
      ]
    },
    {
      id: 'feedback',
      title: 'Guest Reviews',
      icon: Star,
      items: [
        { id: 'REVIEWS', label: 'Guest Reviews', icon: Star, badge: reviewsList.length },
      ]
    }
  ];

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter !== undefined && filter !== null) {
      setSearchQuery(filter);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex font-sans selection:bg-red-600 selection:text-white min-w-[1280px]">
      
      {/* Permanent Desktop Sidebar */}
      <Sidebar
        menuGroups={adminMenuGroups}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        title="Admin Panel"
        subtitle="Super Master Controls"
        badgeText="FULL ACCESS"
      />

      {/* Main Desktop Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 overflow-y-auto">
        
        {/* Top Desktop Sticky Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {activeTab === 'OVERVIEW' ? 'Executive Overview & Stats' :
                   activeTab === 'HOTELS' ? 'Hotel Properties Control' :
                   activeTab === 'USERS' ? 'User Accounts & Roles Directory' :
                   activeTab === 'BOOKINGS' ? 'Reservations & Stays Register' :
                   activeTab === 'PAYMENTS' ? 'Razorpay Payments Ledger' :
                   activeTab === 'REFUNDS' ? 'Customer Refund Requests' :
                   activeTab === 'COUPONS' ? 'Promo & Discount Coupons' : 'Guest Reviews & Ratings'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-200">
                  {activeTab}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Logged in as <span className="text-slate-900 font-bold">@{currentUser?.username || 'admin'}</span> • Desktop Workstation View
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap leading-none"
            >
              <Download className="w-3.5 h-3.5 text-red-600 shrink-0" /> Export CSV
            </button>
            <button
              onClick={fetchAdminData}
              className="py-2 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap leading-none"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" /> Sync Data
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="max-w-7xl mx-auto w-full px-8 pt-6 space-y-6 flex-1">

        {/* Global Search Bar & Quick Preset Filters */}
        {activeTab !== 'OVERVIEW' && (
          <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 p-3.5 rounded-xl">
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-80 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              {/* Quick Preset Filter Pills for Hotels */}
              {activeTab === 'HOTELS' && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center leading-none whitespace-nowrap ${
                      !searchQuery ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({hotelsList.length})
                  </button>
                  <button
                    onClick={() => setSearchQuery('SUBMITTED')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center gap-1 leading-none whitespace-nowrap ${
                      searchQuery === 'SUBMITTED' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ⏳ Pending ({pendingHotelsCount})
                  </button>
                  <button
                    onClick={() => setSearchQuery('APPROVED')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center gap-1 leading-none whitespace-nowrap ${
                      searchQuery === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    ✅ Approved ({approvedHotelsCount})
                  </button>
                </div>
              )}

              {/* Quick Preset Filter Pills for Users */}
              {activeTab === 'USERS' && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center leading-none whitespace-nowrap ${
                      !searchQuery ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Accounts ({usersList.length})
                  </button>
                  <button
                    onClick={() => setSearchQuery('HOTEL_OWNER')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center gap-1 leading-none whitespace-nowrap ${
                      searchQuery === 'HOTEL_OWNER' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    🏨 Owners ({totalOwnersCount})
                  </button>
                  <button
                    onClick={() => setSearchQuery('CUSTOMER')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center gap-1 leading-none whitespace-nowrap ${
                      searchQuery === 'CUSTOMER' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    }`}
                  >
                    👤 Guests ({Math.max(0, usersList.length - totalOwnersCount)})
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'COUPONS' && (
              <button
                onClick={() => setShowCouponModal(true)}
                className="py-2 px-4 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap leading-none"
              >
                <Plus className="w-4 h-4 shrink-0" /> Create Promo Coupon
              </button>
            )}
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            
            {/* KPI Cards Grid - Fixed 4 Columns Desktop */}
            <div className="grid grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Verified Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-red-600">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{capturedPayments.length} Razorpay Captured Payments</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Hotel Properties</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{hotelsList.length} Properties</h3>
                <p className="text-[11px] text-red-600 font-bold mt-1">{approvedHotelsCount} Approved • {pendingHotelsCount} Pending</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Platform Accounts</span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{usersList.length} Accounts</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{totalOwnersCount} Verified Hotel Owners</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Reservations</span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{bookingsList.length} Bookings</h3>
                <p className="text-[11px] text-red-600 font-bold mt-1">{confirmedBookingsCount} Active/Confirmed Stays</p>
              </div>

            </div>

            {/* Quick Master Shortcuts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" /> Super Admin Quick Operations
              </h3>

              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab('HOTELS')}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between font-extrabold text-xs text-slate-800 group-hover:text-red-600 mb-1">
                    <span>Review Pending Hotels</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500">{pendingHotelsCount} Hotels waiting for verification</p>
                </button>

                <button
                  onClick={() => setActiveTab('USERS')}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between font-extrabold text-xs text-slate-800 group-hover:text-red-600 mb-1">
                    <span>Manage User Roles & Access</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500">Assign Owner/Admin roles & block accounts</p>
                </button>

                <button
                  onClick={() => { setActiveTab('COUPONS'); setShowCouponModal(true); }}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between font-extrabold text-xs text-slate-800 group-hover:text-red-600 mb-1">
                    <span>Create Discount Coupon</span>
                    <Plus className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">Issue promo codes for booking discounts</p>
                </button>

                <button
                  onClick={() => setActiveTab('PAYMENTS')}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between font-extrabold text-xs text-slate-800 group-hover:text-red-600 mb-1">
                    <span>Process Guest Refunds</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500">Initiate Razorpay online refunds</p>
                </button>
              </div>
            </div>

            {/* Recent Live Activity Stream */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Recent Hotels Pending Approval */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-600" /> Recent Hotel Properties
                  </h4>
                  <button onClick={() => setActiveTab('HOTELS')} className="text-[11px] text-red-600 hover:underline font-bold">View All ({hotelsList.length})</button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {hotelsList.slice(0, 5).map(h => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-slate-900">{h.name}</div>
                        <div className="text-[11px] text-slate-500">Owner: {h.owner_name || 'N/A'} • {h.city}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        h.is_approved || h.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {h.status || (h.is_approved ? 'APPROVED' : 'PENDING')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-600" /> Recent Payments
                  </h4>
                  <button onClick={() => setActiveTab('PAYMENTS')} className="text-[11px] text-red-600 hover:underline font-bold">View All ({paymentsList.length})</button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {paymentsList.slice(0, 5).map(p => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono font-bold text-slate-900">Booking #{p.booking_id}</div>
                        <div className="text-[11px] text-slate-500">{p.user_email || `User #${p.user_id}`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-600">₹{parseFloat(p.amount).toFixed(2)}</div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: HOTELS MANAGEMENT */}
        {activeTab === 'HOTELS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Hotel Property</th>
                    <th className="p-4">Hotel Owner Contact</th>
                    <th className="p-4">City / Location</th>
                    <th className="p-4">Star Rating</th>
                    <th className="p-4">Starting Price</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredHotels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">No hotel properties match the search criteria.</td>
                    </tr>
                  ) : (
                    filteredHotels.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{h.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{h.property_type || 'Hotel Property'}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            {h.owner_name || 'N/A'}
                          </div>
                          {h.owner_email && (
                            <div className="text-[11px] text-slate-500">{h.owner_email}</div>
                          )}
                          {h.owner_phone && (
                            <div className="text-[10px] text-red-600 font-mono">📞 {h.owner_phone}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-700">
                          <div className="font-bold text-slate-900">{h.city}</div>
                          {h.address && <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{h.address}</div>}
                        </td>
                        <td className="p-4 text-amber-500 font-bold">{h.star_rating} ★</td>
                        <td className="p-4 text-red-600 font-black text-sm">₹{h.starting_price}/night</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            h.is_approved || h.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            h.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            h.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                          }`}>
                            {h.status || (h.is_approved ? 'APPROVED' : 'PENDING')}
                          </span>
                          {h.rejection_reason && (
                            <div className="text-[10px] text-rose-600 font-normal mt-1 max-w-[140px] truncate" title={h.rejection_reason}>
                              Reason: {h.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {!(h.is_approved || h.status === 'APPROVED') && (
                            <button
                              onClick={() => handleHotelApproval(h.id, 'approve')}
                              className="py-1.5 px-3 rounded-lg bg-red-600 text-white text-[11px] font-black hover:bg-red-700 inline-flex items-center justify-center gap-1 shadow-xs shrink-0 whitespace-nowrap leading-none"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" /> Approve
                            </button>
                          )}
                          {h.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleHotelApproval(h.id, 'reject')}
                              className="py-1.5 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap leading-none"
                            >
                              <Ban className="w-3.5 h-3.5 shrink-0" /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteHotel(h.id, h.name)}
                            className="py-1.5 px-3 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap leading-none"
                            title="Delete Hotel"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USERS & ROLES MANAGEMENT */}
        {activeTab === 'USERS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">User ID & Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Account Role</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-sm">{u.first_name || u.username} {u.last_name || ''}</div>
                        <span className="text-[11px] text-slate-500 font-mono">@{u.username}</span>
                      </td>
                      <td className="p-4 text-slate-700 font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                          u.role === 'HOTEL_OWNER' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          u.role === 'HOTEL_STAFF' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role || 'CUSTOMER'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-mono">{u.phone_number || 'N/A'}</td>
                      <td className="p-4">
                        {u.is_blocked ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-extrabold bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                            <Lock className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {!u.is_superuser && (
                          <>
                            <button
                              onClick={() => { setSelectedUserForRole(u); setNewRoleInput(u.role || 'HOTEL_OWNER'); }}
                              className="py-1.5 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap leading-none"
                            >
                              <UserCheck className="w-3.5 h-3.5 shrink-0" /> Change Role
                            </button>
                            <button
                              onClick={() => handleToggleUserBlock(u.id, u.username)}
                              className={`py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-colors inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap leading-none ${
                                u.is_blocked
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white'
                              }`}
                            >
                              {u.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap leading-none"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RESERVATIONS */}
        {activeTab === 'BOOKINGS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Guest Details</th>
                    <th className="p-4">Hotel Property & Owner</th>
                    <th className="p-4">Check-In / Out</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Booking Status</th>
                    <th className="p-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">No reservations found.</td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900 text-sm">#{b.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                          {b.guest_email && <div className="text-[10px] text-slate-500">{b.guest_email}</div>}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{b.hotel_details?.name || 'N/A'}</div>
                          {b.hotel_details?.owner_name && (
                            <div className="text-[11px] text-red-600 font-bold mt-0.5">
                              Owner: {b.hotel_details.owner_name}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 font-mono">{b.check_in} → {b.check_out}</td>
                        <td className="p-4 text-red-600 font-black text-sm">₹{b.total_amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            b.booking_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            b.booking_status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            b.payment_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            b.payment_status === 'REFUNDED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {b.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENTS LEDGER */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Customer Email</th>
                    <th className="p-4">Razorpay Order ID</th>
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Paid At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500 font-bold">No payment transactions recorded.</td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900 text-sm">#{p.booking_id}</td>
                        <td className="p-4 text-slate-900 font-bold">{p.user_email || `User #${p.user_id}`}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{p.razorpay_order_id || 'N/A'}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{p.razorpay_payment_id || 'N/A'}</td>
                        <td className="p-4 text-red-600 font-black text-sm">₹{parseFloat(p.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'CAPTURED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            p.status === 'REFUNDED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {p.paid_at ? new Date(p.paid_at).toLocaleString('en-IN') : 'Unpaid'}
                        </td>
                        <td className="p-4 text-right">
                          {p.status === 'CAPTURED' && (
                            <button
                              onClick={() => handleInitiateRefund(p)}
                              className="py-1 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold transition-colors flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className="w-3 h-3" /> Initiate Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REFUNDS */}
        {activeTab === 'REFUNDS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Refund ID</th>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Razorpay Refund ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">No refund records available.</td>
                    </tr>
                  ) : (
                    filteredRefunds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#{r.id}</td>
                        <td className="p-4 font-mono font-bold text-slate-700">#{r.booking_id}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{r.razorpay_refund_id || 'N/A'}</td>
                        <td className="p-4 text-rose-600 font-black text-sm">₹{parseFloat(r.amount).toFixed(2)}</td>
                        <td className="p-4 text-slate-700">{r.reason || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            r.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {r.processed_at ? new Date(r.processed_at).toLocaleString('en-IN') : 'Pending'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PROMO COUPONS */}
        {activeTab === 'COUPONS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Promo Code</th>
                    <th className="p-4">Discount %</th>
                    <th className="p-4">Max Discount</th>
                    <th className="p-4">Min Booking ₹</th>
                    <th className="p-4">Valid Range</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">No promotional coupons created yet. Click 'Create Promo Coupon' above.</td>
                    </tr>
                  ) : (
                    filteredCoupons.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-black text-red-600 text-sm flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-red-600" /> {c.code}
                        </td>
                        <td className="p-4 font-bold text-slate-900">{c.discount_percentage}% OFF</td>
                        <td className="p-4 font-bold text-slate-700">₹{c.max_discount_amount}</td>
                        <td className="p-4 text-slate-500">₹{c.min_booking_amount}</td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">{c.valid_from} → {c.valid_until}</td>
                        <td className="p-4">
                          {c.is_active ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">Inactive</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="py-1 px-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: REVIEWS */}
        {activeTab === 'REVIEWS' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Review ID</th>
                    <th className="p-4">Hotel / User</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Comment</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 font-bold">No guest reviews submitted yet.</td>
                    </tr>
                  ) : (
                    filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#{rev.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{rev.hotel_name || `Hotel #${rev.hotel}`}</div>
                          <div className="text-[10px] text-slate-500">By: {rev.user_name || `User #${rev.user}`}</div>
                        </td>
                        <td className="p-4 font-black text-amber-500 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {rev.rating} / 5
                        </td>
                        <td className="p-4 text-slate-700 max-w-xs truncate">{rev.comment || 'No written review text.'}</td>
                        <td className="p-4 text-slate-500 text-[11px]">{new Date(rev.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="py-1 px-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Change User Role */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 shadow-lg space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-red-600" /> Change User Role
              </h3>
              <button onClick={() => setSelectedUserForRole(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 font-medium">Select new platform access role for user <span className="font-bold text-red-600">@{selectedUserForRole.username}</span>:</p>

              <select
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-red-600"
              >
                <option value="CUSTOMER">Guest (Customer)</option>
                <option value="HOTEL_OWNER">Hotel Owner</option>
              </select>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedUserForRole(null)}
                  className="py-2 px-3.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeUserRole}
                  className="py-2 px-3.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-lg space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-600" /> Create Promo Coupon
              </h3>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME500"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono uppercase font-black focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={couponForm.discount_percentage}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_percentage: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    required
                    value={couponForm.max_discount_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Booking Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={couponForm.min_booking_amount}
                  onChange={(e) => setCouponForm({ ...couponForm, min_booking_amount: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={couponForm.valid_from}
                    onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={couponForm.valid_until}
                    onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="py-2 px-3.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-3.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default AdminDashboard;
