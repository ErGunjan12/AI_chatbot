import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bot,
  MessageSquare,
  HelpCircle,
  Headphones,
  BarChart3,
  Sliders,
  Settings,
  ExternalLink,
  Download,
  Mail,
  ThumbsUp,
  FileStack,
  SmilePlus,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const businessSlug = user?.business_slug || 'demo';

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Knowledge Base', icon: FileText, path: '/dashboard/knowledge-base' },
    { label: 'AI Chatbot (Test)', icon: Bot, path: '/dashboard/chatbot-preview' },
    { label: 'Chat History', icon: MessageSquare, path: '/dashboard/conversations' },
    { label: 'Unanswered Questions', icon: HelpCircle, path: '/dashboard/unanswered-questions' },
    { label: 'Live Human Support', icon: Headphones, path: '/dashboard/live-support' },
    { label: 'Customer Feedback', icon: ThumbsUp, path: '/dashboard/feedback' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { label: 'Chat Export', icon: Download, path: '/dashboard/exports' },
    { label: 'Email Notifications', icon: Mail, path: '/dashboard/notifications' },
    { label: 'Chatbot Customization', icon: Sliders, path: '/dashboard/customization' },
    { label: 'AI Conversation Summaries', icon: FileStack, path: '/dashboard/summaries' },
    { label: 'Sentiment Analysis', icon: SmilePlus, path: '/dashboard/sentiment' },
    { label: 'Business Profile', icon: Building, path: '/dashboard/profile' },
    { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white mr-3 shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold text-white truncate">
              {user?.business_name || 'Business AI'}
            </h2>
            <p className="text-xs text-indigo-400 font-medium truncate">Owner Control Panel</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Public Chat Link Pill */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1.5">
              <span>Public Customer Chat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
            <a
              href={`/chat/${businessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-center text-xs font-semibold shadow-sm transition-all truncate"
            >
              /chat/{businessSlug}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
