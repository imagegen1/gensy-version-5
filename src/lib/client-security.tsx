/**
 * Client-side Security Utilities for React Components
 * Handles XSS prevention and input sanitization in the browser
 */

import React from 'react'
import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this when you need to render user-controlled HTML content
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string or basic text sanitization
    return dirty.replace(/<[^>]*>/g, '')
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  })
}

/**
 * Sanitize text content for safe display
 * Use this for user prompts, error messages, and other text content
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize content for use in HTML attributes (title, alt, etc.)
 */
export function sanitizeAttribute(value: string): string {
  if (!value) return ''
  
  return value
    .replace(/[<>"']/g, '') // Remove HTML-sensitive characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 200) // Limit length for attributes
}

/**
 * Sanitize filename for safe display and download
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'download'
  
  return filename
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Replace dangerous characters
    .replace(/\.{2,}/g, '.') // Replace multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .trim()
    .substring(0, 255) // Limit filename length
}

/**
 * Sanitize error messages for safe display
 */
export function sanitizeErrorMessage(error: string | Error): string {
  const message = error instanceof Error ? error.message : String(error)
  
  return sanitizeText(message)
    .substring(0, 500) // Limit error message length
}

/**
 * Sanitize user prompt for safe display
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt) return ''
  
  return sanitizeText(prompt)
    .substring(0, 1000) // Limit prompt length
}

/**
 * React hook for sanitizing content
 */
export function useSanitizedContent(content: string, type: 'text' | 'html' | 'attribute' | 'filename' | 'error' | 'prompt' = 'text'): string {
  switch (type) {
    case 'html':
      return sanitizeHtml(content)
    case 'attribute':
      return sanitizeAttribute(content)
    case 'filename':
      return sanitizeFilename(content)
    case 'error':
      return sanitizeErrorMessage(content)
    case 'prompt':
      return sanitizePrompt(content)
    case 'text':
    default:
      return sanitizeText(content)
  }
}

/**
 * Safe HTML component for rendering sanitized HTML
 * Use this instead of dangerouslySetInnerHTML
 */
export interface SafeHtmlProps {
  html: string
  className?: string
  tag?: keyof JSX.IntrinsicElements
}

export function SafeHtml({ html, className, tag: Tag = 'div' }: SafeHtmlProps) {
  const sanitizedHtml = sanitizeHtml(html)
  
  return (
    <Tag 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

/**
 * Validate and sanitize URL for client-side use
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol')
    }
    
    return urlObj.toString()
  } catch {
    return ''
  }
}

/**
 * Object sanitization to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    // Block prototype pollution attempts
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value)
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}
