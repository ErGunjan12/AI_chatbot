import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  ShieldCheck,
  Database,
  Sliders,
  CheckCircle2,
  Key,
  Layers,
  Save,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [similarityThreshold, setSimilarityThreshold] = useState(0.25);
  const [topK, setTopK] = useState(4);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-small');
  const [temperature, setTemperature] = useState(0.1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          System & RAG Engine Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure AI model parameters, hybrid retrieval thresholds, vector storage, and security guardrails.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>System configuration successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Retrieval & AI Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Model Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Cpu className="w-5 h-5 text-indigo-400" />
              LLM & Embeddings Model
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Generation Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                >
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Fast & Cost-Efficient)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (High Reasoning Capability)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy Compatible)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Vector Embedding Model</label>
                <select
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                >
                  <option value="text-embedding-3-small">text-embedding-3-small (1536 dim)</option>
                  <option value="text-embedding-3-large">text-embedding-3-large (3072 dim)</option>
                  <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Local Embeddings)</option>
                </select>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Temperature (Creativity vs Determinism)</span>
                <span className="font-mono text-indigo-400 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.7"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                Recommended: 0.1 for strict factual fidelity and zero fabrication.
              </p>
            </div>
          </div>

          {/* RAG Retrieval Hyperparameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-5 h-5 text-indigo-400" />
              Hybrid RAG Retrieval Hyperparameters
            </h3>

            {/* Similarity Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Minimum Grounding Similarity Score</span>
                <span className="font-mono text-indigo-400 font-bold">{similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                Chunks scoring below this threshold are discarded to prevent out-of-domain answers.
              </p>
            </div>

            {/* Top-K Reranking */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Cross-Encoder Reranked Context Limit (Top-K)</span>
                <span className="font-mono text-indigo-400 font-bold">{topK} chunks</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                Number of top reranked chunks provided to LLM for final grounded synthesis.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save RAG Hyperparameters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Infrastructure & Security */}
        <div className="space-y-6">
          {/* Engine Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Infrastructure Status
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">FastAPI Backend</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">ChromaDB Vectors</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Isolated Tenant Index
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">BM25 Engine</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Database Storage</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Persistent
                </span>
              </div>
            </div>
          </div>

          {/* Security & Isolation Guardrails */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Active Guardrails
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Strict Non-Hallucination:</strong> Chatbot answers only when retrieved evidence passes the relevance threshold.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Multi-Tenant Isolation:</strong> Vector collections & database records enforce query-level <code>business_id</code> partition locks.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Cross-Encoder Reranking:</strong> Filters spurious keyword matches before prompt injection.</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
