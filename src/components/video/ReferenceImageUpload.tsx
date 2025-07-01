'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { 
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ReferenceImageUploadProps {
  onImageSelect: (imageData: string) => void
  disabled?: boolean
}

export function ReferenceImageUpload({
  onImageSelect,
  disabled = false
}: ReferenceImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled) {
      const file = acceptedFiles[0]
      setIsProcessing(true)

      try {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
        setSelectedImage(file)

        // Convert to base64 for API
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
          onImageSelect(base64Data)
        }
        reader.readAsDataURL(file)

      } catch (error) {
        console.error('Error processing image:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }, [onImageSelect, disabled])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled
  })

  const handleRemove = () => {
    setSelectedImage(null)
    setImagePreview('')
    onImageSelect('')
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {!selectedImage ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive && !isDragReject 
              ? 'border-primary-400 bg-primary-50' 
              : isDragReject 
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-3">
            {/* Icon */}
            <div className="flex justify-center">
              {isDragReject ? (
                <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
              ) : (
                <div className="relative">
                  <CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
                  <PhotoIcon className="h-5 w-5 text-gray-500 absolute -bottom-1 -right-1" />
                </div>
              )}
            </div>

            {/* Text */}
            <div>
              {isDragActive ? (
                isDragReject ? (
                  <p className="text-red-600 font-medium">
                    File type not supported
                  </p>
                ) : (
                  <p className="text-primary-600 font-medium">
                    Drop your reference image here...
                  </p>
                )
              ) : (
                <div className="space-y-1">
                  <p className="text-base font-medium text-gray-900">
                    Upload reference image
                  </p>
                  <p className="text-sm text-gray-500">
                    or <span className="text-primary-600 font-medium">browse files</span>
                  </p>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported: JPEG, PNG, WebP</p>
              <p>Maximum size: 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <div className="aspect-video w-full relative">
              <Image
                src={imagePreview}
                alt="Reference image"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Remove Button */}
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Image Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <PhotoIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-800 mb-1">Reference Image</h4>
                <div className="space-y-1 text-blue-700">
                  <div className="flex justify-between">
                    <span>Filename:</span>
                    <span className="font-medium truncate ml-2" title={selectedImage.name}>
                      {selectedImage.name.length > 25 
                        ? `${selectedImage.name.substring(0, 25)}...` 
                        : selectedImage.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(selectedImage.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{selectedImage.type.replace('image/', '').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">{file.name}</p>
                  <ul className="text-red-700 mt-1 space-y-1">
                    {errors.map((error) => (
                      <li key={error.code}>
                        {error.code === 'file-too-large' 
                          ? 'File is too large. Maximum size is 10MB.'
                          : error.code === 'file-invalid-type'
                          ? 'Invalid file type. Supported formats: JPEG, PNG, WebP.'
                          : error.message
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Reference Image Tips:</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Use clear, high-quality images for best results</li>
          <li>• The AI will use this image to guide style, composition, and mood</li>
          <li>• Works best with images that match your desired video style</li>
          <li>• The reference image won't appear directly in the video</li>
        </ul>
      </div>

      {isProcessing && (
        <div className="text-center text-sm text-gray-500">
          Processing image...
        </div>
      )}
    </div>
  )
}
