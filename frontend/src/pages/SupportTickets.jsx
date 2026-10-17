import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Plus, MessageSquare, Send, CheckCircle2, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SupportTickets = () => {
  const { user, showToast } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('BOOKING');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');

  // Reply State
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/support-tickets/');
      const list = res.data.results || res.data;
      setTickets(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      showToast('Failed to load support tickets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments/support-tickets/', {
        subject: newSubject,
        category: newCategory,
        priority: newPriority,
        description: newDescription,
      });
      showToast('Support ticket submitted successfully!');
      setShowNewModal(false);
      setNewSubject('');
      setNewDescription('');
      fetchTickets();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit ticket.';
      showToast(msg, 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    try {
      const res = await api.post(`/payments/support-tickets/${selectedTicket.id}/reply/`, {
        message: replyMessage,
      });
      showToast('Reply sent!');
      setReplyMessage('');
      // Update selected ticket in state
      const updated = res.data.ticket;
      setSelectedTicket(updated);
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      showToast('Failed to send reply.', 'error');
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Customer Support Center
            </div>
            <h1 className="text-3xl font-black text-slate-900">Help & Support Tickets</h1>
            <p className="text-xs text-slate-500 font-semibold">Get resolution for booking issues, payment queries, cancellation assistance, and refunds</p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-teal py-3 px-5 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-teal-600/25"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create New Ticket
          </button>
        </div>

        {/* Content Layout */}
        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading support ticket threads...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Support Tickets Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You don't have any open support tickets. Need help with a booking or payment? Click below to submit a inquiry!
            </p>
            <button onClick={() => setShowNewModal(true)} className="btn-teal py-2.5 px-6 text-xs inline-flex">
              <Plus className="w-4 h-4" /> Open Support Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Ticket List Sidebar */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">Your Tickets</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-white shadow-md ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{t.ticket_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          t.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">Category: {t.category}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation Details Panel */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <div className="card-white p-6 border border-slate-200 shadow-md space-y-6">
                  
                  {/* Ticket Header */}
                  <div className="border-b border-slate-100 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-teal-600">Ticket #{selectedTicket.ticket_number}</span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Created: {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">{selectedTicket.category}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{selectedTicket.priority} Priority</span>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
                    
                    {/* Initial Description */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span className="text-slate-900 font-black">{selectedTicket.user_name || 'Customer'}</span>
                        <span>{new Date(selectedTicket.created_at).toLocaleTimeString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{selectedTicket.description}</p>
                    </div>

                    {/* Replies */}
                    {selectedTicket.messages?.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl space-y-1 ${
                          m.is_staff_reply
                            ? 'bg-teal-50 border border-teal-200/80 ml-6'
                            : 'bg-white border border-slate-200 mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className={m.is_staff_reply ? 'text-teal-800 font-black flex items-center gap-1' : 'text-slate-900 font-black'}>
                            {m.is_staff_reply && <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                            {m.sender_name}
                          </span>
                          <span>{new Date(m.created_at).toLocaleTimeString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{m.message}</p>
                      </div>
                    ))}

                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply message..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:border-teal-600 outline-none"
                    />
                    <button type="submit" className="btn-teal py-2.5 px-5 text-xs font-extrabold flex items-center gap-1">
                      <Send className="w-3.5 h-3.5" /> Send Reply
                    </button>
                  </form>

                </div>
              ) : (
                <div className="card-white p-12 text-center text-slate-400 font-bold">
                  Select a support ticket thread on the left to view conversation.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Create Ticket Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
              <h3 className="text-xl font-black text-slate-900">Create Support Ticket</h3>
              
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief summary of your inquiry..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600"
                    >
                      <option value="BOOKING">Booking Issue</option>
                      <option value="PAYMENT">Payment & Refund</option>
                      <option value="CANCELLATION">Cancellation Request</option>
                      <option value="HOTEL">Hotel Facilities</option>
                      <option value="TECHNICAL">Technical Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent Assistance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-teal-600"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-teal py-2 px-5 text-xs font-extrabold">
                    Submit Ticket
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

export default SupportTickets;
