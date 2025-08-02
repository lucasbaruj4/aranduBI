import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sme-bi-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'X-Client-Info': 'sme-business-intelligence',
        },
      },
    });
  }
  return supabaseInstance;
}

function getSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}

// Export getter functions instead of instances to avoid build-time issues
export { getSupabaseClient as supabase, getSupabaseAdminClient as supabaseAdmin };

// Database schema types
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          organization_id: string;
          role: 'admin' | 'user' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          organization_id: string;
          role?: 'admin' | 'user' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          organization_id?: string;
          role?: 'admin' | 'user' | 'viewer';
          updated_at?: string;
        };
      };
      data_sources: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          name: string;
          is_active: boolean;
          last_sync: string | null;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          name: string;
          is_active?: boolean;
          last_sync?: string;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          name?: string;
          is_active?: boolean;
          last_sync?: string;
          config?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      business_metrics: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          value: number;
          unit: string;
          category: string;
          timestamp: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          value: number;
          unit: string;
          category: string;
          timestamp: string;
          source: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          value?: number;
          unit?: string;
          category?: string;
          timestamp?: string;
          source?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'user' | 'viewer';
      data_source_type: 'shopify' | 'quickbooks' | 'google_sheets' | 'csv' | 'manual';
      metric_category: 'sales' | 'finance' | 'marketing' | 'operations';
    };
  };
};

// Helper function to check if we're on the client side
export const isClient = typeof window !== 'undefined';

// Helper function to get the current user's organization ID
export const getCurrentOrganizationId = async (): Promise<string | null> => {
  const { data: { user } } = await getSupabaseClient().auth.getUser();
  if (!user) return null;
  
  const { data: userData } = await getSupabaseClient()
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
    
  return (userData?.organization_id as string) || null;
};