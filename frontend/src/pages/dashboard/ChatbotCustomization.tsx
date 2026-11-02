import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Palette,
  Bot,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Languages,
  Mic,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { ChatbotSettings } from '../../types';

export const ChatbotCustomization: React.FC = () => {
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const colorPresets = [
    '#4f46e5', // Indigo
    '#2563eb', // Blue
    '#059669', // Emerald
    '#7c3aed', // Purple
    '#db2777', // Pink
    '#ea580c', // Orange
    '#0f172a', // Slate
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/chatbot');
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.put('/settings/chatbot', {
        chatbot_name: settings.chatbot_name,
        welcome_message: settings.welcome_message,
        theme_color: settings.theme_color,
        greeting_text: settings.greeting_text,
        fallback_message: settings.fallback_message,
        supported_languages: settings.supported_languages,
        enable_voice: settings.enable_voice,
        enable_suggestions: settings.enable_suggestions,
      });
      setSettings(res.data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update chatbot settings.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (!settings) return;
    const exists = settings.supported_languages.includes(lang);
    if (exists && settings.supported_languages.length === 1) return; // Keep at least one
    const updated = exists
      ? settings.supported_languages.filter((l) => l !== lang)
      : [...settings.supported_languages, lang];
    setSettings({ ...settings, supported_languages: updated });
  };

  if (loading || !settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chatbot Branding & Customization
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize your AI assistant's appearance, greeting, theme colors, and multilingual options.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Chatbot configuration updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assistant Name
              </label>
              <input
                type="text"
                required
                value={settings.chatbot_name}
                onChange={(e) => setSettings({ ...settings, chatbot_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Greeting Subtitle
              </label>
              <input
                type="text"
                value={settings.greeting_text}
                onChange={(e) => setSettings({ ...settings, greeting_text: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Welcome Message
              </label>
              <textarea
                rows={2}
                value={settings.welcome_message}
                onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Theme Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Brand Theme Color
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {colorPresets.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSettings({ ...settings, theme_color: hex })}
                      style={{ backgroundColor: hex }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        settings.theme_color.toLowerCase() === hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500'
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <input
                    type="color"
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-500">{settings.theme_color}</span>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Supported Conversation Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'Hindi (हिंदी)' },
                  { code: 'mr', name: 'Marathi (मराठी)' },
                ].map((lang) => {
                  const isChecked = settings.supported_languages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_voice}
                  onChange={(e) => setSettings({ ...settings, enable_voice: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Enable Voice Speech-to-Text & Speech Synthesis</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_suggestions}
                  onChange={(e) => setSettings({ ...settings, enable_suggestions: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Display Smart Suggested Questions from Documents</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Live Widget Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Widget Top Header */}
            <div
              style={{ backgroundColor: settings.theme_color }}
              className="p-4 text-white flex items-center justify-between transition-colors shadow-sm"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{settings.chatbot_name}</h4>
                  <p className="text-[10px] text-white/80">{settings.greeting_text}</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            {/* Widget Chat Area Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 h-80 overflow-y-auto space-y-3 text-xs">
              {/* Bot Welcome Bubble */}
              <div className="flex items-start space-x-2">
                <div
                  style={{ backgroundColor: settings.theme_color }}
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px]"
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed text-[11px]">
                  {settings.welcome_message}
                </div>
              </div>

              {/* Sample User Bubble */}
              <div className="flex items-start justify-end space-x-2">
                <div
                  style={{ backgroundColor: settings.theme_color }}
                  className="p-2.5 rounded-2xl rounded-tr-none text-white text-[11px] shadow-sm"
                >
                  What are your refund terms?
                </div>
              </div>

              {/* Sample Grounded Bot Bubble */}
              <div className="flex items-start space-x-2">
                <div
                  style={{ backgroundColor: settings.theme_color }}
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px]"
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed text-[11px] space-y-1.5">
                  <p>Based on our refund policy: You are eligible for a 100% full refund within 30 days of purchase.</p>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Verified from policy.pdf (Page 1)
                  </div>
                </div>
              </div>
            </div>

            {/* Widget Input Area Preview */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2">
              <input
                type="text"
                disabled
                placeholder="Ask a question..."
                className="flex-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] outline-none"
              />
              <button
                type="button"
                style={{ backgroundColor: settings.theme_color }}
                className="w-7 h-7 rounded-full text-white flex items-center justify-center flex-shrink-0"
              >
                <Bot className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Live UI Preview updates dynamically</p>
        </div>
      </div>
    </div>
  );
};
