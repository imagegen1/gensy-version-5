/**
 * Security Configuration for Gensy AI Creative Suite
 * This file contains security utilities and configurations
 */

import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
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

// Input sanitization
export class Sanitizer {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000) // Limit length
  }

  static sanitizePrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/[<>]/g, '')
      .replace(/\b(script|javascript|vbscript|onload|onerror)\b/gi, '')
      .substring(0, 500) // Limit prompt length
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .substring(0, 255) // Limit filename length
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
