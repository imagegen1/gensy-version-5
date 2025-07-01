'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  CloudArrowUpIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void
  acceptedFormats?: string[]
  maxSize?: number
  disabled?: boolean
}

export function ImageDropzone({
  onImageSelect,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false
}: ImageDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0])
    }
  }, [onImageSelect])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFormats.map(format => format.replace('image/', '.'))
    },
    maxSize,
    multiple: false,
    disabled
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAcceptedFormatsText = () => {
    return acceptedFormats
      .map(format => format.replace('image/', '').toUpperCase())
      .join(', ')
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject
            ? 'border-blue-400 bg-blue-50'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {isDragReject ? (
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
            ) : (
              <div className="relative">
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                <PhotoIcon className="h-6 w-6 text-gray-500 absolute -bottom-1 -right-1" />
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
                <p className="text-blue-600 font-medium">
                  Drop your image here...
                </p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Drag and drop your image here
                </p>
                <p className="text-gray-500">
                  or <span className="text-blue-600 font-medium">browse files</span>
                </p>
              </div>
            )}
          </div>

          {/* File Requirements */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Supported formats: {getAcceptedFormatsText()}</p>
            <p>Maximum file size: {formatFileSize(maxSize)}</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
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
                          ? `File is too large. Maximum size is ${formatFileSize(maxSize)}.`
                          : error.code === 'file-invalid-type'
                          ? `Invalid file type. Supported formats: ${getAcceptedFormatsText()}.`
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
    </div>
  )
}
