'use client'

import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface AIModel {
  id: string
  name: string
  display_name: string
  status: 'active' | 'inactive' | 'maintenance' | 'generating'
  pricing_credits: number
  description?: string
}

interface ModelSidebarProps {
  isOpen: boolean
  onClose: () => void
  models: AIModel[]
  selectedModel: string
  onModelSelect: (modelName: string) => void
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'generating':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <div className="w-2 h-2 bg-orange-400 rounded-full mr-1 animate-pulse"></div>
          GENERATING
        </span>
      )
    case 'maintenance':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          MAINTENANCE
        </span>
      )
    case 'inactive':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          OFFLINE
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
          ACTIVE
        </span>
      )
  }
}

export function ModelSidebar({ isOpen, onClose, models, selectedModel, onModelSelect }: ModelSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:w-80 bg-white border-r border-gray-200 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">AI Models</h2>
              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Choose your video generation model</p>
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => onModelSelect(model.name)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedModel === model.name
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {model.display_name}
                      </h3>
                      {selectedModel === model.name && (
                        <CheckIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      {getStatusBadge(model.status)}
                      <span className="text-xs text-gray-500 font-medium">
                        {model.pricing_credits} credits
                      </span>
                    </div>
                    
                    {model.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">AI Models</h2>
                <button
                  type="button"
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Models List */}
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => {
                      onModelSelect(model.name)
                      onClose()
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedModel === model.name
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {model.display_name}
                          </h3>
                          {selectedModel === model.name && (
                            <CheckIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {getStatusBadge(model.status)}
                          <span className="text-xs text-gray-500 font-medium">
                            {model.pricing_credits} credits
                          </span>
                        </div>

                        {model.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {model.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
