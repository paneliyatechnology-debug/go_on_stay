import React from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, ShieldCheck, Tag, CheckCircle2, Award, Users, Building2,
  Lock, Sparkles, Clock, ArrowRight, Heart, Star, PhoneCall
} from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-20">
      
      {/* Hero Header Banner */}
      <section className="relative py-16 bg-gradient-to-b from-teal-50/80 via-white to-slate-50 border-b border-slate-200 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Discover BookMyRoom
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            About <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 bg-clip-text text-transparent">BookMyRoom</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            BookMyRoom is an independent luxury & boutique hotel reservation platform designed to connect travelers directly with hotel owners and property hosts with total pricing transparency.
          </p>
        </div>
      </section>

      {/* Main Why Book With BookMyRoom Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest block">Core Platform Value</span>
          <h2 className="text-3xl font-black text-slate-900">Why Book With BookMyRoom?</h2>
          <p className="text-xs sm:text-sm text-slate-500">Direct booking advantages built for seamless hospitality & total pricing transparency</p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          <div className="card-white p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-2 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">100% Real-Time Availability</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our date-overlap backend calculation ensures rooms displayed are guaranteed available for your selected check-in and check-out dates without double-booking risk.
            </p>
          </div>

          <div className="card-white p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-2 shadow-xs">
              <Tag className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Direct Owner Pricing</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              No middleman price inflation. Hotel owners update room prices directly with complete tax breakdowns, clear nightly rates, and promotional coupon discounts.
            </p>
          </div>

          <div className="card-white p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-2 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Verified Payment Signature</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Razorpay integration with backend HMAC SHA256 signature verification guarantees 100% payment safety, instant receipt generation, and confirmation emails.
            </p>
          </div>

        </div>

        {/* Additional Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="card-white p-8 flex items-start gap-5 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-slate-900">Enterprise Security & Privacy</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Your credentials and payment data are protected using TLS encryption, secure authentication tokens, and server-side payment verification mechanisms.
              </p>
            </div>
          </div>

          <div className="card-white p-8 flex items-start gap-5 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-slate-900">Instant Check-in Vouchers</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Immediately receive a verified digital voucher with unique booking ID upon successful payment verification to present at hotel check-in desk.
              </p>
            </div>
          </div>
        </div>

        {/* Live Platform Stats */}
        <div className="card-white p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="p-4 space-y-1">
              <h4 className="text-3xl font-black text-teal-400">100+</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Hotels</p>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-3xl font-black text-teal-400">5,000+</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booked Nights</p>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-3xl font-black text-teal-400">4.8 ★</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guest Rating</p>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-3xl font-black text-teal-400">24 / 7</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Support</p>
            </div>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="card-white p-10 text-center space-y-6 bg-teal-50/60 border border-teal-200 rounded-3xl">
          <h3 className="text-2xl font-black text-slate-900">Ready to Book Your Next Stay?</h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto font-medium">
            Explore handpicked hotels across top Indian destinations with direct owner pricing and instant confirmation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/search" className="btn-teal py-3 px-8 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-teal-600/30">
              Browse All Hotels <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="btn-dark py-3 px-8 text-xs font-extrabold uppercase tracking-wider">
              List Your Hotel Property
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
};

export default AboutUs;
