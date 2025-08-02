// Application constants

export const APP_CONFIG = {
  name: 'SME Business Intelligence',
  description: 'Turn business data into actions in 5 minutes',
  version: '1.0.0',
  supportEmail: 'support@sme-bi.com',
} as const;

export const DATABASE_TABLES = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  DATA_SOURCES: 'data_sources',
  BUSINESS_METRICS: 'business_metrics',
  DASHBOARDS: 'dashboards',
  WIDGETS: 'widgets',
  AI_QUERIES: 'ai_queries',
  AUDIT_LOGS: 'audit_logs',
} as const;

export const DATA_SOURCE_TYPES = {
  SHOPIFY: 'shopify',
  QUICKBOOKS: 'quickbooks',
  GOOGLE_SHEETS: 'google_sheets',
  CSV_UPLOAD: 'csv',
  MANUAL_ENTRY: 'manual',
} as const;

export const METRIC_CATEGORIES = {
  SALES: 'sales',
  FINANCE: 'finance',
  MARKETING: 'marketing',
  OPERATIONS: 'operations',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DONUT: 'donut',
  AREA: 'area',
  SCATTER: 'scatter',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  ORGANIZATIONS: '/api/organizations',
  DATA_SOURCES: '/api/data-sources',
  METRICS: '/api/metrics',
  DASHBOARDS: '/api/dashboards',
  AI_QUERY: '/api/ai/query',
  REPORTS: '/api/reports',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  ORGANIZATION_NAME_MAX_LENGTH: 100,
  QUERY_MAX_LENGTH: 500,
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const SUPPORTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
] as const;

export const TIMEZONES = [
  'America/Asuncion',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'America/New_York',
  'Europe/London',
  'UTC',
] as const;