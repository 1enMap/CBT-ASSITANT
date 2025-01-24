import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, LogOut, Star } from 'lucide-react';
import axios from 'axios';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ThinkingAnimation } from './components/ThinkingAnimation';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import type { Message, ChatState, User, ChatHistory } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    currentResponse: '',
  });
  const [starredChats, setStarredChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
        });
        loadStarredChats(session.user.id);
        createNewChat(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
        });
        loadStarredChats(session.user.id);
        createNewChat(session.user.id);
      } else {
        setUser(null);
        setChatState({ messages: [], isLoading: false, currentResponse: '' });
        setStarredChats([]);
        setCurrentChatId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const loadStarredChats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('is_starred', true)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setStarredChats(data || []);
    } catch (error) {
      console.error('Error loading starred chats:', error);
    }
  };

  const createNewChat = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: userId,
          messages: [],
          is_new_chat: true,
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentChatId(data.id);
      setChatState({
        messages: [],
        isLoading: false,
        currentResponse: '',
      });

      const initialGreeting: Message = {
        id: Date.now().toString(),
        content: `Hello ${user?.name}! I'm your CBT assistant. I'm here to help you work through any thoughts, feelings, or challenges you're experiencing. How are you feeling today?`,
        role: 'assistant',
        timestamp: new Date(),
      };

      await updateChatHistory(data.id, [initialGreeting]);
      setChatState(prev => ({
        ...prev,
        messages: [initialGreeting],
      }));
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const toggleStarChat = async () => {
    if (!currentChatId) return;

    try {
      const isCurrentlyStarred = starredChats.some(chat => chat.id === currentChatId);
      const { error } = await supabase
        .from('chat_history')
        .update({ is_starred: !isCurrentlyStarred })
        .eq('id', currentChatId);

      if (error) throw error;
      await loadStarredChats(user!.id);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) throw error;

      // Parse the messages array and ensure timestamps are properly converted to Date objects
      const messages = (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      setCurrentChatId(chatId);
      setChatState(prev => ({
        ...prev,
        messages,
      }));
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const updateChatHistory = async (chatId: string, messages: Message[]) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .update({
          messages,
          is_new_chat: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating chat history:', error);
    }
  };

  const simulateTyping = (fullResponse: string) => {
    let currentIndex = 0;
    const words = fullResponse.split(' ');
    
    const typeWord = () => {
      if (currentIndex < words.length) {
        setChatState(prev => ({
          ...prev,
          currentResponse: [...words.slice(0, currentIndex + 1)].join(' '),
        }));
        currentIndex++;
        
        const delay = Math.random() * (20 - 10) + 10;
        responseTimeoutRef.current = setTimeout(typeWord, delay);
      } else {
        const botMessage: Message = {
          id: Date.now().toString(),
          content: fullResponse,
          role: 'assistant',
          timestamp: new Date(),
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, botMessage],
          isLoading: false,
          currentResponse: '',
        }));

        if (currentChatId) {
          updateChatHistory(currentChatId, [...chatState.messages, botMessage]);
        }
      }
    };

    typeWord();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isLoading, chatState.currentResponse]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...chatState.messages, userMessage];
    setChatState(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true,
    }));

    if (currentChatId) {
      await updateChatHistory(currentChatId, updatedMessages);
    }

    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: "deepseek-chat",
        messages: [
          {
            role: 'system',
            content: `You are a CBT (Cognitive Behavioral Therapy) assistant. The user's name is ${user?.name}. 
            Always address them by name and be empathetic. Focus on helping them identify and challenge negative thought patterns,
            and suggest practical coping strategies. While being supportive, remember to maintain appropriate boundaries and
            remind them that you're an AI assistant, not a replacement for professional mental health care when appropriate.`
          },
          ...updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }, {
        headers: {
          'Authorization': '',
          'Content-Type': 'application/json',
        },
      });

      simulateTyping(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: Date.now().toString(),
          content: "I apologize, but I'm having trouble connecting to the service right now. Please try again in a moment.",
          role: 'assistant',
          timestamp: new Date(),
        }],
        isLoading: false,
      }));
    }
  };

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        starredChats={starredChats}
        onNewChat={() => createNewChat(user.id)}
        onSelectChat={loadChat}
        currentChatId={currentChatId}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CBT Assistant</h1>
              <p className="text-gray-600 flex items-center gap-2">
                Welcome, {user.name} <Sparkles className="w-4 h-4 text-yellow-500" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentChatId && (
              <button
                onClick={toggleStarChat}
                className={`p-2 rounded-lg transition-colors ${
                  starredChats.some(chat => chat.id === currentChatId)
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Star className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatState.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {(chatState.isLoading || chatState.currentResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 bg-indigo-50 p-4 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              {chatState.currentResponse ? (
                <div className="prose text-indigo-900 max-w-none">
                  {chatState.currentResponse}
                </div>
              ) : (
                <ThinkingAnimation />
              )}
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={chatState.isLoading}
        />
      </div>
    </div>
  );
}

export default App;