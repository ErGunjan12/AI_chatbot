import React from 'react';
import { Shield, CheckCircle, Target, Award, Users } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Our Mission & Architecture
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            About AssistAI
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We are solving the fundamental flaw in modern conversational AI: hallucination in business-critical customer support.
          </p>
        </div>

        <div className="space-y-12">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Strict Non-Hallucination Guarantee</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When a customer asks about a price, delivery timeline, or refund policy, answering with guessed general information can cause serious customer dissatisfaction and legal liability. AssistAI introduces a strict evidence validation threshold: if retrieved business documents do not contain explicit facts, the assistant never guesses. Instead, it politely states that the information is unavailable and routes the query directly to human support.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Tenant Cryptographic Isolation</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every business registered on our platform is completely isolated. Vector embeddings are stored with strict business_id tenant filters, ensuring that no customer or search query can ever retrieve or see document chunks from another company.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hybrid Retrieval Engineering</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pure vector semantic search often misses exact SKUs, exact numerical prices, and specific policy codes. By combining BM25 keyword matching with ChromaDB vector search and Cross-Encoder reranking, our hybrid pipeline guarantees high accuracy across every query.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
