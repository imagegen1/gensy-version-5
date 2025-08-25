'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { ToolCategory } from '@/app/dashboard2MockData'
import ImageIcon from '@/components/icons/ImageIcon'
import VideoIcon from '@/components/icons/VideoIcon'
import RealtimeIcon from '@/components/icons/RealtimeIcon'
import EnhanceIcon from '@/components/icons/EnhanceIcon'
import EditIcon from '@/components/icons/EditIcon'
import LipsyncIcon from '@/components/icons/LipsyncIcon'
import MotionIcon from '@/components/icons/MotionIcon'
import TrainIcon from '@/components/icons/TrainIcon'

interface ToolCategoryCardProps {
  category: ToolCategory
}

const iconMap = {
  'image': ImageIcon,
  'video': VideoIcon,
  'realtime': RealtimeIcon,
  'enhancer': EnhanceIcon,
  'edit': EditIcon,
  'video-lipsync': LipsyncIcon,
  'motion-transfer': MotionIcon,
  'train': TrainIcon,
}

export function ToolCategoryCard({ category }: ToolCategoryCardProps) {
  const IconComponent = iconMap[category.id as keyof typeof iconMap]

  return (
    <div className="relative">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
        style={{ 
          background: category.gradient || '#f3f4f6',
          boxShadow: 'inset 0px 1px 5px rgba(255, 255, 255, 0.10), inset 0px 1px 1px rgba(255, 255, 255, 0.10), inset 0px 0px 0px 0.5px rgba(0, 0, 0, 0.10)'
        }}
      >
        {IconComponent && (
          <IconComponent width={24} height={24} color="white" />
        )}
      </div>
      
      <div className="mt-1">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-black leading-tight">
            {category.name}
          </h3>
          {category.isNew && (
            <span className="bg-black text-white text-xs font-medium px-2 py-0.5 rounded-md">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1 leading-tight whitespace-pre-line">
          {category.description}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-medium text-black hover:bg-gray-100 p-0 h-auto mt-2"
        >
          Open
        </Button>
      </div>
    </div>
  )
}