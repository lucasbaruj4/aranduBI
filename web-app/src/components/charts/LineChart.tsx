'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/csvParser';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  currency?: string;
}

export default function LineChart({
  data,
  title,
  yAxisLabel = 'Value',
  color = '#3B82F6',
  height = 300,
  showGrid = true,
  currency = 'USD'
}: LineChartProps) {
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

  const formatXAxisLabel = (dateString: string) => {
    return formatDate(dateString);
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={formatXAxisLabel}
              stroke="#9CA3AF"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => currency ? formatCurrency(value, currency) : value.toLocaleString()}
              stroke="#9CA3AF"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              labelFormatter={formatXAxisLabel}
              formatter={(value: number) => [formatTooltipValue(value), yAxisLabel]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              name={yAxisLabel}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}