'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/csvParser';

interface DataPoint {
  category: string;
  value: number;
  label?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  currency?: string;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  title,
  xAxisLabel = 'Category',
  yAxisLabel = 'Value',
  color = '#10B981',
  height = 300,
  showGrid = true,
  currency = 'USD',
  horizontal = false
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const formatTooltipValue = (value: number) => {
    return currency ? formatCurrency(value, currency) : value.toLocaleString();
  };

  const formatAxisLabel = (value: string) => {
    if (value.length > 15) {
      return value.slice(0, 12) + '...';
    }
    return value;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'horizontal' : 'vertical'}
            margin={{
              top: 5,
              right: 30,
              left: horizontal ? 60 : 20,
              bottom: horizontal ? 5 : 40,
            }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {horizontal ? (
              <>
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => currency ? formatCurrency(value, currency) : value.toLocaleString()}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={formatAxisLabel}
                  stroke="#9CA3AF"
                  width={50}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={formatAxisLabel}
                  stroke="#9CA3AF"
                  height={60}
                  angle={-45}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => currency ? formatCurrency(value, currency) : value.toLocaleString()}
                  stroke="#9CA3AF"
                />
              </>
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [formatTooltipValue(value), yAxisLabel]}
              labelFormatter={(label) => `${xAxisLabel}: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={color}
              name={yAxisLabel}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}