import React, { useState, useEffect } from 'react';
import {
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Globe,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BusinessProfile } from '../../types';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile>({
    id: '',
    owner_id: '',
    business_name: '',
    business_slug: '',
    logo: '',
    description: '',
    created_at: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/business/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load business profile:', err);
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
      const res = await api.put('/business/profile', {
        business_name: profile.business_name,
        logo: profile.logo,
        description: profile.description,
      });
      setProfile(res.data);
      setSaveSuccess(true);
      if (refreshUser) refreshUser();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update business profile:', err);
      setErrorMsg('Failed to update business profile. Please check your network.');
    } finally {
      setIsSaving(false);
    }
  };

  const publicChatUrl = `${window.location.origin}/chat/${profile.business_slug || user?.business_slug || 'demo'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicChatUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building className="w-7 h-7 text-indigo-400" />
          Business Profile & Identity
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your organization credentials, public chatbot link, and context guidelines for the AI assistant.
        </p>
      </div>

      {/* Status banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Business profile successfully updated!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Public Link Card */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-800/50 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
            Dedicated Customer Chat Link
          </div>
          <div className="text-sm font-mono text-white select-all break-all">
            {publicChatUrl}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
          <button
            onClick={copyToClipboard}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          <a
            href={publicChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
          >
            <span>Visit Chat</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
          <h3 className="text-base font-semibold text-white pb-3 border-b border-slate-800">
            Company Information
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Business Legal / Trading Name
            </label>
            <input
              type="text"
              value={profile.business_name}
              onChange={(e) =>
                setProfile({ ...profile, business_name: e.target.value })
              }
              placeholder="e.g. Apex Financial Solutions"
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Unique Business Slug (URL Identifier)
            </label>
            <input
              type="text"
              value={profile.business_slug}
              disabled
              className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 text-sm rounded-lg px-4 py-2.5 focus:outline-none font-mono cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-500">
              Slugs are permanent routing keys ensuring tenant data isolation.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Logo Image URL
            </label>
            <input
              type="url"
              value={profile.logo || ''}
              onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Company Overview & Primary Context
            </label>
            <textarea
              rows={4}
              value={profile.description || ''}
              onChange={(e) =>
                setProfile({ ...profile, description: e.target.value })
              }
              placeholder="Describe your business, industries served, and customer service goals..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              This overview is injected as system context to help the AI frame business identity properly.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Brand Card Preview */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Live Customer Badge Preview</h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={profile.business_name}
                  className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {profile.business_name ? profile.business_name[0].toUpperCase() : 'B'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate">
                  {profile.business_name || 'Business Name'}
                </div>
                <div className="text-xs text-indigo-400 font-medium">Verified Knowledge Assistant</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="font-mono text-slate-300">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tenant Isolation:</span>
                <span className="text-emerald-400 font-semibold">Strict (ChromaDB + MongoDB)</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
