/**
 * Header Component for Gensy AI Creative Suite
 * Top navigation bar with user info and actions
 */

'use client'

import React from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { Button, Badge } from '@/components/ui'

interface HeaderProps {
  onMenuClick?: () => void
  userCredits?: number
}

export function Header({ onMenuClick, userCredits = 0 }: HeaderProps) {
  // We'll get user data from the server-side props instead of useUser hook

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-8 h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-gray-900">Gensy</span>
        </div>

        {/* Center Navigation - Icon-based */}
        <nav className="flex items-center space-x-1 bg-gray-50 rounded-full p-1">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200">
            <SparklesIcon className="h-4 w-4" />
            <span>Generate</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200">
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>Enhance</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200">
            <BellIcon className="h-4 w-4" />
            <span>Gallery</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Credits */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2">
            <CreditCardIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{userCredits}</span>
            <span className="text-xs text-gray-500">credits</span>
          </div>

          {/* Upgrade Button */}
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            <SparklesIcon className="h-4 w-4" />
            <span>Upgrade</span>
          </button>

          {/* User Profile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>


    </header>
  )
}

export default Header
