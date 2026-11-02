import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts & Nav
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { DashboardHeader } from './components/DashboardHeader';

// Public Marketing Pages
import { Landing } from './pages/Landing';
import { About } from './pages/About';
import { Features } from './pages/Features';
import { HowItWorks } from './pages/HowItWorks';
import { Contact } from './pages/Contact';

// Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// Public Customer Chat
import { CustomerChat } from './pages/CustomerChat';

// Dashboard Pages
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { KnowledgeBase } from './pages/dashboard/KnowledgeBase';
import { ChatbotPreview } from './pages/dashboard/ChatbotPreview';
import { Conversations } from './pages/dashboard/Conversations';
import { UnansweredQuestions } from './pages/dashboard/UnansweredQuestions';
import { LiveSupport } from './pages/dashboard/LiveSupport';
import { Feedback } from './pages/dashboard/Feedback';
import { Analytics } from './pages/dashboard/Analytics';
import { Exports } from './pages/dashboard/Exports';
import { Notifications } from './pages/dashboard/Notifications';
import { ChatbotCustomization } from './pages/dashboard/ChatbotCustomization';
import { Summaries } from './pages/dashboard/Summaries';
import { Sentiment } from './pages/dashboard/Sentiment';
import { Profile } from './pages/dashboard/Profile';
import { Settings } from './pages/dashboard/Settings';

// Public Layout Wrapper with Navbar & Footer
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Protected Dashboard Layout Wrapper
const ProtectedDashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar for Desktop & Mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Customer Chat (No Navbar/Footer) */}
          <Route path="/chat/:business_slug" element={<CustomerChat />} />

          {/* Public Marketing Routes with Navbar & Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Owner Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedDashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="chatbot-preview" element={<ChatbotPreview />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="unanswered-questions" element={<UnansweredQuestions />} />
            <Route path="live-support" element={<LiveSupport />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="exports" element={<Exports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="customization" element={<ChatbotCustomization />} />
            <Route path="summaries" element={<Summaries />} />
            <Route path="sentiment" element={<Sentiment />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
