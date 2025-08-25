'use client'

import React from 'react'
import { Button } from '@/components/ui'
import ChevronRightIcon from '@/components/icons/ChevronRightIcon'
import PlusIcon from '@/components/icons/PlusIcon'

export function CallToActionSection() {
  return (
    <div className="text-center py-12 px-4">
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-medium text-black">
          Explore prompts & styles. Remix images. Get inspired.
        </h2>
        <p className="text-lg font-medium text-black">
          Open our community gallery.
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-3 font-medium text-sm flex items-center gap-2">
          <ChevronRightIcon width={13} height={11} color="white" />
          Open Gallery
        </Button>
        
        <span className="text-black font-normal">or</span>
        
        <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-8 py-3 font-medium text-sm shadow-lg flex items-center gap-2">
          <PlusIcon width={14} height={14} color="white" />
          Share your generations
        </Button>
      </div>
    </div>
  )
}