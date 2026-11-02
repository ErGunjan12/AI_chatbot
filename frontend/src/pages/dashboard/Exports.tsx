import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  MessageSquare,
  BarChart3,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Exports: React.FC = () => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async (type: 'conversations' | 'analytics' | 'unanswered', filename: string) => {
    setDownloading(type);
    setErrorMsg(null);
    setDownloadSuccess(null);

    try {
      const response = await api.get(`/export/${type}`, {
        responseType: 'blob',
      });

      // Create download anchor
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(type);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      console.error(`Export ${type} failed:`, err);
      setErrorMsg(`Failed to generate ${type} export. Please ensure the backend is running.`);
    } finally {
      setDownloading(null);
    }
  };

  const exportOptions = [
    {
      id: 'conversations' as const,
      title: 'Complete Chat Records CSV',
      description: 'Export all customer interactions, user messages, AI responses, ground status (grounded/fallback), sentiment tags, and timestamps.',
      icon: MessageSquare,
      filename: `conversations_${user?.business_slug || 'records'}.csv`,
      color: 'indigo'
    },
    {
      id: 'analytics' as const,
      title: 'Daily Performance & Metrics CSV',
      description: 'Export daily aggregated stats including total chat sessions, questions asked, grounded answer counts, unanswered rates, and satisfaction.',
      icon: BarChart3,
      filename: `analytics_report_${user?.business_slug || 'metrics'}.csv`,
      color: 'emerald'
    },
    {
      id: 'unanswered' as const,
      title: 'Unanswered Questions Log CSV',
      description: 'Export customer queries that had no matching business documentation, along with resolution statuses and owner notes.',
      icon: HelpCircle,
      filename: `unanswered_questions_${user?.business_slug || 'queries'}.csv`,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Download className="w-7 h-7 text-indigo-400" />
          Data & Chat Exports Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Download complete conversation history, performance reports, and unanswered queries in CSV format for offline reporting and compliance.
        </p>
      </div>

      {/* Status alerts */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>File downloaded successfully to your computer!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exportOptions.map((opt) => {
          const Icon = opt.icon;
          const isCurrentLoading = downloading === opt.id;

          return (
            <div
              key={opt.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{opt.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {opt.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Format: CSV</span>
                  <span>Tenant: {user?.business_slug}</span>
                </div>

                <button
                  onClick={() => handleDownload(opt.id, opt.filename)}
                  disabled={Boolean(downloading)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  {isCurrentLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating CSV...</span>
                    </div>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Download {opt.id.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance / Privacy Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <h4 className="text-slate-200 font-semibold">Tenant Data Isolation Guarantee</h4>
          <p>
            Exports are strictly scoped to business ID <code className="text-indigo-300 font-mono">{user?.business_id}</code>.
            Customer conversation data from other businesses is strictly quarantined at database and retrieval levels.
          </p>
        </div>
      </div>
    </div>
  );
};
