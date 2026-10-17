import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hotel, Mail, Phone, MapPin, ShieldCheck, Heart, Sparkles, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner')) {
    return null;
  }

  return (
    <footer className="relative bg-slate-950/80 backdrop-blur-2xl text-slate-300 border-t border-white/10 pt-16 pb-12 overflow-hidden shadow-2xl">
      {/* Background Ambient Glass Glow Orbs */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="BMR BookMyRoom Logo"
                className="h-12 sm:h-14 w-auto object-contain mix-blend-screen group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              />
              <div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none block">
                  Book<span className="text-rose-500">My</span>Room
                </span>
                <span className="text-[10px] text-rose-400/90 font-bold uppercase tracking-widest block pt-1">
                  Oceanic Vacation Marketplace
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              BookMyRoom is an independent luxury & boutique hotel reservation engine offering direct room bookings, instant confirmation, best price guarantee, and verified reviews.
            </p>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2.5 text-xs text-teal-400 font-semibold shadow-inner">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>100% Verified Properties & Secure Payments</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>Quick Links</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to="/search" className="hover:text-rose-400 transition-colors flex items-center gap-1 group">
                  <span>Search Hotels</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-rose-400 transition-colors flex items-center gap-1 group">
                  <span>Special Offers & Deals</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-rose-400 transition-colors flex items-center gap-1 group">
                  <span>About BookMyRoom</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/support/tickets" className="hover:text-rose-400 transition-colors flex items-center gap-1 group">
                  <span>Contact Support</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* For Hotel Owners */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>For Hotel Owners</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to="/become-host" className="hover:text-teal-400 transition-colors flex items-center gap-1 group">
                  <span>List Your Hotel Property</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors flex items-center gap-1 group">
                  <span>Owner Portal Sign In</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/become-host" className="hover:text-teal-400 transition-colors flex items-center gap-1 group">
                  <span>Partner Benefits & Revenue Share</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/become-host" className="hover:text-teal-400 transition-colors flex items-center gap-1 group">
                  <span>Real-Time Inventory Management</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>Customer Care</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>CG Road, Navrangpura, Ahmedabad, Gujarat 380009</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+91 79 4000 8888 (24x7 Support)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>support@bookmyroom.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 BookMyRoom Platform. All rights reserved. Independent Hotel Booking System.</p>
          <div className="flex items-center gap-2 font-semibold">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>for seamless hotel booking experiences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
