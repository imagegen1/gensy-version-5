'use client'

import { useRouter } from 'next/navigation'
import { 
  PhotoIcon, 
  ArrowUpIcon, 
  VideoCameraIcon, 
  RectangleStackIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  badge?: string
  className?: string
}

function QuickActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  disabled = false, 
  badge,
  className = '' 
}: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow
        border border-gray-200 hover:border-blue-300 text-left
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        ${className}
      `}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {badge}
          </span>
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-blue-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  )
}

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: 'Generate Image',
      description: 'Create stunning AI-generated images from text prompts',
      icon: <PhotoIcon className="w-8 h-8" />,
      onClick: () => router.push('/generate/image'),
      badge: '1 credit'
    },
    {
      title: 'Upscale Image',
      description: 'Enhance and upscale your existing images',
      icon: <ArrowUpIcon className="w-8 h-8" />,
      onClick: () => router.push('/generate/upscale'),
      badge: '2 credits'
    },
    {
      title: 'Create Video',
      description: 'Generate short videos from images or text',
      icon: <VideoCameraIcon className="w-8 h-8" />,
      onClick: () => {
        console.log('Navigating to /video from QuickActions')
        router.push('/video')
      },
      badge: '5 credits'
    },
    {
      title: 'Batch Processing',
      description: 'Process multiple images at once',
      icon: <RectangleStackIcon className="w-8 h-8" />,
      onClick: () => router.push('/generate/batch'),
      badge: '3 credits'
    },
    {
      title: 'View Gallery',
      description: 'Browse and manage your generated content',
      icon: <SparklesIcon className="w-8 h-8" />,
      onClick: () => router.push('/gallery'),
    },
    {
      title: 'Buy Credits',
      description: 'Purchase more credits to continue creating',
      icon: <PlusIcon className="w-8 h-8" />,
      onClick: () => router.push('/pricing'),
      className: 'border-green-200 hover:border-green-300'
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <QuickActionCard
            key={index}
            title={action.title}
            description={action.description}
            icon={action.icon}
            onClick={action.onClick}
            badge={action.badge}
            className={action.className}
          />
        ))}
      </div>
    </div>
  )
}

export function FeaturedActions() {
  const router = useRouter()

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ready to create something amazing?</h3>
          <p className="mt-1 text-blue-100">Start with our most popular features</p>
        </div>
        <SparklesIcon className="w-8 h-8 text-blue-200" />
      </div>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/generate/image')}
          className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-opacity-30 transition-all"
        >
          <div className="flex items-center space-x-3">
            <PhotoIcon className="w-6 h-6" />
            <div>
              <div className="font-medium">Generate Image</div>
              <div className="text-sm text-blue-100">1 credit</div>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => {
            console.log('Navigating to /video from QuickActions button')
            router.push('/video')
          }}
          className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-opacity-30 transition-all"
        >
          <div className="flex items-center space-x-3">
            <VideoCameraIcon className="w-6 h-6" />
            <div>
              <div className="font-medium">Create Video</div>
              <div className="text-sm text-blue-100">5 credits</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export function RecentActionsWidget() {
  // This would typically fetch recent user actions
  const recentActions = [
    {
      type: 'image',
      title: 'Generated "Sunset landscape"',
      time: '2 minutes ago',
      status: 'completed'
    },
    {
      type: 'upscale',
      title: 'Upscaled portrait image',
      time: '1 hour ago',
      status: 'completed'
    },
    {
      type: 'video',
      title: 'Created animation video',
      time: '3 hours ago',
      status: 'processing'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="w-4 h-4" />
      case 'upscale':
        return <ArrowUpIcon className="w-4 h-4" />
      case 'video':
        return <VideoCameraIcon className="w-4 h-4" />
      default:
        return <SparklesIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {recentActions.map((action, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="text-gray-400">
              {getTypeIcon(action.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {action.title}
              </p>
              <p className="text-sm text-gray-500">{action.time}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
              {action.status}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  )
}
