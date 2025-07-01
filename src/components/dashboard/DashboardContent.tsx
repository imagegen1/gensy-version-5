/**
 * Dashboard Content Component for Gensy AI Creative Suite
 * Main dashboard content with stats, quick actions, and recent activity
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@clerk/nextjs/server'
import {
  PhotoIcon,
  VideoCameraIcon,
  ArrowUpIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui'

interface DashboardContentProps {
  user: User | null
  userData: any
}

interface UserStats {
  generations: {
    total_generations: number
    image_generations: number
    video_generations: number
    upscale_generations: number
    total_credits_used: number
  }
  recent: {
    generations: any[]
    transactions: any[]
  }
}

export function DashboardContent({ user, userData }: DashboardContentProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        console.log('Stats API not available, using default values')
        // Set default stats for new users
        setStats({
          generations: {
            total_generations: 0,
            image_generations: 0,
            video_generations: 0,
            upscale_generations: 0,
            total_credits_used: 0,
          },
          recent: {
            generations: [],
            transactions: [],
          },
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Set default stats on error
      setStats({
        generations: {
          total_generations: 0,
          image_generations: 0,
          video_generations: 0,
          upscale_generations: 0,
          total_credits_used: 0,
        },
        recent: {
          generations: [],
          transactions: [],
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Generate Image',
      description: 'Create stunning images from text descriptions',
      icon: PhotoIcon,
      href: '/generate/image',
      color: 'primary',
      credits: 1,
    },
    {
      title: 'Generate Video',
      description: 'Create engaging videos from text prompts',
      icon: VideoCameraIcon,
      href: '/video',
      color: 'accent',
      credits: 5,
      badge: 'Pro',
    },
    {
      title: 'Upscale Image',
      description: 'Enhance and upscale your images',
      icon: ArrowUpIcon,
      href: '/generate/upscale',
      color: 'secondary',
      credits: 2,
    },
  ]

  const statCards = [
    {
      title: 'Total Generations',
      value: stats?.generations?.total_generations || 0,
      icon: SparklesIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Credits Used',
      value: stats?.generations?.total_credits_used || 0,
      icon: CreditCardIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Images Created',
      value: stats?.generations?.image_generations || 0,
      icon: PhotoIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Videos Created',
      value: stats?.generations?.video_generations || 0,
      icon: VideoCameraIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.firstName || 'Creator'}! 👋
            </h2>
            <p className="text-primary-100">
              Ready to create something amazing today?
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userData?.credits || 0}</div>
            <div className="text-primary-100 text-sm">credits remaining</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 bg-white text-primary-600 border-white hover:bg-primary-50"
            >
              Buy More
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className={`h-8 w-8 text-${action.color}-600`} />
                      <CardTitle className="ml-3">{action.title}</CardTitle>
                    </div>
                    {action.badge && (
                      <Badge variant="secondary" size="sm">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {action.credits} credit{action.credits > 1 ? 's' : ''}
                    </span>
                    <Link href={action.href}>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
                        Start Creating
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Generations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Recent Generations
              </CardTitle>
              <Link href="/gallery">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recent?.generations?.length ? (
              <div className="space-y-3">
                {stats.recent.generations.slice(0, 5).map((generation: any) => (
                  <div key={generation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        generation.type === 'image' ? 'bg-blue-100' :
                        generation.type === 'video' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {generation.type === 'image' && <PhotoIcon className="h-4 w-4 text-blue-600" />}
                        {generation.type === 'video' && <VideoCameraIcon className="h-4 w-4 text-purple-600" />}
                        {generation.type === 'upscale' && <ArrowUpIcon className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {generation.prompt?.substring(0, 30)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(generation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={generation.status === 'completed' ? 'success' : 
                              generation.status === 'failed' ? 'error' : 'default'}
                      size="sm"
                    >
                      {generation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No generations yet</p>
                <Link href="/generate/image">
                  <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                    Create Your First Generation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Images Generated</span>
                <span className="font-semibold">{stats?.generations?.image_generations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Videos Generated</span>
                <span className="font-semibold">{stats?.generations?.video_generations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Images Upscaled</span>
                <span className="font-semibold">{stats?.generations?.upscale_generations || 0}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Total Credits Used</span>
                  <span className="font-bold text-lg">{stats?.generations?.total_credits_used || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardContent
