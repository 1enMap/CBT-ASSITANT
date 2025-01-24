export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentResponse: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
  is_starred: boolean;
  is_new_chat: boolean;
}

export interface StarredChat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}