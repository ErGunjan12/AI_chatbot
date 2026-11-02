import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  Star,
  MessageSquare,
  Filter,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { CustomerFeedback } from '../../types';

export const Feedback: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/dashboard/feedback');
      setFeedbackList(response.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalReviews = feedbackList.length;
  const avgRating =
    totalReviews > 0
      ? (feedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  const ratingCounts = {
    5: feedbackList.filter((f) => f.rating === 5).length,
    4: feedbackList.filter((f) => f.rating === 4).length,
    3: feedbackList.filter((f) => f.rating === 3).length,
    2: feedbackList.filter((f) => f.rating === 2).length,
    1: feedbackList.filter((f) => f.rating === 1).length,
  };

  const filteredItems =
    filterRating === 'all'
      ? feedbackList
      : feedbackList.filter((f) => f.rating === filterRating);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ThumbsUp className="w-7 h-7 text-indigo-400" />
            Customer Feedback & Ratings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real customer satisfaction ratings and feedback collected at the end of chatbot conversations.
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
        >
          Refresh Feedbacks
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
              {avgRating} <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <div className="text-xs text-slate-400">Average Customer Rating</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalReviews}</div>
            <div className="text-xs text-slate-400">Total Feedback Submissions</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {totalReviews > 0
                ? `${Math.round(((ratingCounts[5] + ratingCounts[4]) / totalReviews) * 100)}%`
                : '100%'}
            </div>
            <div className="text-xs text-slate-400">Positive Experience Ratio (4-5★)</div>
          </div>
        </div>
      </div>

      {/* Breakdown and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="w-4 h-4 text-indigo-400" />
            Filter by Star Rating
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterRating === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All ({totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  filterRating === r
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{r}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] text-slate-400">
                  ({ratingCounts[r as keyof typeof ratingCounts] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading customer feedback...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <ThumbsUp className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
            <p className="text-sm font-medium">No feedback recorded for this filter yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Feedback submitted by customers on the public chat interface will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= item.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {item.rating} / 5 Stars
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Session: {item.conversation_id.slice(0, 14)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-200 mt-1">
                  {item.comment ? `"${item.comment}"` : <span className="text-slate-500 italic">No written comment provided.</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
