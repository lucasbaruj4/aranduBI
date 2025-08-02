'use client';

import { useUser } from '@clerk/nextjs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
}

function MetricCard({ title, value, change, changeType, icon: Icon }: MetricCardProps) {
  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                     changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-2 ${changeColor}`}>
            {change}
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();

  const metrics = [
    {
      title: 'Total Revenue',
      value: '$24,500',
      change: '+12.5% from last month',
      changeType: 'increase' as const,
      icon: CurrencyDollarIcon,
    },
    {
      title: 'Active Customers',
      value: '1,234',
      change: '+8.2% from last month',
      changeType: 'increase' as const,
      icon: UserGroupIcon,
    },
    {
      title: 'Orders',
      value: '156',
      change: '+15.3% from last month',
      changeType: 'increase' as const,
      icon: ShoppingCartIcon,
    },
    {
      title: 'Growth Rate',
      value: '12.5%',
      change: '+2.1% from last month',
      changeType: 'increase' as const,
      icon: TrendingUpIcon,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Upload Data</h3>
                <p className="text-sm text-gray-600 mt-1">Import your business data via CSV</p>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Connect Data Source</h3>
                <p className="text-sm text-gray-600 mt-1">Link your Shopify, QuickBooks, or other platforms</p>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Ask AI</h3>
                <p className="text-sm text-gray-600 mt-1">Get insights from your business data</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">New data sync completed</p>
                <p className="text-sm text-gray-600">Shopify data updated successfully</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">AI report generated</p>
                <p className="text-sm text-gray-600">Monthly sales insights are ready</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">Dashboard customized</p>
                <p className="text-sm text-gray-600">Widget layout updated</p>
              </div>
              <span className="text-sm text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}