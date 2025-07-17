/**
 * 404 Not Found Page for Gensy AI Creative Suite
 * Simple static page that doesn't require authentication
 */

import Link from 'next/link'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-indigo-600 mb-2">404</div>
          <div className="text-xl text-gray-600 mb-4">Page Not Found</div>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
          <div className="space-y-2">
            <Link href="/dashboard" className="block text-indigo-600 hover:text-indigo-800 text-sm">
              Dashboard
            </Link>
            <Link href="/generate" className="block text-indigo-600 hover:text-indigo-800 text-sm">
              AI Generation
            </Link>
            <Link href="/pricing" className="block text-indigo-600 hover:text-indigo-800 text-sm">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
