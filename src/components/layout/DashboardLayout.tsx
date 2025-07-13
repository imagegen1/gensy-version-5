/**
 * Dashboard Layout Component for Gensy AI Creative Suite
 * Main layout wrapper for authenticated dashboard pages
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { LoadingPage } from '@/components/ui'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Test mode for development - bypass authentication
  const isTestMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true'

  // Fetch user credits on mount
  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits || 0)
      } else if (response.status === 401) {
        // User not authenticated, redirect to sign in (unless in test mode)
        if (!isTestMode) {
          window.location.href = '/auth/sign-in'
          return
        } else {
          // In test mode, set default credits
          setUserCredits(1000)
        }
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while fetching initial data
  if (isLoading) {
    return <LoadingPage message="Loading Gensy..." />
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          userCredits={userCredits}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {/* Page header */}
          {(title || description) && (
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 py-6 lg:px-6">
                <div className="lg:flex lg:items-center lg:justify-between">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <div className="px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
