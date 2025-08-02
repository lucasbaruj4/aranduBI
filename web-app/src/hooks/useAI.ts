'use client';

import { useState } from 'react';
import type { BusinessInsight } from '@/lib/ai/gemini';

interface AIQueryResponse {
  response: string;
  query: string;
  hasData: boolean;
  timestamp: string;
}

interface InsightsResponse {
  insights: BusinessInsight[];
  summary: string;
  metadata: {
    timeRange: string;
    categories: string[];
    dataPoints: number;
    generatedAt: string;
  };
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (
    query: string,
    includeData: boolean = true,
    timeRange: string = '30d'
  ): Promise<AIQueryResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          includeData,
          timeRange,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ask question';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async (
    timeRange: string = '30d',
    categories: string[] = ['sales', 'finance', 'marketing', 'operations'],
    context?: string
  ): Promise<InsightsResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeRange,
          categories,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    askQuestion,
    generateInsights,
    isLoading,
    error,
    clearError,
  };
}

// Hook for managing AI conversation history
export function useAIConversation() {
  const [conversation, setConversation] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);

  const addMessage = (content: string, type: 'user' | 'ai') => {
    const message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, message]);
  };

  const clearConversation = () => setConversation([]);

  return {
    conversation,
    addMessage,
    clearConversation,
  };
}