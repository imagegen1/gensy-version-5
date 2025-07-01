'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  XMarkIcon,
  InformationCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface ImagePreviewProps {
  image: File
  onRemove: () => void
  disabled?: boolean
}

export function ImagePreview({ 
  image, 
  onRemove, 
  disabled = false 
}: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageInfo, setImageInfo] = useState<{
    width: number
    height: number
    size: string
    type: string
  } | null>(null)

  useEffect(() => {
    // Create object URL for preview
    const url = URL.createObjectURL(image)
    setImageUrl(url)

    // Get image dimensions
    const img = new window.Image()
    img.onload = () => {
      setImageInfo({
        width: img.width,
        height: img.height,
        size: formatFileSize(image.size),
        type: image.type
      })
    }
    img.src = url

    // Cleanup
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [image])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeDisplay = (type: string) => {
    return type.replace('image/', '').toUpperCase()
  }

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <div className="aspect-video w-full relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Remove Button */}
        {!disabled && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Image Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-800 mb-2">Image Information</h4>
            <div className="space-y-1 text-blue-700">
              <div className="flex justify-between">
                <span>Filename:</span>
                <span className="font-medium truncate ml-2" title={image.name}>
                  {image.name.length > 30 ? `${image.name.substring(0, 30)}...` : image.name}
                </span>
              </div>
              
              {imageInfo && (
                <>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-medium">{imageInfo.width} × {imageInfo.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-medium">{imageInfo.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium">{getFileTypeDisplay(imageInfo.type)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upscaling Preview */}
      {imageInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-800 mb-3">Upscaling Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">2x Scale</div>
              <div className="font-medium text-gray-900">
                {imageInfo.width * 2} × {imageInfo.height * 2}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">4x Scale</div>
              <div className="font-medium text-gray-900">
                {imageInfo.width * 4} × {imageInfo.height * 4}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">8x Scale</div>
              <div className="font-medium text-gray-900">
                {imageInfo.width * 8} × {imageInfo.height * 8}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
