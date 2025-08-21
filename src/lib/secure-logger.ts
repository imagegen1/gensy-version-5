/**
 * Secure Logger Utility
 * Prevents format string injection attacks in console.log statements
 */

/**
 * Secure logging function that prevents format string injection
 * @param level - Log level (info, warn, error, debug)
 * @param message - Static message string
 * @param data - Additional data to log (will be JSON stringified)
 */
export function secureLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logData = data ? JSON.stringify(data, null, 2) : ''
  
  switch (level) {
    case 'info':
      console.info(`[${timestamp}] INFO: ${message}`, logData ? '\nData:' : '', logData)
      break
    case 'warn':
      console.warn(`[${timestamp}] WARN: ${message}`, logData ? '\nData:' : '', logData)
      break
    case 'error':
      console.error(`[${timestamp}] ERROR: ${message}`, logData ? '\nData:' : '', logData)
      break
    case 'debug':
      console.debug(`[${timestamp}] DEBUG: ${message}`, logData ? '\nData:' : '', logData)
      break
  }
}

/**
 * Secure info logging
 */
export function logInfo(message: string, data?: any) {
  secureLog('info', message, data)
}

/**
 * Secure warning logging
 */
export function logWarn(message: string, data?: any) {
  secureLog('warn', message, data)
}

/**
 * Secure error logging
 */
export function logError(message: string, data?: any) {
  secureLog('error', message, data)
}

/**
 * Secure debug logging
 */
export function logDebug(message: string, data?: any) {
  secureLog('debug', message, data)
}

/**
 * Sanitize user input for logging to prevent injection
 */
export function sanitizeForLog(input: any): string {
  if (typeof input === 'string') {
    // Remove potential format specifiers and control characters
    return input.replace(/%[sdifj%]/g, '[SANITIZED]').replace(/[\x00-\x1F\x7F]/g, '[CTRL]')
  }
  
  if (typeof input === 'object') {
    try {
      return JSON.stringify(input, null, 2).replace(/%[sdifj%]/g, '[SANITIZED]')
    } catch {
      return '[OBJECT_STRINGIFY_ERROR]'
    }
  }
  
  return String(input).replace(/%[sdifj%]/g, '[SANITIZED]')
}
