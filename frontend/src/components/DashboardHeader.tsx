import React, { useState } from 'react';
import { Menu, LogOut, Copy, Check, ExternalLink, User as UserIcon, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const businessSlug = user?.business_slug || 'demo';
  const chatUrl = `${window.location.origin}/chat/${businessSlug}`;

  const copyChatLink = () => {
    navigator.clipboard.writeText(chatUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Mobile sidebar toggle button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            {user?.business_name || 'Business AI Assistant'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Connected to isolated knowledge base
          </p>
        </div>
      </div>

      {/* Quick Action Tools */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Copy shareable link */}
        <button
          onClick={copyChatLink}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-all"
          title="Copy customer chatbot link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Public Chat Link</span>
              <span className="sm:hidden">Share Link</span>
            </>
          )}
        </button>

        {/* Direct link to public chat */}
        <a
          href={`/chat/${businessSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open customer chat window"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* User profile and logout */}
        <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
              {user?.name || 'Owner'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
