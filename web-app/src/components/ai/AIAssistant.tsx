'use client';

import { useState } from 'react';
import { useAI, useAIConversation } from '@/hooks/useAI';
import { 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const [query, setQuery] = useState('');
  const { askQuestion, isLoading, error, clearError } = useAI();
  const { conversation, addMessage, clearConversation } = useAIConversation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    
    // Add user message to conversation
    addMessage(userQuery, 'user');

    // Get AI response
    const response = await askQuestion(userQuery);
    
    if (response) {
      addMessage(response.response, 'ai');
    } else if (error) {
      addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
  };

  const quickQuestions = [
    "How are my sales performing this month?",
    "What are my top selling products?", 
    "How can I improve my revenue?",
    "What trends do you see in my data?",
    "Show me my key business metrics",
  ];

  const handleQuickQuestion = (question: string) => {
    setQuery(question);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <SparklesIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm">Ask me anything about your business!</p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">Try these questions:</p>
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="block w-full text-xs text-left p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your business data..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
        
        {conversation.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs text-gray-500 hover:text-gray-700 mt-2"
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}