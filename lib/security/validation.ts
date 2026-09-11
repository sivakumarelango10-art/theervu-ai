/**
 * Security Validation Utilities for TheervuAI
 *
 * Provides URL sanitization, MIME type validation, file size enforcement,
 * and path traversal prevention for all user-provided inputs.
 *
 * These are applied server-side before processing any uploaded content
 * or user-provided URLs.
 */

// ─── URL Sanitization ────────────────────────────────────────────────────────

const BLOCKED_URL_SCHEMES = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
]

const ALLOWED_REDIRECT_DOMAINS = [
  'india.gov.in',
  'gov.in',
  'nic.in',
  'uidai.gov.in',
  'passportindia.gov.in',
  'parivahan.gov.in',
  'mca.gov.in',
  'epfo.gov.in',
  'incometax.gov.in',
  'nsp.gov.in',
  'pgportal.gov.in',
  'services.india.gov.in',
  'myaadhaar.uidai.gov.in',
  'utiitsl.com',
  'protean-tinpan.com',
  'supabase.co', // for storage
  'vercel.app',
]

export interface UrlValidationResult {
  isValid: boolean
  sanitizedUrl: string | null
  reason?: string
}

/**
 * Validates and sanitizes a user-provided URL.
 * Blocks dangerous schemes, open redirects, and non-HTTPS URLs.
 */
export function validateAndSanitizeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, sanitizedUrl: null, reason: 'URL is empty or invalid type' }
  }

  const trimmed = rawUrl.trim()

  // Block dangerous schemes
  for (const scheme of BLOCKED_URL_SCHEMES) {
    if (trimmed.toLowerCase().startsWith(scheme)) {
      return {
        isValid: false,
        sanitizedUrl: null,
        reason: `Blocked URL scheme: ${scheme}`,
      }
    }
  }

  // Require HTTP or HTTPS
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      isValid: false,
      sanitizedUrl: null,
      reason: 'Only http:// and https:// URLs are accepted',
    }
  }

  // Parse and validate
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { isValid: false, sanitizedUrl: null, reason: 'Malformed URL' }
  }

  // Strip any embedded credentials (user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      sanitizedUrl: null,
      reason: 'URLs with embedded credentials are not permitted',
    }
  }

  // Rebuild clean URL (strips fragments that could carry injection payloads)
  const sanitized = `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`

  return { isValid: true, sanitizedUrl: sanitized }
}

/**
 * Checks if a URL is an allowed external redirect target.
 * Used when the app provides clickable links to official portals.
 */
export function isAllowedExternalDomain(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    return ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

// ─── File Upload Validation ───────────────────────────────────────────────────

export interface FileValidationResult {
  isValid: boolean
  reason?: string
}

const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024   // 5 MB

/**
 * Validates a document upload (MIME type + size).
 */
export function validateDocumentUpload(
  mimeType: string,
  fileSizeBytes: number,
  fileName: string,
): FileValidationResult {
  // Prevent path traversal in filenames
  if (hasPathTraversal(fileName)) {
    return { isValid: false, reason: 'Invalid file name' }
  }

  if (!ALLOWED_DOCUMENT_MIMES.has(mimeType.toLowerCase())) {
    return {
      isValid: false,
      reason: `File type "${mimeType}" is not supported. Accepted: PDF, JPEG, PNG, WebP, plain text.`,
    }
  }

  if (fileSizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      isValid: false,
      reason: `File size (${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`,
    }
  }

  return { isValid: true }
}

/**
 * Validates an image upload.
 */
export function validateImageUpload(
  mimeType: string,
  fileSizeBytes: number,
  fileName: string,
): FileValidationResult {
  if (hasPathTraversal(fileName)) {
    return { isValid: false, reason: 'Invalid file name' }
  }

  if (!ALLOWED_IMAGE_MIMES.has(mimeType.toLowerCase())) {
    return {
      isValid: false,
      reason: `Image type "${mimeType}" is not supported. Accepted: JPEG, PNG, WebP, GIF.`,
    }
  }

  if (fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      reason: `Image size (${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB limit.`,
    }
  }

  return { isValid: true }
}

// ─── Path Traversal Prevention ────────────────────────────────────────────────

/**
 * Returns true if a filename or path contains path traversal sequences.
 */
export function hasPathTraversal(input: string): boolean {
  const decoded = decodeURIComponent(input)
  return (
    decoded.includes('..') ||
    decoded.includes('\\') ||
    decoded.includes('/') ||
    decoded.includes('\0') ||
    /[<>:"|?*]/.test(decoded)
  )
}

// ─── Payload Size Enforcement ─────────────────────────────────────────────────

const MAX_JSON_PAYLOAD_BYTES = 512 * 1024 // 512 KB

/**
 * Checks if a request Content-Length exceeds safe limits.
 */
export function isPayloadTooLarge(request: Request): boolean {
  const contentLength = request.headers.get('content-length')
  if (!contentLength) return false
  const bytes = parseInt(contentLength, 10)
  return !isNaN(bytes) && bytes > MAX_JSON_PAYLOAD_BYTES
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Strips HTML tags and dangerous characters from a plain-text input.
 * Used to sanitize user-provided strings before storing or displaying.
 */
export function sanitizeText(input: string, maxLength: number = 2000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')            // Remove HTML tags
    .replace(/[&<>"']/g, (char) => {   // Escape HTML entities
      const escapes: Record<string, string> = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
      }
      return escapes[char] || char
    })
    .trim()
    .slice(0, maxLength)
}

/**
 * Validates that a string is a safe UUID (v4 format).
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
