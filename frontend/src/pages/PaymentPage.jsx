import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Lock, ArrowLeft, RefreshCw, AlertOctagon, X, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const bookingIdFromUrl = searchParams.get('booking_id');

  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  // Payment Failure Modal State
  const [showFailModal, setShowFailModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [failureCode, setFailureCode] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (bookingIdFromUrl) {
      initiatePaymentOrder(bookingIdFromUrl);
    } else {
      setLoadingOrder(false);
    }
  }, [bookingIdFromUrl]);

  const initiatePaymentOrder = async (bId) => {
    setLoadingOrder(true);
    setShowFailModal(false);
    try {
      const res = await api.post('/payments/create-order/', { booking_id: bId });
      setPaymentOrder(res.data);
    } catch (err) {
      console.error('Failed to create Razorpay payment order:', err);
      const msg = err.response?.data?.error || 'Failed to initialize payment gateway order.';
      showToast(msg, 'error');
      setFailureMessage(msg);
      setFailureCode('ORDER_INIT_FAILED');
      setShowFailModal(true);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleOpenRazorpayCheckout = () => {
    if (!paymentOrder) {
      showToast('Payment order details not ready.', 'error');
      return;
    }

    if (!window.Razorpay) {
      const msg = 'Razorpay Checkout SDK script failed to load. Please check your internet connection.';
      showToast(msg, 'error');
      setFailureMessage(msg);
      setFailureCode('SDK_MISSING');
      setShowFailModal(true);
      return;
    }

    const options = {
      key: paymentOrder.key_id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: "BookMyRoom",
      description: `Stay Reservation - ${paymentOrder.booking_id}`,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80",
      order_id: paymentOrder.order_id,
      handler: async function (response) {
        // Razorpay successful checkout callback - Verify server-side signature
        setVerifying(true);
        try {
          const verifyRes = await api.post('/payments/verify/', {
            booking_id: paymentOrder.booking_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          showToast('Payment verified successfully! Reservation confirmed.');
          // Redirect directly to booking confirmation page with autoPrint flag enabled
          navigate(`/booking-confirmation/${verifyRes.data.booking_id}?autoPrint=true`);
        } catch (err) {
          console.error('Signature verification error:', err);
          const msg = err.response?.data?.error || 'Server-side payment verification failed. Security signature invalid.';
          showToast(msg, 'error');
          setFailureMessage(msg);
          setFailureCode('SIGNATURE_MISMATCH');
          setShowFailModal(true);
        } finally {
          setVerifying(false);
        }
      },
      prefill: {
        name: paymentOrder.customer?.name || user?.first_name || 'Guest User',
        email: paymentOrder.customer?.email || user?.email || '',
        contact: paymentOrder.customer?.phone || user?.phone_number || '9876543210',
      },
      notes: {
        booking_id: paymentOrder.booking_id,
      },
      theme: {
        color: '#0d9488',
      },
      modal: {
        ondismiss: function () {
          const msg = 'Payment checkout was cancelled or closed before completing transaction.';
          setFailureMessage(msg);
          setFailureCode('USER_CANCELLED');
          setShowFailModal(true);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment.failed event:', response);
        const reason = response.error?.description || 'Transaction declined by bank or card issuer.';
        const code = response.error?.code || 'PAYMENT_FAILED';
        setFailureMessage(reason);
        setFailureCode(code);
        setShowFailModal(true);
      });

      rzp.open();
    } catch (err) {
      console.error('Error opening Razorpay modal:', err);
      const msg = 'Could not launch Razorpay secure checkout window.';
      setFailureMessage(msg);
      setFailureCode('MODAL_LAUNCH_ERROR');
      setShowFailModal(true);
    }
  };

  const handleRetryPayment = async () => {
    if (!bookingIdFromUrl) return;
    setRetrying(true);
    try {
      const res = await api.post('/payments/retry/', { booking_id: bookingIdFromUrl });
      setPaymentOrder(res.data);
      setShowFailModal(false);
      setFailureMessage('');
      setFailureCode('');
      showToast('New Razorpay payment order generated. Retrying checkout...');
    } catch (err) {
      console.error('Retry order failed:', err);
      const msg = err.response?.data?.error || 'Failed to retry payment order.';
      showToast(msg, 'error');
    } finally {
      setRetrying(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-600">Initializing Razorpay Secure Gateway...</p>
        </div>
      </div>
    );
  }

  if (!bookingIdFromUrl || !paymentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="card-white p-8 max-w-md text-center space-y-4">
          <AlertOctagon className="w-14 h-14 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">No Active Checkout Session</h2>
          <p className="text-xs text-slate-500">Please select a hotel room reservation to initiate secure checkout.</p>
          <button onClick={() => navigate('/search')} className="btn-teal text-xs py-3 px-6 w-full font-bold">
            Browse Hotel Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-16 relative">
      
      {/* SSL Encryption Security Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-extrabold text-slate-600 hover:text-teal-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Back
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <Lock className="w-3.5 h-3.5 text-teal-600" /> Razorpay 256-Bit SSL Encrypted Verification
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        <div className="border-b border-slate-200 pb-4 text-center">
          <h1 className="text-3xl font-black text-slate-900">Razorpay Secure Checkout</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Complete your stay reservation payment safely using Razorpay gateway
          </p>
        </div>

        <div className="card-white p-8 border border-slate-200 shadow-xl space-y-6">
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold uppercase text-slate-500">Booking Code</span>
              <span className="text-sm font-black font-mono text-slate-900">{paymentOrder?.booking_id}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold uppercase text-slate-500">Razorpay Order ID</span>
              <span className="text-xs font-bold font-mono text-teal-700">{paymentOrder?.order_id}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold uppercase text-slate-500">Primary Guest</span>
              <span className="text-xs font-bold text-slate-900">{paymentOrder?.customer?.name}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-black uppercase text-slate-900">Total Amount Payable</span>
              <span className="text-2xl font-black text-teal-600">
                ₹{(paymentOrder?.amount / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <button
              onClick={handleOpenRazorpayCheckout}
              disabled={verifying}
              className="btn-teal w-full py-4 text-sm font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying HMAC Signature Server-Side...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ₹{(paymentOrder?.amount / 100).toFixed(2)} via Razorpay</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Supports UPI, Credit/Debit Cards, NetBanking, and Wallets with instant server verification.
            </p>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 🔴 PAYMENT FAILED POPUP MODAL (भुगतान विफल पॉपअप)      */}
      {/* ======================================================== */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-rose-600 to-red-600 p-6 text-white text-center relative">
              <button
                onClick={() => setShowFailModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 p-1.5 rounded-full transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-white text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <AlertOctagon className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Payment Failed!</h2>
              <p className="text-xs text-rose-100 font-medium mt-1">भुगतान प्रक्रिया विफल हो गई (Payment Not Completed)</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-center">
                <span className="text-[11px] font-extrabold uppercase text-rose-700 tracking-wider">Failure Reason / कारण:</span>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  {failureMessage || "Transaction was declined by bank or user closed payment window."}
                </p>
                {failureCode && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-mono text-[10px] font-bold">
                    CODE: {failureCode}
                  </span>
                )}
              </div>

              {/* Transaction Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Booking ID</span>
                  <span className="font-black font-mono text-slate-900">{paymentOrder?.booking_id || bookingIdFromUrl}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Order ID</span>
                  <span className="font-bold font-mono text-slate-700 truncate block">{paymentOrder?.order_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Amount Due</span>
                  <span className="font-black text-rose-600 text-sm">₹{(paymentOrder?.amount / 100).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Booking Status</span>
                  <span className="font-bold text-amber-600">Pending Payment</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-semibold text-center flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                No money will be deducted from your account. You can retry paying safely.
              </p>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="w-full btn-teal py-3.5 px-6 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30"
                >
                  {retrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating New Payment Session...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> Retry Payment Now (पुनः प्रयास करें)
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenRazorpayCheckout}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-colors"
                  >
                    Re-open Razorpay Modal
                  </button>

                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="w-full btn-dark py-2.5 px-4 text-xs font-extrabold"
                  >
                    View My Bookings
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentPage;
