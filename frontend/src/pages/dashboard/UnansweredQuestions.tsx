import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  PlusCircle,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { UnansweredQuestion } from '../../types';

export const UnansweredQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [selectedQ, setSelectedQ] = useState<UnansweredQuestion | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/dashboard/unanswered-questions');
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to load unanswered questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleResolve = async (qId: string) => {
    setSaving(true);
    try {
      await api.put(`/dashboard/unanswered-questions/${qId}/resolve`, {
        resolution_notes: notes,
        status: 'resolved',
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, resolution_status: 'resolved', resolution_notes: notes } : q))
      );
      setSelectedQ(null);
      setNotes('');
    } catch (err) {
      alert('Failed to resolve question.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = questions.filter((q) => {
    const matchesFilter = filter === 'all' || q.resolution_status === filter;
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Unanswered Questions Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identifies questions where the AI fallback was triggered. Update your knowledge base to cover these queries.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {(['all', 'pending', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Questions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading unanswered questions...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No unanswered questions found under this filter. Your knowledge base is answering queries smoothly!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Question Asked by Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged At</th>
                  <th className="py-3 px-4">Resolution Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">
                      "{q.question}"
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          q.resolution_status === 'resolved'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {q.resolution_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {q.resolution_notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {q.resolution_status === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedQ(q);
                            setNotes('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors"
                        >
                          Resolve & Add Notes
                        </button>
                      ) : (
                        <span className="text-emerald-500 font-medium inline-flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selectedQ && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mark Question as Resolved
            </h3>
            <p className="text-xs text-slate-500">
              Customer Question: <strong>"{selectedQ.question}"</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resolution Notes (e.g., Added to FAQ document v2)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details on where this information was added..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQ(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleResolve(selectedQ.id)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {saving ? 'Saving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
