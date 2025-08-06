/**
 * Header Component for Gensy AI Creative Suite
 * Top navigation bar with user info and actions
 */

'use client'

import React from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
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
        <div className="flex items-center">
          <Image
            src="/logo das.svg"
            alt="Gensy Logo"
            width={300}
            height={100}
            className="h-[100px] w-auto"
            priority
            style={{ height: '100px', width: 'auto' }}
          />
        </div>



        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Credits */}
          <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <CreditCardIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-800">{userCredits}</span>
            <span className="text-xs text-gray-600">credits</span>
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
            signInUrl="/auth/sign-in"
          />
        </div>
      </div>


    </header>
  )
}

export default Header
