import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is required in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Get the Gemini Pro model for text generation
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

// Business Intelligence specific prompts and functions
export const BI_PROMPTS = {
  ANALYZE_DATA: `You are a business intelligence analyst for small and medium enterprises (SMEs). 
Your role is to analyze business data and provide actionable insights in a clear, concise manner.

Context: You're working with SME data from Paraguay and Latin America. Consider local business practices, currency (Guaraní), and regional market conditions.

Instructions:
- Provide insights in both Spanish and English when appropriate
- Focus on actionable recommendations
- Highlight trends, opportunities, and risks
- Keep explanations simple for non-technical business owners
- Include specific metrics and numbers when available
- Suggest concrete next steps

Data to analyze:`,

  GENERATE_INSIGHTS: `Based on the following business data, generate 3-5 key insights that would help a small business owner make better decisions. Focus on:
1. Revenue trends and opportunities
2. Customer behavior patterns  
3. Operational efficiency improvements
4. Market positioning recommendations
5. Risk factors to address

Format your response as a JSON object with this structure:
{
  "insights": [
    {
      "title": "Brief title",
      "description": "Detailed explanation",
      "priority": "high|medium|low", 
      "category": "sales|finance|marketing|operations",
      "actionable_steps": ["step 1", "step 2"],
      "expected_impact": "Description of potential impact"
    }
  ],
  "summary": "Overall assessment and key takeaway"
}

Business data:`,

  ANSWER_QUESTION: `You are an AI business advisor for SMEs. Answer the user's question about their business data.

Guidelines:
- Be specific and data-driven when possible
- Provide actionable advice
- Use simple, clear language
- If data is insufficient, explain what additional data would help
- Consider the Latin American SME context

User question: `,
};

export interface BusinessInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'sales' | 'finance' | 'marketing' | 'operations';
  actionable_steps: string[];
  expected_impact: string;
}

export interface AIInsightResponse {
  insights: BusinessInsight[];
  summary: string;
}

export async function generateBusinessInsights(
  businessData: Record<string, unknown>,
  context?: string
): Promise<AIInsightResponse> {
  try {
    const prompt = `${BI_PROMPTS.GENERATE_INSIGHTS}

${context ? `Additional context: ${context}` : ''}

Data: ${JSON.stringify(businessData, null, 2)}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse as JSON, fallback to structured text if needed
    try {
      return JSON.parse(text);
    } catch {
      // If JSON parsing fails, create a structured response
      return {
        insights: [
          {
            title: "AI Analysis",
            description: text,
            priority: "medium",
            category: "operations",
            actionable_steps: ["Review the detailed analysis", "Consider implementing suggested changes"],
            expected_impact: "Improved business understanding and decision making"
          }
        ],
        summary: "Analysis completed successfully"
      };
    }
  } catch (error) {
    console.error('Error generating business insights:', error);
    throw new Error('Failed to generate business insights');
  }
}

export async function answerBusinessQuestion(
  question: string,
  businessData?: Record<string, unknown>,
  conversationHistory?: string[]
): Promise<string> {
  try {
    let prompt = `${BI_PROMPTS.ANSWER_QUESTION}${question}`;
    
    if (businessData) {
      prompt += `\n\nRelevant business data: ${JSON.stringify(businessData, null, 2)}`;
    }
    
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `\n\nPrevious conversation context:\n${conversationHistory.join('\n')}`;
    }

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error answering business question:', error);
    throw new Error('Failed to process your question. Please try again.');
  }
}

export async function analyzeDataTrends(
  data: Record<string, unknown>[],
  timeRange: string = '30d',
  metrics: string[] = []
): Promise<string> {
  try {
    const prompt = `${BI_PROMPTS.ANALYZE_DATA}

Time Range: ${timeRange}
Metrics to focus on: ${metrics.join(', ')}

Data: ${JSON.stringify(data, null, 2)}

Please provide:
1. Key trends identified in the data
2. Significant changes or patterns
3. Recommendations for improvement
4. Potential risks or opportunities
5. Specific actions the business owner should take`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing data trends:', error);
    throw new Error('Failed to analyze data trends');
  }
}

// Utility function to validate and clean business data before AI processing
export function prepareDataForAI(rawData: unknown): Record<string, unknown> {
  if (!rawData) return {};
  
  // Remove sensitive information
  const sensitiveFields = ['password', 'ssn', 'credit_card', 'bank_account'];
  
  function cleanObject(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (!sensitiveFields.some(field => lowerKey.includes(field))) {
          cleaned[key] = cleanObject(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  
  return cleanObject(rawData) as Record<string, unknown>;
}

// Function to format currency for Paraguayan context
export function formatCurrency(amount: number, currency: string = 'PYG'): string {
  if (currency === 'PYG') {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}