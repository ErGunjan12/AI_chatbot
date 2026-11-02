import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Star,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Bot
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../../services/api';
import { DashboardOverview as IDashboardOverview, AnalyticsData } from '../../types';

export const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<IDashboardOverview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const [ovRes, anRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/analytics'),
      ]);
      setData(ovRes.data);
      setAnalytics(anRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading business analytics...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Conversations',
      value: data?.total_conversations || 0,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-100 dark:border-indigo-900/60',
    },
    {
      label: 'Customer Questions',
      value: data?.total_questions || 0,
      icon: HelpCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-100 dark:border-blue-900/60',
    },
    {
      label: 'Answered Questions',
      value: data?.answered_questions || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-100 dark:border-emerald-900/60',
    },
    {
      label: 'Unanswered Questions',
      value: data?.unanswered_questions || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-100 dark:border-amber-900/60',
    },
    {
      label: 'Answer Success Rate',
      value: `${data?.answer_success_rate || 100}%`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/60',
      border: 'border-violet-100 dark:border-violet-900/60',
    },
    {
      label: 'Customer Satisfaction',
      value: `${data?.customer_satisfaction_avg || 5.0} / 5`,
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-100 dark:border-amber-900/60',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hybrid RAG Grounding Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Business Overview & RAG Metrics</h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Real-time tracking of customer questions, document grounding, and unanswered gaps.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
            <p className="text-xs text-indigo-200">Indexed Docs</p>
            <p className="text-lg font-bold">{data?.total_documents || 0}</p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-white dark:bg-slate-900 border ${kpi.border} shadow-sm transition-all hover:shadow-md`}
          >
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {kpi.label}
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Inquiries Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Conversation & Question Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">14-Day Activity Timeseries</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.daily_stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                <Area type="monotone" dataKey="total_chats" name="Chats" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorChats)" />
                <Area type="monotone" dataKey="total_questions" name="Questions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQuestions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Answer Grounding vs Fallback Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Answered vs Unanswered Fallbacks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Knowledge Base Coverage Effectiveness</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.daily_stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="answered_count" name="Answered (Grounded)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unanswered_count" name="Fallback (Missing)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: FAQs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequently Asked Questions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Most Frequently Asked Questions</span>
            </h3>
            <span className="text-xs text-slate-400">Aggregated</span>
          </div>

          <div className="space-y-3">
            {data?.frequently_asked_questions && data.frequently_asked_questions.length > 0 ? (
              data.frequently_asked_questions.map((faq, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate pr-3">
                    "{faq.question}"
                  </p>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold whitespace-nowrap">
                    {faq.count} {faq.count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No customer questions recorded yet. Share your public link to start receiving inquiries!
              </div>
            )}
          </div>
        </div>

        {/* Recent Knowledge Base Uploads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Recent Document Uploads</span>
            </h3>
            <a href="/dashboard/knowledge-base" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage All
            </a>
          </div>

          <div className="space-y-3">
            {data?.recent_documents && data.recent_documents.length > 0 ? (
              data.recent_documents.map((doc: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {doc.file_type}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {doc.filename}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {doc.chunk_count} chunks indexed • {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    {doc.file_status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No documents uploaded yet. Upload your PDF or DOCX files in Knowledge Base.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
