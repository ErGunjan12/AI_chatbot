import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  SmilePlus,
  Clock,
  Headphones,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../../services/api';
import { AnalyticsData } from '../../types';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: data?.sentiment_distribution.positive || 1, color: '#10b981' },
    { name: 'Neutral', value: data?.sentiment_distribution.neutral || 1, color: '#6366f1' },
    { name: 'Negative', value: data?.sentiment_distribution.negative || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Deep-Dive Analytics & Sentiment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time sentiment classification, response latency, and inquiry volume timeseries.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg RAG Latency</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {data?.avg_response_time_ms || 185} ms
            </p>
            <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">High-speed retrieval</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Escalated Tickets</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {data?.total_tickets || 0}
            </p>
            <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
              {data?.open_tickets || 0} Open Tickets
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
            <SmilePlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Sentiment Score</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {data?.sentiment_distribution.positive || 0} Positive
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {data?.sentiment_distribution.negative || 0} Complaints Logged
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 14-day Volume Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Inquiry Volume Over Time
          </h3>
          <p className="text-xs text-slate-500 mb-6">Historical customer engagement metrics</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily_stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="total_questions" name="Customer Inquiries" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#areaColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Customer Sentiment
            </h3>
            <p className="text-xs text-slate-500 mb-4">Classified message tone distribution</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 text-center text-xs">
            <div>
              <p className="text-emerald-500 font-bold">{data?.sentiment_distribution.positive || 0}</p>
              <p className="text-[10px] text-slate-400">Positive</p>
            </div>
            <div>
              <p className="text-indigo-500 font-bold">{data?.sentiment_distribution.neutral || 0}</p>
              <p className="text-[10px] text-slate-400">Neutral</p>
            </div>
            <div>
              <p className="text-rose-500 font-bold">{data?.sentiment_distribution.negative || 0}</p>
              <p className="text-[10px] text-slate-400">Negative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
