import React from 'react';
import { UploadCloud, Layers, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload Business Documentation',
      desc: 'Upload your company documents in PDF, DOCX, or TXT formats. Our pipeline cleans control characters, parses tables, and preserves structural page numbers.',
      icon: UploadCloud
    },
    {
      step: '02',
      title: 'Semantic Chunking & Embedding Generation',
      desc: 'Extracted text is split into overlapping semantic chunks with tenant metadata. Embeddings are persistently indexed in ChromaDB alongside a BM25 lexical keyword index.',
      icon: Layers
    },
    {
      step: '03',
      title: 'Agentic Query Routing & Hybrid Retrieval',
      desc: 'When a customer submits a query, our Agentic Router categorizes the intent (Pricing, Refunds, SLA). Both Semantic Vector Search and BM25 Okapi are queried in parallel.',
      icon: Cpu
    },
    {
      step: '04',
      title: 'Cross-Encoder Reranking & Evidence Validation',
      desc: 'Candidate passages are reranked based on content token density. If the maximum relevance score is below threshold, the system triggers the polite fallback instead of guessing.',
      icon: ShieldAlert
    },
    {
      step: '05',
      title: 'Grounded Answer Generation & Source Attribution',
      desc: 'The LLM receives strictly retrieved context. It generates an accurate answer accompanied by verified document citations and suggested follow-ups.',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Pipeline Architecture
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            How Hybrid RAG Works
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Follow the lifecycle of an inquiry from document ingestion to verified customer response.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start space-x-5 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base flex-shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                  <span>{s.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
