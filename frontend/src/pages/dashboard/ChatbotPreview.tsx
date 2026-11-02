import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ChatMessage, SourceDocumentReference } from '../../types';

export const ChatbotPreview: React.FC = () => {
  const { user } = useAuth();
  const businessSlug = user?.business_slug || 'demo';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      message: `Hello! I am your AI Knowledge Assistant. You are currently in the live owner testing environment. Ask any question to test grounded retrieval against your uploaded documents.`,
      answer_status: 'received',
      created_at: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => `preview_${Date.now()}`);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [retrievalMode, setRetrievalMode] = useState<'hybrid' | 'naive'>('hybrid');
  const [lastDebugInfo, setLastDebugInfo] = useState<{
    status?: string;
    sourcesCount?: number;
    responseTimeMs?: number;
    intent?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      sender: 'customer',
      message: userMsgText,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await api.post(`/chat/${businessSlug}/message`, {
        message: userMsgText,
        conversation_id: conversationId,
        language: selectedLanguage,
        is_voice: false
      });

      const data = response.data;
      const elapsed = Math.round(performance.now() - startTime);

      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        message: data.answer || data.message || "I don't have this information in the available business documents. Please contact the business support team.",
        source_documents: data.source_documents || [],
        answer_status: data.answer_status || 'grounded',
        sentiment: data.sentiment || 'neutral',
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastDebugInfo({
        status: data.answer_status,
        sourcesCount: (data.source_documents || []).length,
        responseTimeMs: elapsed,
        intent: data.intent || 'general_query'
      });
    } catch (err: any) {
      console.error('Chat preview error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          message: "I encountered an error retrieving knowledge. Please ensure your backend is active and documents are indexed.",
          answer_status: 'unanswered_fallback',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConversationId(`preview_${Date.now()}`);
    setMessages([
      {
        sender: 'assistant',
        message: `Conversation reset. Ready for a new test query against your business documents.`,
        answer_status: 'received',
        created_at: new Date().toISOString()
      }
    ]);
    setLastDebugInfo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-400" />
            AI Chatbot Live Testing Playground
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Test and evaluate real-time RAG responses, source document citations, and guardrails before customers use them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
            title="Reset conversation state"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Chat
          </button>
          <a
            href={`/chat/${businessSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-600/20 transition-all"
          >
            Open Public Chat
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Window - 3 Columns */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] shadow-xl overflow-hidden">
          {/* Chat Window Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">RAG Assistant Preview</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Hybrid Vector + BM25 Active
                </p>
              </div>
            </div>

            {/* Language & Pipeline toggles */}
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="en">English (EN)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="mr">Marathi (मराठी)</option>
              </select>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[80%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'customer'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                        : msg.answer_status === 'unanswered_fallback'
                        ? 'bg-amber-950/40 border border-amber-800/60 text-amber-100 rounded-bl-none'
                        : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Grounded Citations Badge */}
                  {msg.source_documents && msg.source_documents.length > 0 && (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sources Cited ({msg.source_documents.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.source_documents.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/60 border border-indigo-800/40 text-[11px] text-indigo-200"
                          >
                            <span className="font-medium truncate max-w-[140px]">{src.document_name}</span>
                            {src.page_number && (
                              <span className="text-slate-400">p.{src.page_number}</span>
                            )}
                            {src.similarity_score !== undefined && (
                              <span className="text-emerald-400 font-mono text-[10px]">
                                {(src.similarity_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounding Status badge */}
                  {msg.sender === 'assistant' && msg.answer_status && (
                    <div className="flex items-center gap-2 text-[11px]">
                      {msg.answer_status === 'grounded' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Grounded in Business Knowledge
                        </span>
                      ) : msg.answer_status === 'unanswered_fallback' ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Strict Fallback Triggered (No Hallucination)
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.sender === 'customer' && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Running Hybrid RAG retrieval...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/70 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question to test document retrieval..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Sidebar Diagnostics & Controls - 1 Column */}
        <div className="space-y-4">
          {/* Diagnostics Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Live RAG Diagnostics
            </h3>

            {lastDebugInfo ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Answer Status</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      lastDebugInfo.status === 'grounded'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {lastDebugInfo.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Sources Retrieved</span>
                  <span className="font-mono text-indigo-300 font-semibold">{lastDebugInfo.sourcesCount} chunks</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Query Intent</span>
                  <span className="font-mono text-slate-300">{lastDebugInfo.intent}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Pipeline Latency</span>
                  <span className="font-mono text-slate-200">{lastDebugInfo.responseTimeMs} ms</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Send a message to view live retrieval diagnostics, sources count, and pipeline latency.
              </p>
            )}
          </div>

          {/* Test Questions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Quick Test Prompts
            </h3>
            <p className="text-xs text-slate-400">
              Click any prompt below to test your knowledge base:
            </p>
            <div className="space-y-2">
              {[
                'What is your return and refund policy?',
                'How can I contact customer support?',
                'What are your pricing plans?',
                'What is the delivery timeline?',
                'Who was the 16th president of the USA?' // Hallucination test
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(query)}
                  className="w-full text-left text-xs text-slate-300 hover:text-indigo-300 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors line-clamp-2"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>

          {/* Architecture note */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-indigo-200">
              <Layers className="w-3.5 h-3.5" />
              Strict Grounding Enabled
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If an answer is not in the uploaded documents, the bot guarantees it will not hallucinate and will trigger the standard fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
