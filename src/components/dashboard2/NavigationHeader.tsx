'use client'

import React from 'react'
import { Button } from '@/components/ui'

export function NavigationHeader() {
  return (
    <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 mt-2">
      <nav className="backdrop-blur-xl bg-gray-100/75 rounded-2xl px-6 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-black hover:bg-gray-200/50 px-4 py-2 rounded-xl"
          >
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-black hover:bg-gray-200/50 px-4 py-2 rounded-xl"
          >
            Gallery
          </Button>
        </div>
      </nav>
    </header>
  )
}