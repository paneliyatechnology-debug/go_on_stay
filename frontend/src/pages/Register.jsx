import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Hotel, Star, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    role: 'CUSTOMER',
  });

  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      showToast('Please enter a valid email address first.', 'error');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/users/send-otp/', { email: formData.email });
      setOtpSent(true);
      showToast(`Verification OTP sent to ${formData.email}! Check your inbox. ✉️`);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send OTP email.';
      showToast(errMsg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit OTP code sent to your email.', 'error');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post('/users/verify-otp/', { email: formData.email, otp: otpCode.trim() });
      if (res.data.is_verified) {
        setIsOtpVerified(true);
        showToast('Email verified successfully! ✅');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid or expired OTP code.';
      showToast(errMsg, 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (!isOtpVerified) {
      showToast('Please verify your email address using the 6-digit OTP before registering.', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData);
      if (result && result.success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast('An unexpected error occurred during registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-100/70 text-slate-900 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Two-Column Split Auth Box */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-fade-in my-auto">
        
        {/* LEFT COLUMN: Registration Form (lg:col-span-7) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-11 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Logo Badge */}
            <Link to="/" className="flex items-center gap-1.5 mb-5 group">
              <img
                src="/logo.png"
                alt="BMR Logo"
                className="h-10 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight block leading-none">Book<span className="text-rose-600">My</span>Room</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Join BMR Platform</span>
              </div>
            </Link>

            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create an Account</h2>
              <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                Join BookMyRoom to book rooms and manage your stay reservations
              </p>
            </div>
          </div>

          {/* Registration Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            
            {/* First Name & Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Priya"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Username & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="priya_patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* EMAIL & OTP VERIFICATION SECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                {isOtpVerified && (
                  <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Email Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  disabled={isOtpVerified}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="priya@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-100"
                />

                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !formData.email}
                    className="btn-rose py-2 px-4 text-xs font-extrabold shrink-0 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {sendingOtp ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                  </button>
                )}
              </div>

              {/* OTP CODE INPUT (Appears after OTP is sent) */}
              {otpSent && !isOtpVerified && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5 animate-fadeIn mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" /> Enter 6-Digit OTP Code
                    </span>
                    <span className="text-[10px] text-amber-700">Sent to {formData.email}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-mono font-black tracking-widest text-slate-900 outline-none focus:border-amber-600"
                    />

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shrink-0 cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {verifyingOtp ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>Verify OTP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Show Password Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-900 flex items-center gap-1.5 text-[11px] font-bold text-rose-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide Passwords' : 'Show Passwords'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isOtpVerified}
              className={`btn-rose w-full py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                !isOtpVerified ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Complete Account Registration</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-rose-600 hover:text-rose-700 font-black hover:underline ml-1">
                Sign In Instead
              </Link>
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Promotional Hospitality Branding (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-rose-950 to-red-950 p-8 sm:p-11 text-white flex flex-col justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> BookMyRoom Guarantee
            </div>

            <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              Seamless Stay Reservations & Host Earnings
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Instant Confirmation</h4>
                  <p className="text-[11px] text-slate-300 font-medium">Real-time room availability checked with automated Razorpay keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Direct Host Settlement</h4>
                  <p className="text-[11px] text-slate-300 font-medium">Hotel Owners receive booking payments directly into their Razorpay account.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">100% Price Lock Guarantee</h4>
                  <p className="text-[11px] text-slate-300 font-medium">No hidden fees or unexpected surge charges at hotel check-in.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 relative z-10">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              By creating an account, you agree to BookMyRoom's Terms of Service, Privacy Policy, and Email Verification rules.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Register;
