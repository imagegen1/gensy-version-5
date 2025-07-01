'use client'

import { useState } from 'react'
import { 
  CreditCardIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface CreditIndicatorProps {
  credits: number
  onRefresh?: () => void
  className?: string
}

export function CreditIndicator({ 
  credits, 
  onRefresh,
  className = '' 
}: CreditIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const getCreditStatus = () => {
    if (credits === 0) {
      return {
        color: 'red',
        message: 'No credits remaining',
        icon: ExclamationTriangleIcon,
      }
    } else if (credits <= 5) {
      return {
        color: 'yellow',
        message: 'Low credits',
        icon: ExclamationTriangleIcon,
      }
    } else {
      return {
        color: 'green',
        message: 'Credits available',
        icon: CreditCardIcon,
      }
    }
  }

  const status = getCreditStatus()
  const StatusIcon = status.icon

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            status.color === 'red' ? 'bg-red-100' :
            status.color === 'yellow' ? 'bg-yellow-100' :
            'bg-green-100'
          }`}>
            <StatusIcon className={`h-5 w-5 ${
              status.color === 'red' ? 'text-red-600' :
              status.color === 'yellow' ? 'text-yellow-600' :
              'text-green-600'
            }`} />
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900">
                {credits} Credits
              </span>
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh credits"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <p className={`text-sm ${
              status.color === 'red' ? 'text-red-600' :
              status.color === 'yellow' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {status.message}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 space-y-1">
            <div>1 credit = Standard image</div>
            <div>3 credits = Ultra quality</div>
          </div>
        </div>
      </div>

      {/* Credit Usage Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-start">
          <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Credit Usage:</p>
            <ul className="space-y-0.5">
              <li>• Standard quality: 1 credit</li>
              <li>• High quality: 1 credit</li>
              <li>• Ultra quality: 3 credits</li>
              <li>• Image upscaling: 2 credits</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Low Credits Warning */}
      {credits <= 5 && credits > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Running low on credits!</p>
              <p className="text-xs mt-1">
                Consider purchasing more credits to continue generating images.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Credits Warning */}
      {credits === 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-2" />
              <div className="text-sm text-red-800">
                <p className="font-medium">No credits remaining</p>
                <p className="text-xs mt-1">
                  Purchase credits to continue generating images.
                </p>
              </div>
            </div>
            <button className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">
              Buy Credits
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
