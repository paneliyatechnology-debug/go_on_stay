import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import HotelSearch from './pages/HotelSearch';
import HotelDetails from './pages/HotelDetails';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Wishlist from './pages/Wishlist';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddEditHotel from './pages/owner/AddEditHotel';
import ManageRooms from './pages/owner/ManageRooms';
import AddEditRoom from './pages/owner/AddEditRoom';

// Admin & Staff & Support Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import SupportTickets from './pages/SupportTickets';

import BecomeHost from './pages/BecomeHost';

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/search" element={<HotelSearch />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/become-host" element={<BecomeHost />} />

              
              {/* Protected Guest Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-confirmation/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* Protected Hotel Owner Routes */}
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/hotels/new"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <AddEditHotel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/hotels/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <AddEditHotel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <ManageRooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms/new"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <AddEditRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms/:roomId/edit"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_OWNER', 'ADMIN']}>
                    <AddEditRoom />
                  </ProtectedRoute>
                }
              />

              {/* Staff Desk Routes */}
              <Route
                path="/staff/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['HOTEL_STAFF', 'HOTEL_OWNER', 'ADMIN']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Support Tickets Route */}
              <Route
                path="/support/tickets"
                element={
                  <ProtectedRoute>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toast />
        </div>
      </Router>
    </LanguageProvider>
  </AuthProvider>
  );
};

export default App;
