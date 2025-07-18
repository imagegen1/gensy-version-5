/**
 * Security Configuration for Gensy AI Creative Suite
 * This file contains security utilities and configurations
 */

import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { env } from './env'

// Security headers configuration
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.gensy.ai https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://api.clerk.com https://*.supabase.co https://api.replicate.com https://api.phonepe.com https://vertex-ai.googleapis.com",
    "frame-src 'self' https://clerk.gensy.ai",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// Rate limiting configuration
export const rateLimits = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  // Image generation
  imageGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour
  },
  // Video generation
  videoGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 videos per hour
  },
  // Authentication
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
  },
  // File uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
  }
}

// File validation
export const fileValidation = {
  images: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: env.NEXT_PUBLIC_MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    maxDimensions: {
      width: 4096,
      height: 4096
    }
  },
  videos: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 60 // 60 seconds
  }
}

// Encryption utilities
export class Encryption {
  private static algorithm = 'aes-256-gcm'
  private static key = Buffer.from(env.ENCRYPTION_KEY, 'utf8')

  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.key)
    cipher.setAAD(Buffer.from('gensy-ai', 'utf8'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key)
    decipher.setAAD(Buffer.from('gensy-ai', 'utf8'))
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Validation schemas using Zod for robust security
export const securitySchemas = {
  // Safe string validation - prevents XSS and injection attacks
  safeString: z.string()
    .min(1, 'String cannot be empty')
    .max(1000, 'String too long')
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      'String contains potentially dangerous content'
    ),

  // Prompt validation for AI generation
  prompt: z.string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(500, 'Prompt too long')
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      'Prompt contains potentially dangerous content'
    ),

  // Filename validation - prevents path traversal and injection
  filename: z.string()
    .min(1, 'Filename cannot be empty')
    .max(255, 'Filename too long')
    .refine(
      (val) => !/[<>:"|?*\x00-\x1f]/.test(val),
      'Filename contains invalid characters'
    )
    .refine(
      (val) => !/(^\.\.?$|^\.|\.\.\/|\/\.\.|^\/|\\)/.test(val),
      'Filename contains path traversal attempts'
    ),

  // URL validation - prevents SSRF and malicious redirects
  trustedUrl: z.string()
    .url('Invalid URL format')
    .refine(
      (val) => {
        try {
          const url = new URL(val)
          // Only allow HTTPS (except localhost for development)
          if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
            return false
          }
          // Block private IP ranges and localhost in production
          if (env.NODE_ENV === 'production') {
            const hostname = url.hostname
            if (
              hostname === 'localhost' ||
              hostname === '127.0.0.1' ||
              hostname.startsWith('192.168.') ||
              hostname.startsWith('10.') ||
              hostname.startsWith('172.')
            ) {
              return false
            }
          }
          return true
        } catch {
          return false
        }
      },
      'URL is not from a trusted source'
    ),

  // Specific validation for our storage domains
  storageUrl: z.string()
    .url('Invalid URL format')
    .refine(
      (val) => {
        try {
          const url = new URL(val)
          const allowedDomains = [
            'storage.googleapis.com',
            'storage.cloud.google.com',
            'r2.cloudflarestorage.com',
            'pub-b73a86bd5ccf4cc7bba9daf3c7fb363e.r2.dev'
          ]
          return allowedDomains.includes(url.hostname)
        } catch {
          return false
        }
      },
      'URL is not from an allowed storage domain'
    )
}

// Input sanitization using Zod validation
export class Sanitizer {
  static sanitizeString(input: string): string {
    try {
      return securitySchemas.safeString.parse(input.trim())
    } catch (error) {
      throw new Error('Invalid string input: contains potentially dangerous content')
    }
  }

  static sanitizePrompt(prompt: string): string {
    try {
      return securitySchemas.prompt.parse(prompt.trim())
    } catch (error) {
      throw new Error('Invalid prompt: contains potentially dangerous content or is too long')
    }
  }

  static sanitizeFilename(filename: string): string {
    try {
      // First clean the filename by removing/replacing problematic characters
      const cleaned = filename
        .replace(/[<>:"|?*\x00-\x1f]/g, '_')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
        .substring(0, 255)

      return securitySchemas.filename.parse(cleaned)
    } catch (error) {
      throw new Error('Invalid filename: contains dangerous characters or path traversal attempts')
    }
  }

  static validateUrl(url: string, type: 'trusted' | 'storage' = 'trusted'): string {
    try {
      const schema = type === 'storage' ? securitySchemas.storageUrl : securitySchemas.trustedUrl
      return schema.parse(url)
    } catch (error) {
      throw new Error(`Invalid ${type} URL: ${error instanceof z.ZodError ? error.errors[0]?.message : 'Unknown validation error'}`)
    }
  }
}

// Request validation
export class RequestValidator {
  static validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type')
    if (!contentType) return false
    
    return allowedTypes.some(type => contentType.includes(type))
  }

  static validateFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize
  }

  static validateImageDimensions(width: number, height: number): boolean {
    const { maxDimensions } = fileValidation.images
    return width > 0 && height > 0 && 
           width <= maxDimensions.width && 
           height <= maxDimensions.height
  }

  static async validateRequest(request: NextRequest): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check required headers
    const userAgent = request.headers.get('user-agent')
    if (!userAgent) {
      errors.push('User-Agent header is required')
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ]

    if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      errors.push('Suspicious user agent detected')
    }

    // Validate origin for POST requests
    if (request.method === 'POST') {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      
      if (!origin && !referer) {
        errors.push('Origin or Referer header required for POST requests')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Security middleware helper
export function withSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Add security headers
    const response = await handler(req)
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

// CSRF protection
export class CSRFProtection {
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    )
  }
}

// API key validation
export class APIKeyValidator {
  static validateAPIKey(apiKey: string, expectedKey: string): boolean {
    if (!apiKey || !expectedKey) return false
    return crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(expectedKey)
    )
  }

  static hashAPIKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }
}

// Security audit logging
export class SecurityAudit {
  static logSecurityEvent(event: {
    type: 'auth_failure' | 'rate_limit' | 'invalid_request' | 'suspicious_activity'
    ip: string
    userAgent?: string
    details?: Record<string, any>
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.type,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      severity: event.type === 'suspicious_activity' ? 'high' : 'medium'
    }

    // In production, send to monitoring service
    if (env.NODE_ENV === 'production') {
      // Send to Sentry, DataDog, or other monitoring service
      console.error('[SECURITY_AUDIT]', logEntry)
    } else {
      console.warn('[SECURITY_AUDIT]', logEntry)
    }
  }
}
