'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  ChartBarIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface UsageData {
  totalCreditsUsed: number
  totalGenerations: number
  imageGenerations: number
  videoGenerations: number
  upscalingOperations: number
  formatConversions: number
  dailyUsage: Array<{
    date: string
    credits: number
    generations: number
  }>
  monthlyUsage: Array<{
    month: string
    credits: number
    generations: number
  }>
  featureUsage: Array<{
    feature: string
    count: number
    credits: number
  }>
}

interface AnalyticsFilters {
  period: 'week' | 'month' | 'quarter' | 'year'
  feature: 'all' | 'image' | 'video' | 'upscaling' | 'conversion'
}

export function UsageAnalytics() {
  const { userId } = useAuth()
  const [usageData, setUsageData] = useState<UsageData>({
    totalCreditsUsed: 0,
    totalGenerations: 0,
    imageGenerations: 0,
    videoGenerations: 0,
    upscalingOperations: 0,
    formatConversions: 0,
    dailyUsage: [],
    monthlyUsage: [],
    featureUsage: []
  })
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    feature: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadUsageData()
    }
  }, [userId, filters])

  const loadUsageData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/usage?period=${filters.period}&feature=${filters.feature}`)
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to load usage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'image':
      case 'image_generation':
        return PhotoIcon
      case 'video':
      case 'video_generation':
        return VideoCameraIcon
      case 'upscaling':
        return ArrowTrendingUpIcon
      case 'conversion':
        return SparklesIcon
      default:
        return ChartBarIcon
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getUsageTrend = () => {
    if (usageData.dailyUsage.length < 2) return 0
    const recent = usageData.dailyUsage.slice(-7).reduce((sum, day) => sum + day.credits, 0)
    const previous = usageData.dailyUsage.slice(-14, -7).reduce((sum, day) => sum + day.credits, 0)
    if (previous === 0) return 0
    return Math.round(((recent - previous) / previous) * 100)
  }

  const getMostUsedFeature = () => {
    if (usageData.featureUsage.length === 0) return 'None'
    return usageData.featureUsage.reduce((max, feature) => 
      feature.count > max.count ? feature : max
    ).feature
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600 mt-1">Track your AI generation usage and credit consumption</p>
        </div>
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-8 w-8 text-primary-600" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feature</label>
            <select
              value={filters.feature}
              onChange={(e) => setFilters(prev => ({ ...prev, feature: e.target.value as any }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Features</option>
              <option value="image">Image Generation</option>
              <option value="video">Video Generation</option>
              <option value="upscaling">Image Upscaling</option>
              <option value="conversion">Format Conversion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Credits Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageData.totalCreditsUsed)}</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm ${getUsageTrend() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getUsageTrend() >= 0 ? '+' : ''}{getUsageTrend()}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Generations</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageData.totalGenerations)}</p>
              <p className="text-sm text-gray-500 mt-1">All AI creations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PhotoIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Images Generated</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageData.imageGenerations)}</p>
              <p className="text-sm text-gray-500 mt-1">AI image creations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <VideoCameraIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Videos Generated</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageData.videoGenerations)}</p>
              <p className="text-sm text-gray-500 mt-1">AI video creations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Over Time</h2>
        
        {/* Simple bar chart representation */}
        <div className="space-y-4">
          {usageData.dailyUsage.slice(-7).map((day, index) => {
            const maxCredits = Math.max(...usageData.dailyUsage.map(d => d.credits))
            const width = maxCredits > 0 ? (day.credits / maxCredits) * 100 : 0
            
            return (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-primary-500 h-6 rounded-full transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                    {day.credits} credits
                  </span>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {day.generations} gen
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Usage</h2>
          
          <div className="space-y-4">
            {usageData.featureUsage.map((feature, index) => {
              const Icon = getFeatureIcon(feature.feature)
              const maxCount = Math.max(...usageData.featureUsage.map(f => f.count))
              const width = maxCount > 0 ? (feature.count / maxCount) * 100 : 0
              
              return (
                <div key={feature.feature} className="flex items-center space-x-4">
                  <Icon className="h-6 w-6 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {feature.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {feature.count} uses
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {feature.credits} credits
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Insights</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Most Used Feature</h3>
                <p className="text-gray-600 text-sm capitalize">
                  {getMostUsedFeature().replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Average Daily Usage</h3>
                <p className="text-gray-600 text-sm">
                  {Math.round(usageData.totalCreditsUsed / Math.max(usageData.dailyUsage.length, 1))} credits per day
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 rounded-full p-2">
                <ClockIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Usage Trend</h3>
                <p className="text-gray-600 text-sm">
                  {getUsageTrend() >= 0 ? 'Increasing' : 'Decreasing'} by {Math.abs(getUsageTrend())}%
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 rounded-full p-2">
                <SparklesIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Efficiency Score</h3>
                <p className="text-gray-600 text-sm">
                  {usageData.totalCreditsUsed > 0 
                    ? Math.round((usageData.totalGenerations / usageData.totalCreditsUsed) * 100)
                    : 0
                  }% generations per credit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Data</h2>
        
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Export as CSV
          </button>
          
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}
