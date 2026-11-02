import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Mail,
  User,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Filter,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { SupportTicket } from '../../types';

export const LiveSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data);
      if (res.data.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicket = async (newStatus?: string) => {
    if (!selectedTicket) return;
    setUpdating(true);

    try {
      const payload: any = {};
      if (newStatus) payload.status = newStatus;
      if (replyText.trim()) payload.owner_reply = replyText.trim();

      const res = await api.put(`/support/tickets/${selectedTicket.id}`, payload);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? res.data : t)));
      setSelectedTicket(res.data);
      setReplyText('');
    } catch (err) {
      alert('Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Live Human Support Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Escalated customer support requests submitted via chatbot widget when inquiries need human intervention.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Ticket List */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading support tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No tickets found.</div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setReplyText('');
                    }}
                    className={`w-full text-left p-4 transition-colors flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {t.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          t.status === 'open'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {t.message}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span>From: {t.customer_name || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Details & Reply Box */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              {/* Top details */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span>From: <strong>{selectedTicket.customer_name}</strong></span>
                    {selectedTicket.customer_email && (
                      <span>({selectedTicket.customer_email})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Message
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>

                {selectedTicket.owner_reply && (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Your Business Response
                    </span>
                    <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.owner_reply}
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reply to Customer
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official support answer or status update..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateTicket()}
                    disabled={updating || !replyText.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center py-24 text-xs text-slate-400">
              Select a support ticket to review inquiry and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
