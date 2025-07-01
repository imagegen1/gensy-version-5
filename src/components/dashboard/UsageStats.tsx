'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface UsageStatistics {
  images_generated: number
  videos_created: number
  credits_remaining: number
  total_generations: number
  this_month: {
    images: number
    videos: number
    credits_used: number
  }
  last_month: {
    images: number
    videos: number
    credits_used: number
  }
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  className?: string
}

function StatCard({ title, value, icon, trend, trendDirection, className = '' }: StatCardProps) {
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4" />
      case 'down':
        return <ArrowDownIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">{trend}</span>
            </div>
          )}
        </div>
        <div className="text-blue-500">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function UsageStats() {
  const { userId } = useAuth()
  const [stats, setStats] = useState<UsageStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-8 bg-gray-300 rounded"></div>
                <div className="w-20 h-3 bg-gray-300 rounded"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No statistics available yet</p>
      </div>
    )
  }

  // Calculate trends
  const imagesTrend = stats.this_month.images > stats.last_month.images ? 'up' : 
                     stats.this_month.images < stats.last_month.images ? 'down' : 'neutral'
  const videosTrend = stats.this_month.videos > stats.last_month.videos ? 'up' : 
                      stats.this_month.videos < stats.last_month.videos ? 'down' : 'neutral'
  
  const imagesChange = stats.last_month.images > 0 ? 
    Math.round(((stats.this_month.images - stats.last_month.images) / stats.last_month.images) * 100) : 0
  const videosChange = stats.last_month.videos > 0 ? 
    Math.round(((stats.this_month.videos - stats.last_month.videos) / stats.last_month.videos) * 100) : 0

  const creditStatus = stats.credits_remaining < 10 ? 'Low credits' : 
                       stats.credits_remaining < 50 ? 'Good' : 'Excellent'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Images Generated"
        value={stats.images_generated}
        icon={<PhotoIcon className="w-8 h-8" />}
        trend={imagesChange !== 0 ? `${Math.abs(imagesChange)}% from last month` : 'No change'}
        trendDirection={imagesTrend}
      />
      
      <StatCard
        title="Videos Created"
        value={stats.videos_created}
        icon={<VideoCameraIcon className="w-8 h-8" />}
        trend={videosChange !== 0 ? `${Math.abs(videosChange)}% from last month` : 'No change'}
        trendDirection={videosTrend}
      />
      
      <StatCard
        title="Credits Remaining"
        value={stats.credits_remaining}
        icon={<CreditCardIcon className="w-8 h-8" />}
        trend={creditStatus}
        trendDirection={stats.credits_remaining < 10 ? 'down' : 'neutral'}
      />
    </div>
  )
}

export function DetailedUsageStats() {
  const { userId } = useAuth()
  const [stats, setStats] = useState<UsageStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Usage Overview</h3>
      
      <div className="space-y-6">
        {/* This Month vs Last Month */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">This Month</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Images:</span>
                  <span className="font-medium">{stats.this_month.images}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Videos:</span>
                  <span className="font-medium">{stats.this_month.videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Credits Used:</span>
                  <span className="font-medium">{stats.this_month.credits_used}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Last Month</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Images:</span>
                  <span className="font-medium">{stats.last_month.images}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Videos:</span>
                  <span className="font-medium">{stats.last_month.videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Credits Used:</span>
                  <span className="font-medium">{stats.last_month.credits_used}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Statistics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">All Time</h4>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Total Generations:</span>
              <span className="text-lg font-bold text-blue-900">{stats.total_generations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
