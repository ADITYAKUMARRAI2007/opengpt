export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  file?: {
    name: string;
    type: string;
    content: string;
  };
  timestamp: Date;
}

export interface ApiConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}