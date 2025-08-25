'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'

interface AlertBannerProps {
  message: string
  onDismiss: () => void
}

export function AlertBanner({ message, onDismiss }: AlertBannerProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex items-center justify-between">
        <p className="text-sm font-medium text-black flex-1 pr-4">
          {message}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6 py-2 text-sm font-medium"
        >
          Upgrade
        </Button>
      </div>
    </div>
  )
}