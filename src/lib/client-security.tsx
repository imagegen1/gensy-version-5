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
    // Server-side: comprehensive sanitization with iterative replacement
    let sanitized = dirty
    let previous: string

    // Apply sanitization repeatedly until no more changes occur
    do {
      previous = sanitized

      // Remove dangerous protocols first
      sanitized = sanitized
        .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
        .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
        .replace(/data\s*:/gi, '') // Remove data: protocol

      // Remove event handlers with comprehensive patterns
      sanitized = sanitized
        .replace(/\bon\w+\s*=/gi, '') // Remove event handlers (word boundary)
        .replace(/\s+on\w+\s*=/gi, '') // Remove spaced event handlers
        .replace(/on[a-z]+\s*=/gi, '') // Remove lowercase event handlers

      // Remove dangerous tags using simple character-based approach
      sanitized = sanitized
        .replace(/<\s*script\b/gi, '&lt;script') // Neutralize script opening tags
        .replace(/<\s*\/\s*script\s*>/gi, '&lt;/script&gt;') // Neutralize script closing tags
        .replace(/<\s*iframe\b/gi, '&lt;iframe') // Neutralize iframe opening tags
        .replace(/<\s*\/\s*iframe\s*>/gi, '&lt;/iframe&gt;') // Neutralize iframe closing tags
        .replace(/<\s*object\b/gi, '&lt;object') // Neutralize object opening tags
        .replace(/<\s*\/\s*object\s*>/gi, '&lt;/object&gt;') // Neutralize object closing tags
        .replace(/<\s*embed\b/gi, '&lt;embed') // Neutralize embed opening tags
        .replace(/<\s*\/\s*embed\s*>/gi, '&lt;/embed&gt;') // Neutralize embed closing tags

      // Additional comprehensive sanitization
      sanitized = sanitized
        .replace(/script/gi, 'scr1pt') // Neutralize script text
        .replace(/iframe/gi, '1frame') // Neutralize iframe text
        .replace(/object/gi, '0bject') // Neutralize object text
        .replace(/embed/gi, '3mbed') // Neutralize embed text

    } while (sanitized !== previous)

    // Final cleanup - remove remaining HTML tags
    return sanitized.replace(/<[^>]*>/g, '')
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

  let sanitized = text
  let previous: string

  // Apply sanitization repeatedly until no more changes occur
  do {
    previous = sanitized
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
      .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
      .replace(/data\s*:/gi, '') // Remove data: protocol
      .replace(/\bon\w+\s*=/gi, '') // Remove event handlers (word boundary)
      .replace(/\s+on\w+\s*=/gi, '') // Remove spaced event handlers
      .replace(/script/gi, 'scr1pt') // Neutralize script text
      .replace(/iframe/gi, '1frame') // Neutralize iframe text
  } while (sanitized !== previous)

  return sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Sanitize content for use in HTML attributes (title, alt, etc.)
 */
export function sanitizeAttribute(value: string): string {
  if (!value) return ''

  let sanitized = value
  let previous: string

  // Apply sanitization repeatedly until no more changes occur
  do {
    previous = sanitized
    sanitized = sanitized
      .replace(/[<>"'`]/g, '') // Remove HTML-sensitive characters including backticks
      .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
      .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
      .replace(/data\s*:/gi, '') // Remove data: protocol
      .replace(/\bon\w+\s*=/gi, '') // Remove event handlers (word boundary)
      .replace(/\s+on\w+\s*=/gi, '') // Remove spaced event handlers
      .replace(/script/gi, 'scr1pt') // Neutralize script text
      .replace(/iframe/gi, '1frame') // Neutralize iframe text
  } while (sanitized !== previous)

  return sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
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
  // Additional validation before sanitization
  if (!html || typeof html !== 'string') {
    return <Tag className={className} />
  }

  // Limit HTML length to prevent DoS attacks
  const maxLength = 10000
  const truncatedHtml = html.length > maxLength ? html.substring(0, maxLength) + '...' : html

  const sanitizedHtml = sanitizeHtml(truncatedHtml)

  // Double-check that sanitization worked
  if (!sanitizedHtml || sanitizedHtml.trim() === '') {
    return <Tag className={className} />
  }

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

/**
 * Comprehensive URL validation and sanitization
 */
export function validateUrl(url: string, allowedHosts?: string[]): { isValid: boolean; sanitizedUrl?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required and must be a string' }
  }

  try {
    // Remove dangerous protocols and characters
    const cleanUrl = url
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()

    // Parse URL
    const parsedUrl = new URL(cleanUrl)

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: `Invalid protocol: ${parsedUrl.protocol}` }
    }

    // Check against allowed hosts if provided
    if (allowedHosts && allowedHosts.length > 0) {
      const isAllowed = allowedHosts.some(host =>
        parsedUrl.hostname === host ||
        parsedUrl.hostname.endsWith('.' + host)
      )

      if (!isAllowed) {
        return { isValid: false, error: `Host not allowed: ${parsedUrl.hostname}` }
      }
    }

    // Additional security checks
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      return { isValid: false, error: 'Localhost URLs not allowed' }
    }

    return { isValid: true, sanitizedUrl: parsedUrl.toString() }
  } catch (error) {
    return { isValid: false, error: `Invalid URL format: ${error}` }
  }
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
