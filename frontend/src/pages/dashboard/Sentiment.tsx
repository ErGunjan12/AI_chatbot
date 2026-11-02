import React, { useState, useEffect } from 'react';
import {
  SmilePlus,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';

interface SentimentReport {
  total_analyzed: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  percentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  flagged_negative_queries: Array<{
    id: string;
    conversation_id: string;
    message: string;
    created_at: string;
  }>;
}

export const Sentiment: React.FC = () => {
  const [data, setData] = useState<SentimentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/sentiment');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sentiment report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const positivePct = data?.percentages?.positive || 0;
  const neutralPct = data?.percentages?.neutral || 0;
  const negativePct = data?.percentages?.negative || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SmilePlus className="w-7 h-7 text-indigo-400" />
            Customer Sentiment Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time natural language sentiment classification analyzing customer satisfaction and emotional tone.
          </p>
        </div>
        <button
          onClick={fetchSentimentData}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Analysis
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{positivePct}%</div>
            <div className="text-xs text-slate-400">Positive Interactions ({data?.distribution?.positive || 0})</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
            <Meh className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{neutralPct}%</div>
            <div className="text-xs text-slate-400">Neutral Queries ({data?.distribution?.neutral || 0})</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Frown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{negativePct}%</div>
            <div className="text-xs text-slate-400">Negative / Frustrated ({data?.distribution?.negative || 0})</div>
          </div>
        </div>
      </div>

      {/* Distribution Progress Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-semibold text-white">Emotional Sentiment Breakdown</h3>
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${positivePct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Positive: ${positivePct}%`}
          />
          <div
            style={{ width: `${neutralPct}%` }}
            className="bg-slate-500 transition-all duration-500"
            title={`Neutral: ${neutralPct}%`}
          />
          <div
            style={{ width: `${negativePct}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Negative: ${negativePct}%`}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Positive ({positivePct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            Neutral ({neutralPct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Negative ({negativePct}%)
          </span>
        </div>
      </div>

      {/* Flagged Inquiries Needing Attention */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">
              Flagged Inquiries (Urgent Support Attention)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {data?.flagged_negative_queries?.length || 0} flagged
          </span>
        </div>

        {(!data?.flagged_negative_queries || data.flagged_negative_queries.length === 0) ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            <Smile className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-40" />
            <p className="font-medium text-slate-300">No frustrated or negative interactions detected!</p>
            <p className="text-xs text-slate-500 mt-1">Customer tone remains overwhelmingly positive and neutral.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.flagged_negative_queries.map((q) => (
              <div
                key={q.id}
                className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-[10px] font-semibold uppercase">
                      Negative Tone
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Session: {q.conversation_id.slice(0, 16)}...
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium">"{q.message}"</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5" />
                  {q.created_at ? new Date(q.created_at).toLocaleString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
