import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { generateBusinessInsights, prepareDataForAI } from '@/lib/ai/gemini';
import { z } from 'zod';

const insightsSchema = z.object({
  timeRange: z.string().default('30d'),
  categories: z.array(z.string()).default(['sales', 'finance', 'marketing', 'operations']),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeRange, categories, context } = insightsSchema.parse(body);

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

    // Calculate date range
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch comprehensive business data
    const [metricsResult, dataSourcesResult, organizationResult] = await Promise.all([
      // Business metrics
      supabase()
        .from('business_metrics')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false }),

      // Data sources
      supabase()
        .from('data_sources')
        .select('*')
        .eq('organization_id', userData.organization_id),

      // Organization info
      supabase()
        .from('organizations')
        .select('name, settings')
        .eq('id', userData.organization_id)
        .single()
    ]);

    const metrics = metricsResult.data || [];
    const dataSources = dataSourcesResult.data || [];
    const organization = organizationResult.data;

    // Aggregate metrics by category
    const settings = organization?.settings as Record<string, unknown> || {};
    const aggregatedData = {
      organization: {
        name: organization?.name,
        currency: (settings.currency as string) || 'PYG',
        timezone: (settings.timezone as string) || 'America/Asuncion',
      },
      timeRange,
      summary: {
        totalMetrics: metrics.length,
        activeSources: dataSources.filter(ds => ds.is_active).length,
        categories: categories,
      },
      metrics: {
        sales: metrics.filter(m => m.category === 'sales'),
        finance: metrics.filter(m => m.category === 'finance'),
        marketing: metrics.filter(m => m.category === 'marketing'),
        operations: metrics.filter(m => m.category === 'operations'),
      },
      dataSources: dataSources.map(ds => ({
        type: ds.type,
        name: ds.name,
        isActive: ds.is_active,
        lastSync: ds.last_sync,
      })),
    };

    // Calculate key performance indicators
    const kpis = calculateKPIs(metrics as unknown as MetricRecord[], timeRange);
    
    const businessData = prepareDataForAI({
      ...aggregatedData,
      kpis,
    });

    // Generate AI insights
    const insights = await generateBusinessInsights(businessData, context);

    // Store the insights generation request
    await supabase()
      .from('ai_queries')
      .insert({
        organization_id: userData.organization_id,
        user_id: userId,
        query: `Generate business insights for ${timeRange} - Categories: ${categories.join(', ')}`,
        response: JSON.stringify(insights),
        confidence: 0.85,
        data_sources: ['business_metrics', 'data_sources'],
        metadata: {
          type: 'insights_generation',
          timeRange,
          categories,
          context,
          metricsCount: metrics.length,
          timestamp: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      data: {
        insights: insights.insights,
        summary: insights.summary,
        metadata: {
          timeRange,
          categories,
          dataPoints: metrics.length,
          generatedAt: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('AI Insights API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

interface MetricRecord {
  category: string;
  name: string;
  value: number;
}

function calculateKPIs(metrics: MetricRecord[], timeRange: string) {
  if (!metrics.length) return {};

  const salesMetrics = metrics.filter(m => m.category === 'sales');
  const financeMetrics = metrics.filter(m => m.category === 'finance');
  
  const totalRevenue = salesMetrics
    .filter(m => m.name.toLowerCase().includes('revenue') || m.name.toLowerCase().includes('sales'))
    .reduce((sum, m) => sum + (m.value || 0), 0);
    
  const totalOrders = salesMetrics
    .filter(m => m.name.toLowerCase().includes('order') || m.name.toLowerCase().includes('transaction'))
    .reduce((sum, m) => sum + (m.value || 0), 0);
    
  const totalExpenses = financeMetrics
    .filter(m => m.name.toLowerCase().includes('expense') || m.name.toLowerCase().includes('cost'))
    .reduce((sum, m) => sum + (m.value || 0), 0);

  return {
    totalRevenue,
    totalOrders,
    totalExpenses,
    profit: totalRevenue - totalExpenses,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    metricsCount: metrics.length,
    timeRange,
  };
}