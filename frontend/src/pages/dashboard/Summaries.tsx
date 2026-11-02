import React, { useState, useEffect } from 'react';
import {
  FileStack,
  Sparkles,
  MessageSquare,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  Tag,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

interface ConversationItem {
  id: string;
  customer_id?: string;
  status: string;
  started_at: string;
  message_count: number;
  preview: string;
  messages: any[];
}

export const Summaries: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSummaries, setActiveSummaries] = useState<Record<string, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/conversations?limit=30');
      setConversations(res.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async (conversationId: string) => {
    setLoadingSummaryId(conversationId);
    try {
      const res = await api.get(`/dashboard/conversations/${conversationId}/summary`);
      setActiveSummaries((prev) => ({
        ...prev,
        [conversationId]: res.data.summary || 'Summary unavailable.',
      }));
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setActiveSummaries((prev) => ({
        ...prev,
        [conversationId]: 'Could not generate summary at this time.',
      }));
    } finally {
      setLoadingSummaryId(null);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.preview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileStack className="w-7 h-7 text-indigo-400" />
            AI Conversation Summaries
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated LLM summaries extracting customer intent, pain points, and discussion outcomes across sessions.
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter conversations by question or session ID..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Conversations Summary List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading conversation sessions...
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <FileStack className="w-10 h-10 mx-auto mb-2 text-indigo-400 opacity-30" />
          <p className="text-sm text-slate-400 font-medium">No customer conversations found.</p>
          <p className="text-xs text-slate-600 mt-1">
            When customers interact with your chatbot, sessions will appear here for automated summarization.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conv) => {
            const hasSummary = Boolean(activeSummaries[conv.id]);
            const isGenerating = loadingSummaryId === conv.id;

            return (
              <div
                key={conv.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-mono font-bold">
                      {conv.message_count}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate max-w-md">
                        {conv.preview || 'Customer Session'}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        ID: {conv.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {conv.started_at ? new Date(conv.started_at).toLocaleString() : 'Recent'}
                    </div>

                    {!hasSummary ? (
                      <button
                        onClick={() => handleGenerateSummary(conv.id)}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/20"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isGenerating ? 'Summarizing...' : 'Generate AI Summary'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateSummary(conv.id)}
                        disabled={isGenerating}
                        className="px-2.5 py-1 text-slate-400 hover:text-indigo-400 rounded text-xs flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Summary Content Box */}
                {hasSummary && (
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-slate-200 text-xs leading-relaxed space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Executive AI Session Summary</span>
                    </div>
                    <p className="whitespace-pre-wrap text-slate-300">
                      {activeSummaries[conv.id]}
                    </p>
                  </div>
                )}

                {/* Quick Message Trail Preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Recent Exchange Snippet
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-400 font-mono bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    {conv.messages.slice(-2).map((m, mIdx) => (
                      <div key={mIdx} className="truncate">
                        <span className={m.sender === 'customer' ? 'text-indigo-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {m.sender === 'customer' ? 'Customer: ' : 'Assistant: '}
                        </span>
                        <span className="text-slate-300">{m.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
