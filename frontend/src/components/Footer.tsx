import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Shield, Cpu, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">AssistAI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Business Knowledge-Based AI Chatbot powered by Hybrid RAG, BM25, and strict non-hallucination guardrails.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="inline-flex items-center text-emerald-400">
                <Shield className="w-3.5 h-3.5 mr-1" /> Multi-Tenant Isolated
              </span>
              <span className="inline-flex items-center text-indigo-400">
                <Cpu className="w-3.5 h-3.5 mr-1" /> Hybrid RAG Engine
              </span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/features" className="hover:text-white transition-colors">Features & Capabilities</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How RAG Works</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Owner Dashboard</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Start Free Trial</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-white transition-colors">About AssistAI</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Data Privacy & Security</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Enterprise Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Enterprise Security</h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Every business knowledge base is strictly partitioned with tenant-level vector filters. Customer queries never leak across companies.
            </p>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center space-x-2 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>AES-256 Vector & Chunk Isolation</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AssistAI Technologies Inc. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Engineered with high-reliability Hybrid RAG
          </p>
        </div>
      </div>
    </footer>
  );
};
