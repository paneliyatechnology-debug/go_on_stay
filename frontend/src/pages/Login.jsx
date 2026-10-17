import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Mail, User, Eye, EyeOff, ShieldCheck, Hotel, Sparkles, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      const userRole = result.user.role;
      if (userRole === 'HOTEL_OWNER') {
        navigate('/owner/dashboard');
      } else if (userRole === 'ADMIN' || result.user.is_superuser) {
        navigate('/admin/dashboard');
      } else {
        // Safely redirect Customers to home page or requested customer page
        if (from && (from.includes('/owner') || from.includes('/admin') || from === '/login')) {
          navigate('/', { replace: true });
        } else {
          navigate(from || '/', { replace: true });
        }
      }
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-100/70 text-slate-900 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Two-Column Split Auth Box */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-fade-in my-auto">
        
        {/* LEFT COLUMN: Login Form (lg:col-span-6) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-11 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Logo Badge */}
            <Link to="/" className="flex items-center gap-1.5 mb-6 group">
              <img
                src="/logo.png"
                alt="BMR Logo"
                className="h-10 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight block leading-none">Book<span className="text-rose-600">My</span>Room</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">BMR Portal</span>
              </div>
            </Link>

            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="mt-1.5 text-xs text-slate-500 font-semibold leading-relaxed">
                Sign in to manage your bookings, hotel owner dashboard, or profile.
              </p>
            </div>
          </div>

          {/* Quick Test Login Fillers */}
          <div className="bg-rose-50/70 border border-rose-200/70 p-3.5 rounded-2xl">
            <div className="text-[11px] font-black uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              Quick Demo Login Auto-Fill
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('customer_priya', 'CustomerPassword123!')}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:border-rose-600 hover:text-rose-600 transition-all shadow-2xs text-center"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('owner_rahul', 'OwnerPassword123!')}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:border-rose-600 hover:text-rose-600 transition-all shadow-2xs text-center"
              >
                Hotel Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'AdminPassword123!')}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:border-rose-600 hover:text-rose-600 transition-all shadow-2xs text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="customer_priya or email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-rose-600 font-extrabold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-rose py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose-600 font-black hover:underline">
              Register Here
            </Link>
          </div>

        </div>

        {/* RIGHT COLUMN: Web App Poster / Hero Section (lg:col-span-6) */}
        <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden flex-col justify-between p-10 text-white bg-slate-900 min-h-[560px]">
          
          {/* Background Poster Image */}
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
            alt="BookMyRoom Web App Poster"
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 hover:scale-100"
          />

          {/* Gradient & Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-900/40"></div>

          {/* Poster Top Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-black tracking-wide">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>500+ Verified Luxury Hotels</span>
            </div>
            <span className="text-[11px] text-white/70 font-mono uppercase tracking-widest font-bold">BookMyRoom App</span>
          </div>

          {/* Poster Middle Copy */}
          <div className="relative z-10 space-y-4 my-auto py-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-rose-400 block">World-Class Stays</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Experience Premium Hospitality & Seamless Bookings
              </h3>
              <p className="text-xs text-white/80 font-medium leading-relaxed max-w-sm">
                Discover handpicked luxury resorts, heritage palaces & boutique stays across top Indian destinations.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-extrabold text-white/90 bg-slate-950/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>100% Verified Properties & Instant Confirmations</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-extrabold text-white/90 bg-slate-950/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Direct Owner Communication & Zero Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-extrabold text-white/90 bg-slate-950/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>24/7 VIP Concierge & Guest Support Assistance</span>
              </div>
            </div>
          </div>

          {/* Poster Bottom Social Proof */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <img className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User" />
                <img className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="User" />
                <img className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="User" />
              </div>
              <span className="text-[11px] font-bold text-white/80">Joined by 50,000+ Happy Guests</span>
            </div>
            <div className="text-[11px] font-black text-rose-400 tracking-wider uppercase">★ 4.9 / 5.0</div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;

