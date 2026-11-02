import React from 'react';
import {
  Layers,
  FileCheck2,
  Cpu,
  Mic,
  Headphones,
  Languages,
  TrendingUp,
  FileSpreadsheet,
  Palette,
  ShieldCheck,
  Search,
  MessageSquare
} from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: Layers,
      title: 'Hybrid Retrieval Engine',
      desc: 'Seamlessly blends Dense Semantic Vector Search (ChromaDB) with BM25 Lexical Keyword Search for exact match precision on prices, policies, and product SKUs.'
    },
    {
      icon: Cpu,
      title: 'Cross-Encoder Reranking',
      desc: 'Applies deep passage reranking on candidate chunks to filter out stop-word noise and rank the highest relevance context directly for LLM generation.'
    },
    {
      icon: FileCheck2,
      title: 'Explicit Source Attribution',
      desc: 'Every grounded answer includes clickable document references with file names, page numbers, and similarity metrics so customers can verify facts.'
    },
    {
      icon: ShieldCheck,
      title: 'Zero Hallucination Guardrails',
      desc: 'Rigid prompt instructions and similarity thresholds ensure the AI never invents dates, policies, or prices. Unknown questions trigger immediate human fallback.'
    },
    {
      icon: Languages,
      title: 'Native Multilingual Support',
      desc: 'Customers can converse in English, Hindi, and Marathi. The AI translates questions, retrieves original documents, and responds accurately in the target language.'
    },
    {
      icon: Mic,
      title: 'Voice-Based Interaction',
      desc: 'Integrated Speech-to-Text (STT) and Text-to-Speech (TTS) using modern Web Speech APIs for hands-free voice assistance.'
    },
    {
      icon: Headphones,
      title: 'Live Human Support Tickets',
      desc: 'When queries require human review, customers can submit support tickets directly from the chat. Business owners receive instant email notifications.'
    },
    {
      icon: TrendingUp,
      title: 'Sentiment & Usage Analytics',
      desc: 'Track total conversations, success rates, satisfaction scores, and customer sentiment distribution (positive, neutral, negative) in real-time.'
    },
    {
      icon: Search,
      title: 'Unanswered Question Tracker',
      desc: 'Captures and surfaces questions that the knowledge base could not answer, helping owners identify and fill knowledge gaps easily.'
    },
    {
      icon: Palette,
      title: 'Full Chatbot Customization',
      desc: 'Customize chatbot name, avatar logo, brand colors, greeting messages, and supported languages to match your corporate identity.'
    },
    {
      icon: FileSpreadsheet,
      title: 'One-Click CSV Data Export',
      desc: 'Export complete conversation transcripts and 14-day analytics timeseries into industry-standard CSV files for compliance and offline analysis.'
    },
    {
      icon: MessageSquare,
      title: 'Smart Suggested Follow-ups',
      desc: 'Automatically extracts logical follow-up questions from business documents to guide customers towards fast resolutions.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Capabilities
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            Comprehensive Enterprise Feature Suite
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Engineered from the ground up for high reliability, accuracy, and multi-tenant security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
