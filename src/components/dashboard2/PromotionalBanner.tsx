'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { PromotionalBanner as PromotionalBannerType } from '@/app/dashboard2MockData'

interface PromotionalBannerProps {
  banner: PromotionalBannerType
}

export function PromotionalBanner({ banner }: PromotionalBannerProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden w-full h-96 group cursor-pointer">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={banner.backgroundImage}
          alt={banner.heading}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)'
        }}
      />
      
      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div>
          <span className="inline-block bg-white/10 backdrop-blur-sm text-white/75 text-xs font-medium uppercase tracking-wide px-3 py-1 rounded-full">
            {banner.title}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-white text-3xl font-medium leading-tight mb-2">
              {banner.heading}
            </h2>
            <p className="text-white/80 text-sm font-medium leading-relaxed whitespace-pre-line">
              {banner.description}
            </p>
          </div>
          
          <Button
            variant="ghost"
            className="text-black bg-white hover:bg-gray-100 font-medium px-6 py-2 rounded-lg text-sm"
          >
            {banner.ctaText}
          </Button>
        </div>
      </div>
    </div>
  )
}