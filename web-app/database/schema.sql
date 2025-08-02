-- AI-Powered Business Intelligence for SMEs Database Schema
-- Multi-tenant architecture with row-level security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE data_source_type AS ENUM ('shopify', 'quickbooks', 'google_sheets', 'csv', 'manual');
CREATE TYPE metric_category AS ENUM ('sales', 'finance', 'marketing', 'operations');

-- Organizations table (root entity for multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data sources table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type data_source_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}', -- Encrypted configuration data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business metrics table
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20),
    category metric_category NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(100) NOT NULL, -- Reference to data source
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboards table
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layout JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widgets table
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}',
    position JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI queries table (for tracking and learning)
CREATE TABLE ai_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT,
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    data_sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_data_sources_organization_id ON data_sources(organization_id);
CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_business_metrics_organization_id ON business_metrics(organization_id);
CREATE INDEX idx_business_metrics_timestamp ON business_metrics(timestamp);
CREATE INDEX idx_business_metrics_category ON business_metrics(category);
CREATE INDEX idx_dashboards_organization_id ON dashboards(organization_id);
CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_widgets_organization_id ON widgets(organization_id);
CREATE INDEX idx_ai_queries_organization_id ON ai_queries(organization_id);
CREATE INDEX idx_ai_queries_user_id ON ai_queries(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant data isolation
-- Users can only see their own organization's data

-- Organizations policy
CREATE POLICY organizations_tenant_isolation ON organizations
    USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Users policy
CREATE POLICY users_tenant_isolation ON users
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Data sources policy
CREATE POLICY data_sources_tenant_isolation ON data_sources
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Business metrics policy
CREATE POLICY business_metrics_tenant_isolation ON business_metrics
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Dashboards policy
CREATE POLICY dashboards_tenant_isolation ON dashboards
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Widgets policy
CREATE POLICY widgets_tenant_isolation ON widgets
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- AI queries policy
CREATE POLICY ai_queries_tenant_isolation ON ai_queries
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Audit logs policy
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Create a function to get the current user's organization ID
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create a new organization with admin user
CREATE OR REPLACE FUNCTION create_organization_with_admin(
    org_name TEXT,
    admin_email TEXT,
    admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    user_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name) 
    VALUES (org_name) 
    RETURNING id INTO new_org_id;
    
    -- Use provided admin_id or generate new one
    user_id := COALESCE(admin_id, uuid_generate_v4());
    
    -- Create admin user
    INSERT INTO users (id, email, organization_id, role)
    VALUES (user_id, admin_email, new_org_id, 'admin');
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default dashboard for new organizations
CREATE OR REPLACE FUNCTION create_default_dashboard()
RETURNS TRIGGER AS $$
DECLARE
    dashboard_id UUID;
BEGIN
    -- Create default dashboard
    INSERT INTO dashboards (organization_id, name, is_default, created_by)
    VALUES (NEW.id, 'Overview Dashboard', true, NULL)
    RETURNING id INTO dashboard_id;
    
    -- Add default widgets
    INSERT INTO widgets (dashboard_id, organization_id, type, title, config, position) VALUES
    (dashboard_id, NEW.id, 'metric', 'Total Revenue', 
     '{"dataSource": "all", "metrics": ["revenue"], "aggregation": "sum"}',
     '{"x": 0, "y": 0, "w": 3, "h": 2}'),
    (dashboard_id, NEW.id, 'chart', 'Sales Trend', 
     '{"chartType": "line", "dataSource": "all", "metrics": ["sales"], "timeRange": "30d"}',
     '{"x": 3, "y": 0, "w": 6, "h": 4}'),
    (dashboard_id, NEW.id, 'metric', 'Active Customers', 
     '{"dataSource": "all", "metrics": ["customers"], "aggregation": "count"}',
     '{"x": 9, "y": 0, "w": 3, "h": 2}'),
    (dashboard_id, NEW.id, 'metric', 'Orders This Month', 
     '{"dataSource": "all", "metrics": ["orders"], "aggregation": "count", "timeRange": "30d"}',
     '{"x": 0, "y": 2, "w": 3, "h": 2}');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default dashboard when organization is created
CREATE TRIGGER create_default_dashboard_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION create_default_dashboard();

-- Seed data for development (optional)
-- INSERT INTO organizations (name, domain) VALUES 
-- ('Demo SME Business', 'demo.sme-bi.com'),
-- ('Local Pharmacy', 'pharmacy.example.com');

-- INSERT INTO users (email, organization_id, role) VALUES 
-- ('admin@demo.sme-bi.com', (SELECT id FROM organizations WHERE name = 'Demo SME Business'), 'admin'),
-- ('user@demo.sme-bi.com', (SELECT id FROM organizations WHERE name = 'Demo SME Business'), 'user'),
-- ('owner@pharmacy.example.com', (SELECT id FROM organizations WHERE name = 'Local Pharmacy'), 'admin');