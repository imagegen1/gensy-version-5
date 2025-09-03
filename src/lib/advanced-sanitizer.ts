/**
 * Advanced Input Sanitization for Gensy AI Creative Suite
 * 
 * Implements comprehensive input sanitization using DOMPurify and advanced validation
 * to prevent XSS and injection attacks.
 * 
 * Critical security fix for CVSS 7.8 vulnerability.
 */

import DOMPurify from 'isomorphic-dompurify'

// Sanitization configuration
const SANITIZE_CONFIG = {
  // Remove all HTML tags and attributes
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  IN_PLACE: false,
}

// Dangerous patterns to detect and remove
const DANGEROUS_PATTERNS = [
  // Script injection patterns
  /<script[^>]*>.*?<\/script>/gis,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  
  // HTML entities that could be used for obfuscation
  /&#x?[0-9a-f]+;?/gi,
  
  // CSS expression attacks
  /expression\s*\(/gi,
  /-moz-binding/gi,
  
  // Import/require statements
  /import\s+.*from/gi,
  /require\s*\(/gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  /update\s+.*set/gi,
  
  // Command injection patterns
  /\|\s*[a-z]/gi,
  /&&\s*[a-z]/gi,
  /;\s*[a-z]/gi,
  /`[^`]*`/g,
  /\$\([^)]*\)/g,
]

// URL validation patterns
const SAFE_URL_PATTERN = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/
const SAFE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/

/**
 * Advanced sanitizer class with multiple sanitization methods
 */
export class AdvancedSanitizer {
  /**
   * Sanitize HTML content by removing all tags and dangerous content
   */
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    try {
      // First pass: DOMPurify sanitization
      let sanitized = DOMPurify.sanitize(input, SANITIZE_CONFIG)
      
      // Second pass: Remove dangerous patterns
      for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '')
      }
      
      // Third pass: HTML entity encoding
      sanitized = this.encodeHTMLEntities(sanitized)
      
      return sanitized.trim()
    } catch (error) {
      console.error('HTML sanitization failed:', error)
      return this.encodeHTMLEntities(input.replace(/<[^>]*>/g, ''))
    }
  }

  /**
   * Sanitize user prompts for AI generation
   */
  static sanitizePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      return ''
    }

    try {
      // Remove HTML tags completely
      let sanitized = prompt.replace(/<[^>]*>/g, '')
      
      // Remove dangerous patterns
      for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '')
      }
      
      // Encode HTML entities
      sanitized = this.encodeHTMLEntities(sanitized)
      
      // Remove excessive whitespace
      sanitized = sanitized.replace(/\s+/g, ' ')
      
      // Remove null bytes and control characters
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      
      return sanitized.trim()
    } catch (error) {
      console.error('Prompt sanitization failed:', error)
      return this.encodeHTMLEntities(prompt.replace(/[<>]/g, ''))
    }
  }

  /**
   * Sanitize URLs to prevent malicious redirects
   */
  static sanitizeURL(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null
    }

    try {
      // Remove dangerous patterns
      let sanitized = url.trim()
      
      // Check for safe URL patterns
      if (SAFE_URL_PATTERN.test(sanitized) || SAFE_DATA_URL_PATTERN.test(sanitized)) {
        return sanitized
      }
      
      // Try to construct a valid URL
      const urlObj = new URL(sanitized)
      
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null
      }
      
      return urlObj.toString()
    } catch (error) {
      console.warn('URL sanitization failed:', error)
      return null
    }
  }

  /**
   * Sanitize file names to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'untitled'
    }

    try {
      // Remove path traversal attempts
      let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '_')
      
      // Remove leading/trailing dots and spaces
      sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')
      
      // Remove null bytes and control characters
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
      
      // Limit length
      sanitized = sanitized.substring(0, 255)
      
      // Ensure it's not empty
      if (!sanitized) {
        sanitized = 'untitled'
      }
      
      return sanitized
    } catch (error) {
      console.error('File name sanitization failed:', error)
      return 'untitled'
    }
  }

  /**
   * Sanitize JSON input to prevent injection
   */
  static sanitizeJSON(input: any): any {
    if (input === null || input === undefined) {
      return input
    }

    try {
      if (typeof input === 'string') {
        return this.sanitizePrompt(input)
      }
      
      if (typeof input === 'number' || typeof input === 'boolean') {
        return input
      }
      
      if (Array.isArray(input)) {
        return input.map(item => this.sanitizeJSON(item))
      }
      
      if (typeof input === 'object') {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(input)) {
          const sanitizedKey = this.sanitizePrompt(key)
          sanitized[sanitizedKey] = this.sanitizeJSON(value)
        }
        return sanitized
      }
      
      return input
    } catch (error) {
      console.error('JSON sanitization failed:', error)
      return null
    }
  }

  /**
   * Encode HTML entities
   */
  static encodeHTMLEntities(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Decode HTML entities safely
   */
  static decodeHTMLEntities(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    try {
      return input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
    } catch (error) {
      console.error('HTML entity decoding failed:', error)
      return input
    }
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') {
      return null
    }

    try {
      // Basic email pattern
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      
      const sanitized = email.trim().toLowerCase()
      
      if (emailPattern.test(sanitized)) {
        return sanitized
      }
      
      return null
    } catch (error) {
      console.error('Email sanitization failed:', error)
      return null
    }
  }

  /**
   * Comprehensive input sanitization for API requests
   */
  static sanitizeAPIInput(input: any): any {
    if (input === null || input === undefined) {
      return input
    }

    try {
      // Handle different input types
      if (typeof input === 'string') {
        // Check if it looks like a URL
        if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('data:')) {
          return this.sanitizeURL(input)
        }
        
        // Check if it looks like an email
        if (input.includes('@') && input.includes('.')) {
          const emailResult = this.sanitizeEmail(input)
          if (emailResult) return emailResult
        }
        
        // Default to prompt sanitization
        return this.sanitizePrompt(input)
      }
      
      if (typeof input === 'number' || typeof input === 'boolean') {
        return input
      }
      
      if (Array.isArray(input)) {
        return input.map(item => this.sanitizeAPIInput(item))
      }
      
      if (typeof input === 'object') {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(input)) {
          const sanitizedKey = this.sanitizePrompt(key)
          sanitized[sanitizedKey] = this.sanitizeAPIInput(value)
        }
        return sanitized
      }
      
      return input
    } catch (error) {
      console.error('API input sanitization failed:', error)
      return null
    }
  }

  /**
   * Validate input length and complexity
   */
  static validateInputSafety(input: string, maxLength: number = 10000): {
    safe: boolean
    issues: string[]
    sanitized: string
  } {
    const issues: string[] = []
    
    if (!input || typeof input !== 'string') {
      return {
        safe: false,
        issues: ['Invalid input type'],
        sanitized: ''
      }
    }

    // Check length
    if (input.length > maxLength) {
      issues.push(`Input too long (${input.length} > ${maxLength})`)
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        issues.push('Contains potentially dangerous content')
        break
      }
    }

    // Check for excessive HTML
    const htmlTagCount = (input.match(/<[^>]*>/g) || []).length
    if (htmlTagCount > 10) {
      issues.push('Contains excessive HTML tags')
    }

    // Sanitize the input
    const sanitized = this.sanitizePrompt(input)

    return {
      safe: issues.length === 0,
      issues,
      sanitized
    }
  }
}
