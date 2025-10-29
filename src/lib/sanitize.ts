/**
 * Sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitizes HTML content by escaping special characters
 */
export function sanitizeHtml(str: string | null | undefined): string {
  if (!str) return ''
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizes text for safe display
 */
export function sanitizeText(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).trim()
}

/**
 * Validates and sanitizes email
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  const sanitized = email.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitizes URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const sanitized = url.trim()
  
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(sanitized)) {
    return ''
  }
  
  return sanitized
}
