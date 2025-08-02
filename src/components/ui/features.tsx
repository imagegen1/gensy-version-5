"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color?: string
}

interface FeaturesProps {
  features: Feature[]
  title?: string
  subtitle?: string
  description?: string
  className?: string
  columns?: 2 | 3 | 4
}

export function Features({ 
  features, 
  title = "Features", 
  subtitle,
  description,
  className,
  columns = 3 
}: FeaturesProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={cn("py-16 px-4", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {subtitle && (
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
              {subtitle}
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className={cn("grid gap-8", gridCols[columns])}>
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full">
                {/* Icon */}
                <div 
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full mb-4 transition-transform duration-300 group-hover:scale-110",
                    feature.color ? `bg-${feature.color}-100 text-${feature.color}-600` : "bg-blue-100 text-blue-600"
                  )}
                >
                  {feature.icon}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Example usage component
export function GensyFeatures() {
  const features: Feature[] = [
    {
      id: 'lightning-fast',
      title: 'Lightning Fast',
      description: 'Generate high-quality content in seconds with our optimized AI infrastructure and cutting-edge models.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      color: 'yellow'
    },
    {
      id: 'enterprise-security',
      title: 'Enterprise Security',
      description: 'Your data is protected with enterprise-grade security, encryption, and privacy controls you can trust.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      color: 'green'
    },
    {
      id: 'multiple-models',
      title: 'Multiple AI Models',
      description: 'Access 15+ cutting-edge AI models including Flux, Imagen, DALL-E, ByteDance Seeded, and Google Veo.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" /></svg>,
      color: 'purple'
    },
    {
      id: 'easy-export',
      title: 'Easy Export',
      description: 'Download your creations in multiple formats with dynamic naming and organize your creative library.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>,
      color: 'blue'
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      description: 'Work together with your team, share projects, and manage creative workflows seamlessly.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      color: 'indigo'
    },
    {
      id: 'advanced-controls',
      title: 'Advanced Controls',
      description: 'Fine-tune your generations with advanced parameters, styles, and quality settings for perfect results.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'red'
    }
  ]

  return (
    <Features
      features={features}
      title="Powerful Features for Creative Professionals"
      subtitle="Why Choose Gensy"
      description="Discover the advanced capabilities that make Gensy the ultimate AI creative platform"
      className="bg-gray-50"
    />
  )
}
