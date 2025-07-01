/**
 * Toast Component for Gensy AI Creative Suite
 * Notification system with different types and animations
 */

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    console.error('useToast must be used within a ToastProvider')
    // Return a fallback object instead of throwing
    return {
      toasts: [],
      addToast: (toast: Omit<Toast, 'id'>) => {
        console.warn('Toast not available:', toast)
      },
      removeToast: (id: string) => {
        console.warn('Toast not available for removal:', id)
      },
      clearToasts: () => {
        console.warn('Toast not available for clearing')
      }
    }
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  const toastContent = (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )

  if (typeof window !== 'undefined') {
    const toastRoot = document.getElementById('toast-root')
    if (toastRoot) {
      return createPortal(toastContent, toastRoot)
    }
  }

  return toastContent
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={clsx(
        'flex items-start p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full',
        colors[toast.type]
      )}
    >
      <Icon className={clsx('h-5 w-5 mt-0.5 mr-3 flex-shrink-0', iconColors[toast.type])} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action && (
          <div className="mt-2">
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

// Helper functions for common toast types
export const toast = {
  success: (title: string, description?: string, options?: Partial<Toast>) => {
    try {
      const { addToast } = useToast()
      addToast({ type: 'success', title, description, ...options })
    } catch (error) {
      console.warn('Toast not available:', { type: 'success', title, description })
    }
  },
  error: (title: string, description?: string, options?: Partial<Toast>) => {
    try {
      const { addToast } = useToast()
      addToast({ type: 'error', title, description, ...options })
    } catch (error) {
      console.warn('Toast not available:', { type: 'error', title, description })
    }
  },
  warning: (title: string, description?: string, options?: Partial<Toast>) => {
    try {
      const { addToast } = useToast()
      addToast({ type: 'warning', title, description, ...options })
    } catch (error) {
      console.warn('Toast not available:', { type: 'warning', title, description })
    }
  },
  info: (title: string, description?: string, options?: Partial<Toast>) => {
    try {
      const { addToast } = useToast()
      addToast({ type: 'info', title, description, ...options })
    } catch (error) {
      console.warn('Toast not available:', { type: 'info', title, description })
    }
  },
}
