import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Shield,
  FileCheck2,
  Database,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  MessageSquare,
  Lock,
  Headphones,
  UploadCloud,
  Languages,
  Mic,
  TrendingUp,
  FileText
} from 'lucide-react';

export const Landing: React.FC = () => {
  const [demoInput, setDemoInput] = useState('');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    setDemoLoading(true);
    setDemoAnswer(null);

    setTimeout(() => {
      setDemoLoading(false);
      const lower = demoInput.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
        setDemoAnswer("Based on the uploaded pricing document: Our Pro plan is $199/month and includes 24/7 dedicated support, automated vector sync, and unlimited document processing.");
      } else if (lower.includes('refund') || lower.includes('return')) {
        setDemoAnswer("Based on the uploaded policy: We provide a 30-day money-back guarantee on all subscription plans. Simply email support to initiate a full refund.");
      } else {
        setDemoAnswer("I don't have this information in the available business documents. Please contact the business support team.");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(2,6,23,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Next-Gen Hybrid RAG Business Customer Support</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-tight mb-6">
              AI Chatbot Grounded Strictly in Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Business Documents
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Upload your FAQs, pricing tables, refund policies, and user manuals. Provide 24/7 instant AI support with <strong>zero hallucination</strong>. If facts are missing, it politely routes to human support.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Start Free Business Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition-all"
              >
                <span>Explore Architecture</span>
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Strict Source Grounding</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>PDF, DOCX & TXT Parsing</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multi-Tenant Data Isolation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Voice STT & Multilingual</span>
              </div>
            </div>
          </div>

          {/* Interactive Demo Preview Card */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
                  Live Grounding Simulator (Try Asking a Question)
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                Active Knowledge: TechCorp SLA & Refunds
              </span>
            </div>

            {/* Preset Query Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setDemoInput("What is your refund timeframe?")}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                "What is your refund timeframe?"
              </button>
              <button
                type="button"
                onClick={() => setDemoInput("How much does the Pro plan cost?")}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                "How much does the Pro plan cost?"
              </button>
              <button
                type="button"
                onClick={() => setDemoInput("Can you write a poem about flowers?")}
                className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-colors"
              >
                "Can you write a poem about flowers?" (Tests Fallback)
              </button>
            </div>

            <form onSubmit={handleDemoAsk} className="flex gap-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Ask something about TechCorp plans or try an unsupported question..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={demoLoading || !demoInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center space-x-1.5"
              >
                {demoLoading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <span>Ask AI</span>
                    <Bot className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {demoAnswer && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {demoAnswer}
                    </p>
                    {demoAnswer.includes("Based on the uploaded") && (
                      <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 font-semibold">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Source: refund_policy.txt (Page 1) — Grounding Score: 98%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Architectural Highlights */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Engineered with Enterprise-Grade Hybrid RAG
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard chatbots hallucinate and invent policies. AssistAI combines ChromaDB vector search with BM25 lexical keyword matching and Cross-Encoder reranking for surgical accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hybrid Result Fusion (RRF)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Fuses Sentence Transformers semantic vectors with BM25 Okapi keyword indices via Reciprocal Rank Fusion, capturing both conceptual meaning and exact part numbers/prices.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Agentic Query Router</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Classifies queries into Pricing, Refund Policies, Delivery Rules, or Business Details. Instantly filters out-of-domain prompt injection attempts before token processing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Strict Tenant Isolation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Multi-tenant architecture enforces strict business_id boundary filters on all database queries and vector indexes. Zero risk of cross-company data leakage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything Your Business Needs for AI Support
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              From automated knowledge base ingestion to live human ticket handoff and voice interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <UploadCloud className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Multi-Format Ingestion</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Upload PDF, DOCX, and TXT files with page-number metadata tracking.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Headphones className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Live Human Support</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Customers can request human assistance with 1-click email alerts to the owner.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Unanswered Question Log</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Tracks missing knowledge queries so owners can continuously update their KB.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Languages className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Multilingual Ready</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Responds in English, Hindi, and Marathi without distorting underlying business facts.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Mic className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Voice Chat & TTS</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Hands-free voice recognition and speech synthesis built right into the customer widget.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">AI Conversation Summaries</h4>
              <p className="text-xs text-slate-500 leading-relaxed">One-click AI executive summaries of customer interactions for owner review.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <FileText className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Instant CSV Export</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Export customer conversation logs and timeseries analytics in compliant CSV format.</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Lock className="w-5 h-5 text-indigo-500 mb-3" />
              <h4 className="text-sm font-bold mb-1.5">Custom Branding</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Configure chatbot brand colors, greetings, avatar, and shareable slug URL.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 to-violet-950 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Empower Your Business With Grounded AI Today
          </h2>
          <p className="text-indigo-200 text-sm max-w-xl mx-auto mb-8">
            Create your account in under 60 seconds, upload your documentation, and deploy your business chatbot instantly.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold shadow-lg transition-all hover:scale-105"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
