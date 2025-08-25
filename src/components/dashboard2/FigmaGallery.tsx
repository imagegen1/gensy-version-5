'use client'

import React from 'react'
import Image from 'next/image'

interface GalleryImageData {
  id: string
  src: string
  alt: string
  width: number
  height: number
}

const galleryImages: GalleryImageData[] = [
  { id: '1', src: '/figma-gallery/image-1.png', alt: 'Artistic portrait with red mask', width: 352, height: 469 },
  { id: '2', src: '/figma-gallery/image-2.jpg', alt: 'Dark artistic composition', width: 352, height: 469 },
  { id: '3', src: '/figma-gallery/image-3.jpg', alt: 'Portrait with pale complexion', width: 352, height: 201 },
  { id: '4', src: '/figma-gallery/image-4.png', alt: 'Dark artistic portrait', width: 352, height: 201 },
  { id: '5', src: '/figma-gallery/image-5.png', alt: 'Futuristic goggles portrait', width: 352, height: 514 },
  { id: '6', src: '/figma-gallery/image-6.jpg', alt: 'Pottery artisan at work', width: 352, height: 514 },
  { id: '7', src: '/figma-gallery/image-7.png', alt: 'Blue and orange lighting portrait', width: 352, height: 615 },
  { id: '8', src: '/figma-gallery/image-8.png', alt: 'Woman on striped surface', width: 352, height: 264 },
  { id: '9', src: '/figma-gallery/image-9.jpg', alt: 'Red lips with metallic teeth', width: 352, height: 469 },
  { id: '10', src: '/figma-gallery/image-10.png', alt: 'Triangular light silhouette', width: 352, height: 514 },
  { id: '11', src: '/figma-gallery/image-11.png', alt: 'Futuristic sunglasses portrait', width: 352, height: 240 },
  { id: '12', src: '/figma-gallery/image-12.png', alt: 'Person in green shirt', width: 352, height: 201 },
  { id: '13', src: '/figma-gallery/image-13.jpg', alt: 'Blue orange gradient portrait', width: 352, height: 468 },
  { id: '14', src: '/figma-gallery/image-14.png', alt: 'Bicycle in golden hour', width: 352, height: 452 },
  { id: '15', src: '/figma-gallery/image-15.png', alt: 'Two people in sunset field', width: 352, height: 352 },
  { id: '16', src: '/figma-gallery/image-16.png', alt: 'Three people artistic portrait', width: 352, height: 514 },
]

export function FigmaGallery() {
  return (
    <div className="px-4">
      <div className="border border-black/10 rounded-sm p-6">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-0">
          {galleryImages.map((image) => (
            <div key={image.id} className="break-inside-avoid mb-6">
              <div className="rounded-lg overflow-hidden border-none">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}