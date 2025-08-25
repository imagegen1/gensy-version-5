'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { 
  AlertBanner, 
  NavigationHeader, 
  FigmaGallery, 
  ToolCategoryCard, 
  PromotionalBanner, 
  CallToActionSection 
} from '@/components/dashboard2'
import { mockRootProps } from '@/app/dashboard2MockData'

export default function Dashboard2Page() {
  const [showAlert, setShowAlert] = useState(mockRootProps.showAlert)

  return (
    <div className="min-h-screen bg-white">
      {/* Alert Banner */}
      {showAlert && (
        <AlertBanner 
          message={mockRootProps.alertMessage}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Main Content */}
      <main className="pt-20 pb-8">
        {/* Hero Section - Promotional Banners */}
        <div className="px-4 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {mockRootProps.promotionalBanners.map((banner) => (
              <PromotionalBanner key={banner.id} banner={banner} />
            ))}
          </div>
        </div>

        {/* Creation Components - Tool Categories Grid */}
        <div className="px-4 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {mockRootProps.toolCategories.map((category) => (
              <ToolCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>

        {/* Gallery Section Header */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-black">Gallery</h1>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700 text-xs font-medium p-0 h-auto flex items-center gap-1"
            >
              Open Gallery
            </Button>
          </div>
        </div>

        {/* Figma Gallery */}
        <FigmaGallery />

        {/* Call to Action Section */}
        <CallToActionSection />

        {/* Generate Section */}
        <div className="px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-black">Generate</h2>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700 text-xs font-medium p-0 h-auto flex items-center gap-1"
            >
              Show all
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}