import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Star,
  Globe,
  Bot,
  User,
  ExternalLink,
  X,
  ThumbsUp
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, SourceDocumentReference } from '../types';

interface BusinessChatInfo {
  business_name: string;
  business_slug: string;
  description?: string;
  logo?: string;
  chatbot_name: string;
  welcome_message: string;
  theme_color: string;
  greeting_text: string;
  supported_languages: string[];
  enable_voice: boolean;
  enable_suggestions: boolean;
}

export const CustomerChat: React.FC = () => {
  const { business_slug } = useParams<{ business_slug: string }>();
  const slug = business_slug || 'demo';

  // State
  const [bizInfo, setBizInfo] = useState<BusinessChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Session
  const [conversationId] = useState<string>(() => {
    const saved = sessionStorage.getItem(`chat_session_${slug}`);
    if (saved) return saved;
    const newId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem(`chat_session_${slug}`, newId);
    return newId;
  });

  // Multilingual
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Suggested questions
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Speech Recognition (STT)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech Synthesis (TTS)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);

  // Human Support Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech synthesis when unmounting
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const fetchInitialData = async () => {
    setIsInitializing(true);
    setErrorBanner(null);

    try {
      // 1. Fetch business branding and config
      const infoRes = await api.get(`/chat/${slug}/info`);
      const info: BusinessChatInfo = infoRes.data;
      setBizInfo(info);

      // Set initial welcome message
      setMessages([
        {
          sender: 'assistant',
          message: info.welcome_message || `Hello! How can I assist you with ${info.business_name} today?`,
          answer_status: 'received',
          created_at: new Date().toISOString()
        }
      ]);

      // 2. Fetch suggested questions
      if (info.enable_suggestions !== false) {
        try {
          const suggRes = await api.get(`/chat/${slug}/suggested-questions`);
          if (suggRes.data?.questions) {
            setSuggestedQuestions(suggRes.data.questions);
          }
        } catch (e) {
          console.warn('Suggested questions unavailable:', e);
        }
      }
    } catch (err: any) {
      console.error('Failed to load chatbot info:', err);
      setErrorBanner('Unable to load business assistant. Please check the URL or try again later.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    if (!customText) setInputText('');

    const newMsg: ChatMessage = {
      sender: 'customer',
      message: userText,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const response = await api.post(`/chat/${slug}/message`, {
        message: userText,
        conversation_id: conversationId,
        language: selectedLanguage,
        is_voice: false
      });

      const data = response.data;
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        message: data.answer || data.message || "I don't have this information in the available business documents. Please contact the business support team.",
        source_documents: data.source_documents || [],
        answer_status: data.answer_status || 'grounded',
        sentiment: data.sentiment || 'neutral',
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          message: "I don't have this information in the available business documents. Please contact the business support team.",
          answer_status: 'unanswered_fallback',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API: STT (Speech-to-Text)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select speech language code
      if (selectedLanguage === 'hi') recognition.lang = 'hi-IN';
      else if (selectedLanguage === 'mr') recognition.lang = 'mr-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition initiation error:', err);
      setIsListening(false);
    }
  };

  // Web Speech API: TTS (Text-to-Speech)
  const speakMessage = (text: string, msgIdx: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    if (speakingMsgIdx === msgIdx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
    else if (selectedLanguage === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(msgIdx);
    window.speechSynthesis.speak(utterance);
  };

  // Submit Human Support Ticket
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;

    setSupportSubmitting(true);
    try {
      await api.post('/support/tickets', {
        conversation_id: conversationId,
        business_slug: slug,
        customer_name: supportName || 'Customer',
        customer_email: supportEmail || undefined,
        subject: supportSubject,
        message: supportMessage
      });

      setSupportSubmitted(true);
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSubmitted(false);
        setSupportSubject('');
        setSupportMessage('');
      }, 2500);
    } catch (err) {
      console.error('Support ticket creation error:', err);
      alert('Could not submit support request. Please try again.');
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/chat/${slug}/feedback`, {
        conversation_id: conversationId,
        rating: feedbackRating,
        comment: feedbackComment
      });

      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSubmitted(false);
        setFeedbackComment('');
      }, 2000);
    } catch (err) {
      console.error('Feedback submit error:', err);
    }
  };

  // Download Transcript
  const downloadTranscript = () => {
    const lines = messages.map((m) => {
      const sender = m.sender === 'customer' ? 'Customer' : bizInfo?.chatbot_name || 'Assistant';
      const time = m.created_at ? new Date(m.created_at).toLocaleTimeString() : '';
      return `[${time}] ${sender}:\n${m.message}\n`;
    });

    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${slug}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-semibold">Connecting to Business Assistant...</h2>
        <p className="text-xs text-slate-400 mt-1">Preparing verified document knowledge base</p>
      </div>
    );
  }

  if (errorBanner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Assistant Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{errorBanner}</p>
        <button
          onClick={fetchInitialData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const themeColor = bizInfo?.theme_color || '#4f46e5';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {bizInfo?.logo ? (
            <img
              src={bizInfo.logo}
              alt={bizInfo.business_name}
              className="w-10 h-10 rounded-xl object-contain bg-slate-800 p-1 border border-slate-700 shadow-sm"
            />
          ) : (
            <div
              style={{ backgroundColor: themeColor }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md"
            >
              {bizInfo?.business_name ? bizInfo.business_name[0].toUpperCase() : 'B'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {bizInfo?.chatbot_name || `${bizInfo?.business_name} Support`}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Business Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">
              {bizInfo?.greeting_text || 'Powered by Business Knowledge Base'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5 hidden sm:block" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">EN - English</option>
              <option value="hi" className="bg-slate-900 text-white">HI - हिन्दी</option>
              <option value="mr" className="bg-slate-900 text-white">MR - मराठी</option>
            </select>
          </div>

          {/* Request Human Support Button */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Request human support"
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Human Support</span>
          </button>

          {/* Feedback Button */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1"
            title="Leave feedback"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Rate</span>
          </button>

          {/* Download Transcript */}
          <button
            onClick={downloadTranscript}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Download conversation transcript"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4">
        {/* Messages List */}
        <div className="flex-1 space-y-4">
          {messages.map((msg, idx) => {
            const isCustomer = msg.sender === 'customer';
            const isFallback = msg.answer_status === 'unanswered_fallback';

            return (
              <div
                key={idx}
                className={`flex gap-3 ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                {!isCustomer && (
                  <div
                    style={{ backgroundColor: `${themeColor}25`, borderColor: `${themeColor}50` }}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5 shadow-sm"
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                  <div
                    style={
                      isCustomer
                        ? { backgroundColor: themeColor }
                        : {}
                    }
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isCustomer
                        ? 'text-white rounded-br-none shadow-md shadow-indigo-600/20'
                        : isFallback
                        ? 'bg-amber-950/40 border border-amber-800/60 text-amber-100 rounded-bl-none shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>

                    {/* Fallback prompt button */}
                    {isFallback && (
                      <div className="mt-3 pt-2.5 border-t border-amber-800/40 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-300 font-medium">
                          Need live personal assistance?
                        </span>
                        <button
                          onClick={() => {
                            setSupportSubject(`Assistance regarding: "${messages[idx - 1]?.message || 'Customer Query'}"`);
                            setShowSupportModal(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Headphones className="w-3 h-3" />
                          <span>Talk to Human Support</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Grounded Document Citations */}
                  {msg.source_documents && msg.source_documents.length > 0 && (
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Retrieved from Official Business Documents:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.source_documents.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                          >
                            <span className="font-medium truncate max-w-[150px]">{src.document_name}</span>
                            {src.page_number && (
                              <span className="text-slate-400 font-mono text-[11px]">p.{src.page_number}</span>
                            )}
                            {src.similarity_score !== undefined && (
                              <span className="text-emerald-400 font-mono text-[10px] ml-0.5">
                                {(src.similarity_score * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer metadata: TTS speak button & time */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                    {!isCustomer && (
                      <button
                        onClick={() => speakMessage(msg.message, idx)}
                        className={`hover:text-indigo-400 transition-colors flex items-center gap-1 ${
                          speakingMsgIdx === idx ? 'text-indigo-400 font-semibold' : ''
                        }`}
                        title="Listen to response"
                      >
                        {speakingMsgIdx === idx ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                    <span>
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>

                {isCustomer && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div
                style={{ backgroundColor: `${themeColor}25`, borderColor: `${themeColor}50` }}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-indigo-400 flex-shrink-0"
              >
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-300 flex items-center gap-2 shadow-md">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-400 font-mono">Searching business knowledge base...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Carousel */}
        {suggestedQuestions.length > 0 && messages.length <= 3 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggested Questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white px-3 py-1.5 rounded-full transition-all text-left shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input Form Bar */}
      <footer className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          {/* Speech-to-Text Button */}
          {bizInfo?.enable_voice !== false && (
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to speak question'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to speech...'
                : `Ask any question about ${bizInfo?.business_name || 'our business'}...`
            }
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none shadow-inner"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            style={
              inputText.trim() && !isLoading
                ? { backgroundColor: themeColor }
                : {}
            }
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 mt-2">
          Responses are strictly retrieved from official business documents. Never hallucinates outside knowledge.
        </div>
      </footer>

      {/* Human Support Request Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Live Support Request</h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supportSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Request Received!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your ticket has been dispatched to {bizInfo?.business_name}'s support team. They will follow up shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-400">
                  Please provide your contact details and message so the business owner can assist you directly.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Your Full Name</label>
                  <input
                    type="text"
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Your Contact Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Subject / Inquiry Topic</label>
                  <input
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="Question about refund / delivery policy"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Detailed Message</label>
                  <textarea
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Explain what information you need or how we can help..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Customer Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-bold text-white">Rate Your Experience</h3>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Thank You!</h4>
                <p className="text-xs text-slate-400">Your feedback helps improve our assistance.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-xs text-slate-400">How would you rate this conversation?</div>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= feedbackRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Additional Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Was the chatbot helpful? Any suggestions?"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
