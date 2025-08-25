'use client'

import React from 'react'
import Image from 'next/image'

interface UserAvatarProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
}

export function UserAvatar({ src, alt, size = 'sm' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-none`}>
      <Image
        src={src}
        alt={alt}
        width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        className="w-full h-full object-cover"
      />
    </div>
  )
}