import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Sparkles,
  FileCheck2,
  Clock,
  HelpCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';

export const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await api.get('/dashboard/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !selectedConv) {
        setSelectedConv(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleGenerateSummary = async (convId: string) => {
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await api.get(`/dashboard/conversations/${convId}/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      alert('Failed to generate summary.');
    } finally {
      setSummarizing(false);
    }
  };

  const filtered = conversations.filter((c) =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.preview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Customer Conversations & History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit customer questions, verify retrieved document evidence, and generate instant AI summaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left: Conversation List */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversation text..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading chat history...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No conversations found.</div>
            ) : (
              filtered.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConv(c);
                      setSummary(null);
                    }}
                    className={`w-full text-left p-4 transition-colors flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                        Session {c.id.slice(0, 8)}...
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.started_at ? new Date(c.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {c.preview}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span>{c.message_count} messages</span>
                      <span>•</span>
                      <span className="capitalize">{c.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* Top details bar */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Thread ID: {selectedConv.id}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Customer: {selectedConv.customer_id}
                  </p>
                </div>
                <button
                  onClick={() => handleGenerateSummary(selectedConv.id)}
                  disabled={summarizing}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{summarizing ? 'Analyzing...' : 'AI Summary'}</span>
                </button>
              </div>

              {/* AI Summary Banner */}
              {summary && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/70 border-b border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                  <div className="flex items-center space-x-1.5 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>AI Executive Conversation Summary</span>
                  </div>
                  <p className="leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Message Bubbles */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[480px]">
                {selectedConv.messages?.map((m: any, idx: number) => {
                  const isAssistant = m.sender === 'assistant';
                  return (
                    <div
                      key={idx}
                      className={`flex items-start space-x-2.5 ${
                        isAssistant ? '' : 'flex-row-reverse space-x-reverse'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                          isAssistant
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className={`max-w-[80%] space-y-1.5`}>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isAssistant
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                              : 'bg-indigo-600 text-white rounded-tr-none'
                          }`}
                        >
                          {m.message}
                        </div>

                        {/* Grounding & Source references */}
                        {isAssistant && m.source_documents && m.source_documents.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Retrieved Sources:
                            </span>
                            {m.source_documents.map((s: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="text-[10px] p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                <span className="font-semibold">{s.document_name}</span>
                                <span>(Page {s.page_number || 1})</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isAssistant && m.answer_status === 'unanswered_fallback' && (
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
                            Missing in KB (Fallback Triggered)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="m-auto text-center py-24 text-xs text-slate-400">
              Select a conversation thread to view message history and source attributions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
