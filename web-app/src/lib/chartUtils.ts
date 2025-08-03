import type { CSVRow } from '@/types';

// Chart data transformation utilities

export interface ChartDataPoint {
  date?: string;
  category?: string;
  name?: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  category: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

// Transform CSV data for line charts (time series)
export function transformToTimeSeriesData(
  csvData: CSVRow[],
  aggregationType: 'daily' | 'weekly' | 'monthly' = 'daily'
): TimeSeriesData[] {
  if (!csvData || csvData.length === 0) return [];

  // Group data by date
  const dateGroups = csvData.reduce((groups, row) => {
    let dateKey: string;
    const date = new Date(row.date);
    
    switch (aggregationType) {
      case 'weekly':
        // Get start of week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default:
        dateKey = date.toISOString().split('T')[0];
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(row);
    return groups;
  }, {} as Record<string, CSVRow[]>);

  // Calculate aggregated values
  return Object.entries(dateGroups)
    .map(([date, rows]) => ({
      date,
      value: rows.reduce((sum, row) => sum + row.amount, 0),
      label: `${rows.length} transactions`
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Transform CSV data for bar charts (categories)
export function transformToCategoryData(
  csvData: CSVRow[],
  groupBy: 'category' | 'customer' | 'product' = 'category',
  limit?: number
): CategoryData[] {
  if (!csvData || csvData.length === 0) return [];

  // Group data by the specified field
  const groups = csvData.reduce((acc, row) => {
    let key: string;
    switch (groupBy) {
      case 'customer':
        key = row.customer || 'Unknown';
        break;
      case 'product':
        key = row.product || 'Unknown';
        break;
      default:
        key = row.category || 'General';
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<string, CSVRow[]>);

  // Calculate totals for each group
  let result = Object.entries(groups)
    .map(([category, rows]) => ({
      category,
      value: rows.reduce((sum, row) => sum + row.amount, 0),
      label: `${rows.length} transactions`
    }))
    .sort((a, b) => b.value - a.value);

  // Apply limit if specified
  if (limit && limit > 0) {
    result = result.slice(0, limit);
  }

  return result;
}

// Transform CSV data for pie charts
export function transformToPieChartData(
  csvData: CSVRow[],
  groupBy: 'category' | 'customer' | 'product' = 'category',
  limit: number = 6
): PieChartData[] {
  const categoryData = transformToCategoryData(csvData, groupBy);
  
  if (categoryData.length <= limit) {
    return categoryData.map(item => ({
      name: item.category,
      value: item.value
    }));
  }

  // Take top items and group others
  const topItems = categoryData.slice(0, limit - 1);
  const otherItems = categoryData.slice(limit - 1);
  const otherTotal = otherItems.reduce((sum, item) => sum + item.value, 0);

  const result = topItems.map(item => ({
    name: item.category,
    value: item.value
  }));

  if (otherTotal > 0) {
    result.push({
      name: 'Others',
      value: otherTotal
    });
  }

  return result;
}

// Calculate basic statistics for a dataset
export function calculateStats(csvData: CSVRow[]) {
  if (!csvData || csvData.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      count: 0
    };
  }

  const amounts = csvData.map(row => row.amount);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const average = total / amounts.length;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  return {
    total,
    average,
    min,
    max,
    count: amounts.length
  };
}

// Generate insights from CSV data
export function generateDataInsights(csvData: CSVRow[]) {
  if (!csvData || csvData.length === 0) {
    return {
      summary: 'No data available',
      trends: [],
      recommendations: []
    };
  }

  const stats = calculateStats(csvData);
  const timeSeriesData = transformToTimeSeriesData(csvData, 'daily');
  const categoryData = transformToCategoryData(csvData, 'category');

  // Calculate trends
  const trends = [];
  
  if (timeSeriesData.length >= 2) {
    const recent = timeSeriesData.slice(-7); // Last 7 data points
    const older = timeSeriesData.slice(-14, -7); // Previous 7 data points
    
    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      trends.push(`Revenue ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% recently`);
    }
  }

  // Top performing category
  if (categoryData.length > 0) {
    const topCategory = categoryData[0];
    const topCategoryPercent = ((topCategory.value / stats.total) * 100).toFixed(1);
    trends.push(`${topCategory.category} is your top category (${topCategoryPercent}% of revenue)`);
  }

  // Generate recommendations
  const recommendations = [];
  
  if (categoryData.length > 1) {
    const topTwo = categoryData.slice(0, 2);
    const ratio = topTwo[1].value / topTwo[0].value;
    
    if (ratio < 0.3) {
      recommendations.push(`Consider focusing more on ${topTwo[1].category} to diversify revenue`);
    }
  }

  if (stats.average > 0) {
    const highValueTransactions = csvData.filter(row => row.amount > stats.average * 1.5).length;
    const highValuePercent = (highValueTransactions / csvData.length * 100).toFixed(1);
    recommendations.push(`${highValuePercent}% of transactions are high-value (>${(stats.average * 1.5).toFixed(0)})`);
  }

  return {
    summary: `${csvData.length} transactions totaling ${stats.total.toFixed(2)} with average of ${stats.average.toFixed(2)}`,
    trends,
    recommendations
  };
}

// Color schemes for charts
export const CHART_COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  business: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED'],
  pastel: ['#93C5FD', '#6EE7B7', '#FDE68A', '#FCA5A5', '#C4B5FD'],
  professional: ['#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB']
};

export function getChartColors(scheme: keyof typeof CHART_COLORS = 'primary'): string[] {
  return CHART_COLORS[scheme];
}