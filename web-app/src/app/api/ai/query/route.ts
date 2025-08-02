import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { answerBusinessQuestion, prepareDataForAI } from '@/lib/ai/gemini';
import { z } from 'zod';

// Input validation schema
const querySchema = z.object({
  query: z.string().min(1).max(500),
  includeData: z.boolean().default(true),
  timeRange: z.string().default('30d'),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { query, includeData, timeRange } = querySchema.parse(body);

    // Sanitize the query to prevent prompt injection
    const sanitizedQuery = query
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/system|assistant|user:/gi, '') // Remove role indicators
      .trim();

    if (!sanitizedQuery) {
      return NextResponse.json(
        { error: 'Invalid query' },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: userData } = await supabase()
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let businessData = null;

    // Fetch relevant business data if requested
    if (includeData) {
      // Get recent business metrics
      const { data: metrics } = await supabase()
        .from('business_metrics')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('timestamp', { ascending: false })
        .limit(100);

      // Get data sources info
      const { data: dataSources } = await supabase()
        .from('data_sources')
        .select('type, name, is_active, last_sync')
        .eq('organization_id', userData.organization_id);

      businessData = prepareDataForAI({
        metrics: metrics || [],
        dataSources: dataSources || [],
        timeRange,
        organizationId: userData.organization_id,
      });
    }

    // Generate AI response
    const aiResponse = await answerBusinessQuestion(
      sanitizedQuery,
      businessData || undefined
    );

    // Store the query and response for learning and audit
    await supabase()
      .from('ai_queries')
      .insert({
        organization_id: userData.organization_id,
        user_id: userId,
        query: sanitizedQuery,
        response: aiResponse,
        confidence: 0.8, // Default confidence, could be improved with actual scoring
        data_sources: businessData ? ['business_metrics', 'data_sources'] : [],
        metadata: {
          timeRange,
          includeData,
          timestamp: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse,
        query: sanitizedQuery,
        hasData: !!businessData,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('AI Query API Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Handle AI service errors
    if (error instanceof Error && error.message.includes('Failed to process')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Query API is operational',
    timestamp: new Date().toISOString(),
  });
}