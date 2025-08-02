// Core application types

export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  features: string[];
}

export interface BusinessMetric {
  id: string;
  organizationId: string;
  name: string;
  value: number;
  unit: string;
  category: 'sales' | 'finance' | 'marketing' | 'operations';
  timestamp: string;
  source: string;
}

export interface DataSource {
  id: string;
  organizationId: string;
  type: 'shopify' | 'quickbooks' | 'google_sheets' | 'csv' | 'manual';
  name: string;
  isActive: boolean;
  lastSync?: string;
  config: Record<string, any>;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  widgets: Widget[];
  layout: DashboardLayout;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut';
  dataSource: string;
  metrics: string[];
  filters?: Record<string, any>;
}

export interface DashboardLayout {
  columns: number;
  gap: number;
  responsive: boolean;
}

export interface AIQuery {
  id: string;
  organizationId: string;
  userId: string;
  query: string;
  response: string;
  confidence: number;
  dataSources: string[];
  timestamp: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}