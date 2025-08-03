import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Upload route for CSV data processing

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to create a UUID from Clerk user ID
async function createOrganizationId(userId: string): Promise<string> {
  // Create a deterministic UUID from the user ID
  const hash = createHash('sha256').update(userId).digest('hex');
  // Format as UUID v4
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    '8' + hash.substring(17, 20), // Variant bits
    hash.substring(20, 32)
  ].join('-');
}

// Helper function to ensure organization exists
async function ensureOrganizationExists(organizationId: string, userId: string): Promise<void> {
  // Check if organization already exists
  const { data: existingOrg, error: checkError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error('Failed to check organization');
  }

  if (!existingOrg) {
    // Create new organization (matching schema structure)
    const { error: createError } = await supabase
      .from('organizations')
      .insert({
        id: organizationId,
        name: `Personal Organization`, // Default name for MVP
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createError) {
      throw new Error('Failed to create organization');
    }
  }
}

// Request validation schema
const uploadRequestSchema = z.object({
  data: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    description: z.string().optional(),
    category: z.string().optional(),
    customer: z.string().optional(),
    product: z.string().optional(),
  })),
  fileName: z.string(),
  dataSourceType: z.string().default('csv'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = uploadRequestSchema.parse(body);

    // Get or create organization ID (using userId as fallback for MVP)
    // For MVP, we'll use a hash of the userId to create a consistent UUID
    const organizationId = orgId || await createOrganizationId(userId);

    // Ensure organization exists (create if it doesn't)
    await ensureOrganizationExists(organizationId, userId);

    // Create data source record
    const { data: dataSource, error: dataSourceError } = await supabase
      .from('data_sources')
      .insert({
        organization_id: organizationId,
        type: validatedData.dataSourceType,
        name: validatedData.fileName,
        is_active: true,
        config: {
          fileName: validatedData.fileName,
          uploadedAt: new Date().toISOString(),
          rowCount: validatedData.data.length
        }
      })
      .select()
      .single();

    if (dataSourceError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create data source record' },
        { status: 500 }
      );
    }

    // Transform and insert business metrics
    const metricsToInsert = validatedData.data.map((row) => {
      // Map category to valid enum values, default to 'sales' for MVP
      let category: 'sales' | 'finance' | 'marketing' | 'operations' = 'sales';
      if (row.category) {
        const categoryLower = row.category.toLowerCase();
        if (['sales', 'finance', 'marketing', 'operations'].includes(categoryLower)) {
          category = categoryLower as 'sales' | 'finance' | 'marketing' | 'operations';
        }
      }

      return {
        organization_id: organizationId,
        name: row.description || 'Transaction',
        value: row.amount,
        unit: 'currency',
        category: category,
        timestamp: new Date(row.date).toISOString(),
        source: `csv:${validatedData.fileName}`,
        metadata: {
          customer: row.customer,
          product: row.product,
          originalDescription: row.description,
          dataSourceId: dataSource.id,
          originalCategory: row.category // Keep original category for reference
        }
      };
    });

    // Insert metrics in batches to avoid request size limits
    const batchSize = 100;
    const insertedMetrics = [];
    
    for (let i = 0; i < metricsToInsert.length; i += batchSize) {
      const batch = metricsToInsert.slice(i, i + batchSize);
      
      const { data: batchResult, error: batchError } = await supabase
        .from('business_metrics')
        .insert(batch)
        .select();

      if (batchError) {
        // Continue with other batches, but log the error
        continue;
      }

      if (batchResult) {
        insertedMetrics.push(...batchResult);
      }
    }

    // Update data source with last sync
    await supabase
      .from('data_sources')
      .update({ 
        last_sync: new Date().toISOString(),
        config: {
          ...dataSource.config,
          lastProcessedRows: insertedMetrics.length
        }
      })
      .eq('id', dataSource.id);

    return NextResponse.json({
      success: true,
      data: {
        dataSourceId: dataSource.id,
        metricsCreated: insertedMetrics.length,
        fileName: validatedData.fileName,
        summary: {
          totalRows: validatedData.data.length,
          processedRows: insertedMetrics.length,
          categories: [...new Set(validatedData.data.map(r => r.category).filter(Boolean))],
          dateRange: {
            start: validatedData.data.reduce((min, row) => 
              new Date(row.date) < new Date(min) ? row.date : min, 
              validatedData.data[0]?.date || new Date().toISOString()
            ),
            end: validatedData.data.reduce((max, row) => 
              new Date(row.date) > new Date(max) ? row.date : max, 
              validatedData.data[0]?.date || new Date().toISOString()
            )
          }
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve uploaded data sources
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;

    // Get data sources for the organization
    const { data: dataSources, error } = await supabase
      .from('data_sources')
      .select(`
        id,
        type,
        name,
        is_active,
        last_sync,
        created_at,
        config
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch data sources' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataSources || []
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}