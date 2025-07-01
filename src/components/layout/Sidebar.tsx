/**
 * Sidebar Navigation Component for Gensy AI Creative Suite
 * Main navigation sidebar for the dashboard
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  SparklesIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowUpIcon,
  FolderIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon,
  TagIcon,
} from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Overview and quick actions',
  },
  {
    name: 'Generate Image',
    href: '/generate/image',
    icon: PhotoIcon,
    description: 'Create images with AI',
  },
  {
    name: 'Generate Video',
    href: '/video',
    icon: VideoCameraIcon,
    description: 'Create videos with AI',
    badge: 'Pro',
  },
  {
    name: 'Upscale Image',
    href: '/generate/upscale',
    icon: ArrowUpIcon,
    description: 'Enhance image quality',
  },
  {
    name: 'Gallery',
    href: '/gallery',
    icon: FolderIcon,
    description: 'Your creations',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    description: 'Usage statistics',
  },
  {
    name: 'Pricing',
    href: '/pricing',
    icon: TagIcon,
    description: 'Subscription plans',
  },
  {
    name: 'Credits',
    href: '/credits',
    icon: BanknotesIcon,
    description: 'Purchase credits',
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCardIcon,
    description: 'Billing and payments',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'Account preferences',
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Gensy</h1>
              <p className="text-xs text-gray-500">AI Creative Suite</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={onClose}
                >
                  <Icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <Link
              href="/settings/profile"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <UserIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Profile Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
