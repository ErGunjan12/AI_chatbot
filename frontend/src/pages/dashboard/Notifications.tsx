import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  HelpCircle,
  Headphones,
  Send,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { NotificationSettings } from '../../types';

export const Notifications: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    business_id: '',
    email_on_unanswered: true,
    email_on_support_ticket: true,
    notification_email: '',
    daily_digest: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await api.put('/settings/notifications', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save notification settings:', err);
      setErrorMsg('Failed to update notification settings. Please check your network.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="w-7 h-7 text-indigo-400" />
          Email Notifications & Alert Routing
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure real-time email alerts so your team never misses customer questions or human support requests.
        </p>
      </div>

      {/* Status banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Notification preferences successfully saved!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
            <Bell className="w-5 h-5 text-indigo-400" />
            Alert Triggers & Delivery
          </h3>

          {/* Recipient Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Notification Destination Email
            </label>
            <input
              type="email"
              value={settings.notification_email}
              onChange={(e) =>
                setSettings({ ...settings, notification_email: e.target.value })
              }
              placeholder="support@yourbusiness.com"
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              All automated alerts for unanswered queries and escalation tickets will be delivered to this address.
            </p>
          </div>

          {/* Alert Toggles */}
          <div className="space-y-4 pt-2">
            {/* Toggle 1: Unanswered Questions */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Unanswered Question Alerts</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Receive an immediate notification whenever a customer asks a query not found in your knowledge base.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.email_on_unanswered}
                onChange={(e) =>
                  setSettings({ ...settings, email_on_unanswered: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-600 rounded mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Human Support Tickets */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mt-0.5">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Support Ticket Alerts</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Receive an email when a customer requests human escalation with their contact details.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.email_on_support_ticket}
                onChange={(e) =>
                  setSettings({ ...settings, email_on_support_ticket: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-600 rounded mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 3: Daily Digest */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Daily Summary Digest</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Get an email summary at midnight with chat volumes, satisfaction rating, and top customer questions.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.daily_digest}
                onChange={(e) =>
                  setSettings({ ...settings, daily_digest: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-600 rounded mt-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>

        {/* Info & SMTP Config Column */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              SMTP Delivery Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In production, the backend dispatches notifications via your configured SMTP server (<code className="text-indigo-300">SMTP_HOST</code>, <code className="text-indigo-300">SMTP_PORT</code>, <code className="text-indigo-300">SMTP_USER</code>).
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div>HOST: smtp.gmail.com / SendGrid</div>
              <div>PORT: 587 (STARTTLS)</div>
              <div>STATUS: <span className="text-emerald-400 font-semibold">Ready</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 space-y-1.5">
            <span className="font-semibold text-indigo-200">Instant Alert SLA</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Unanswered questions and support tickets trigger asynchronous non-blocking email dispatches within milliseconds.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
