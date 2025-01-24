import React from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, MessageSquare } from 'lucide-react';
import type { ChatHistory } from '../types';

interface SidebarProps {
  starredChats: ChatHistory[];
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  starredChats,
  onNewChat,
  onSelectChat,
  currentChatId,
}) => {
  const getChatPreview = (chat: ChatHistory) => {
    if (!chat.messages || chat.messages.length === 0) return 'New Chat';
    
    // Find the last user message
    const lastUserMessage = [...chat.messages]
      .reverse()
      .find(msg => msg.role === 'user');
      
    if (lastUserMessage) {
      const preview = lastUserMessage.content;
      return preview.slice(0, 30) + (preview.length > 30 ? '...' : '');
    }
    
    // Fallback to first message if no user message found
    return chat.messages[0].content.slice(0, 30) + (chat.messages[0].content.length > 30 ? '...' : '');
  };

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h2 className="text-gray-400 text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4" />
            Starred Chats
          </h2>
        </div>
        <div className="space-y-1 px-2">
          {starredChats.map((chat) => (
            <motion.button
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full p-3 rounded-lg text-left flex items-center gap-2 transition-colors ${
                currentChatId === chat.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{getChatPreview(chat)}</span>
            </motion.button>
          ))}
          {starredChats.length === 0 && (
            <div className="text-gray-500 text-sm p-3 text-center">
              No starred chats yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};