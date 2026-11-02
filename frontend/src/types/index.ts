export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  business_id: string;
  business_name?: string;
  business_slug?: string;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  owner_id: string;
  business_name: string;
  business_slug: string;
  logo?: string;
  description?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  business_id: string;
  filename: string;
  file_type: string;
  file_status: 'processing' | 'ready' | 'failed';
  file_size_bytes?: number;
  chunk_count: number;
  uploaded_at: string;
  error_message?: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  page_number?: number;
  chunk_text: string;
  token_count?: number;
}

export interface SourceDocumentReference {
  document_id: string;
  document_name: string;
  page_number?: number;
  similarity_score?: number;
  snippet?: string;
}

export interface ChatMessage {
  id?: string;
  conversation_id?: string;
  sender: 'customer' | 'assistant';
  message: string;
  source_documents?: SourceDocumentReference[];
  answer_status?: 'grounded' | 'unanswered_fallback' | 'received';
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_at?: string;
}

export interface ChatbotSettings {
  id: string;
  business_id: string;
  chatbot_name: string;
  welcome_message: string;
  theme_color: string;
  logo?: string;
  greeting_text: string;
  fallback_message: string;
  supported_languages: string[];
  enable_voice: boolean;
  enable_suggestions: boolean;
  updated_at: string;
}

export interface FAQItem {
  question: string;
  count: number;
}

export interface DashboardOverview {
  total_conversations: number;
  total_questions: number;
  answered_questions: number;
  unanswered_questions: number;
  answer_success_rate: number;
  customer_satisfaction_avg: number;
  total_documents: number;
  recent_conversations: any[];
  frequently_asked_questions: FAQItem[];
  recent_documents: DocumentRecord[];
}

export interface DailyAnalyticsPoint {
  date: string;
  total_chats: number;
  total_questions: number;
  answered_count: number;
  unanswered_count: number;
  satisfaction: number;
}

export interface AnalyticsData {
  daily_stats: DailyAnalyticsPoint[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  total_tickets: number;
  open_tickets: number;
  avg_response_time_ms: number;
}

export interface UnansweredQuestion {
  id: string;
  business_id: string;
  conversation_id: string;
  question: string;
  resolution_status: 'pending' | 'resolved';
  resolution_notes?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  business_id: string;
  conversation_id: string;
  customer_name?: string;
  customer_email?: string;
  subject: string;
  message: string;
  owner_reply?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface CustomerFeedback {
  id: string;
  business_id: string;
  conversation_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  summary: string;
  customer_intent: string;
  key_topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface NotificationSettings {
  id?: string;
  business_id: string;
  email_on_unanswered: boolean;
  email_on_support_ticket: boolean;
  notification_email: string;
  daily_digest: boolean;
  updated_at?: string;
}

