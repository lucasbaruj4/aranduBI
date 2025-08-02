'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  CloudArrowUpIcon, 
  ChatBubbleLeftIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SME Business Intelligence</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Turn business data into actions in
            <span className="text-blue-600"> 5 minutes</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Connect your sales, accounting, and social media data to get automated insights 
            and recommendations. Perfect for SMEs in Paraguay and Latin America.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">
              Everything you need to understand your business
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Designed specifically for small and medium enterprises
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Automated Analytics
              </h4>
              <p className="text-gray-600">
                Get instant insights from your sales, customer, and financial data without manual analysis.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CloudArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Easy Data Connection
              </h4>
              <p className="text-gray-600">
                Connect Shopify, QuickBooks, Google Sheets, and upload CSV files in minutes.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ChatBubbleLeftIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                AI Assistant
              </h4>
              <p className="text-gray-600">
                Ask questions in Spanish or English and get actionable business recommendations.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h4>
              <p className="text-gray-600">
                Your data is encrypted and isolated. Multi-tenant architecture ensures complete privacy.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <GlobeAltIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Latin America Ready
              </h4>
              <p className="text-gray-600">
                Built for Paraguay and regional businesses with local currency and payment support.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Affordable Pricing
              </h4>
              <p className="text-gray-600">
                Transparent pricing designed for small businesses. No hidden fees or surprise charges.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-blue-600 rounded-2xl px-8 py-16 text-center">
          <h3 className="text-3xl font-bold text-white">
            Ready to transform your business data?
          </h3>
          <p className="mt-4 text-xl text-blue-100">
            Join hundreds of SMEs already using our platform
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="bg-white text-blue-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">SME Business Intelligence</h4>
              <p className="text-gray-300">
                Empowering small and medium enterprises with data-driven insights.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/sign-up" className="text-gray-300 hover:text-white">Get Started</Link></li>
                <li><Link href="/sign-in" className="text-gray-300 hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@sme-bi.com" className="text-gray-300 hover:text-white">Contact Us</a></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-300">
            <p>&copy; 2025 SME Business Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
