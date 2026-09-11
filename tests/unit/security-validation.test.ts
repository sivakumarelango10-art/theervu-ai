import { describe, it, expect } from 'vitest'
import {
  validateAndSanitizeUrl,
  isAllowedExternalDomain,
  validateDocumentUpload,
  hasPathTraversal,
  isPayloadTooLarge,
  sanitizeText,
  isValidUUID,
} from '@/lib/security/validation'

describe('Security Validation', () => {
  describe('URL sanitization', () => {
    it('blocks javascript: scheme', () => {
      const result = validateAndSanitizeUrl('javascript:alert(1)')
      expect(result.isValid).toBe(false)
      expect(result.sanitizedUrl).toBeNull()
    })

    it('blocks data: scheme', () => {
      const result = validateAndSanitizeUrl('data:text/html,<h1>XSS</h1>')
      expect(result.isValid).toBe(false)
    })

    it('accepts valid https URL', () => {
      const result = validateAndSanitizeUrl('https://www.uidai.gov.in/en/contact-support.html')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedUrl).toContain('uidai.gov.in')
    })

    it('rejects URL with embedded credentials', () => {
      const result = validateAndSanitizeUrl('https://user:pass@evil.com/')
      expect(result.isValid).toBe(false)
    })

    it('accepts http URL with valid hostname', () => {
      const result = validateAndSanitizeUrl('http://services.india.gov.in/')
      expect(result.isValid).toBe(true)
    })
  })

  describe('External domain allowlist', () => {
    it('allows gov.in domains', () => {
      expect(isAllowedExternalDomain('https://services.india.gov.in/')).toBe(true)
      expect(isAllowedExternalDomain('https://uidai.gov.in/')).toBe(true)
      expect(isAllowedExternalDomain('https://parivahan.gov.in/')).toBe(true)
    })

    it('blocks unknown commercial domains', () => {
      expect(isAllowedExternalDomain('https://malicious-site.com/')).toBe(false)
    })
  })

  describe('File upload validation', () => {
    it('accepts valid PDF upload within size', () => {
      const result = validateDocumentUpload('application/pdf', 5 * 1024 * 1024, 'notice.pdf')
      expect(result.isValid).toBe(true)
    })

    it('rejects oversized file', () => {
      const result = validateDocumentUpload('application/pdf', 15 * 1024 * 1024, 'large.pdf')
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('exceeds')
    })

    it('rejects unsupported MIME type', () => {
      const result = validateDocumentUpload('application/x-executable', 100, 'virus.exe')
      expect(result.isValid).toBe(false)
    })

    it('rejects path traversal in filename', () => {
      const result = validateDocumentUpload('application/pdf', 100, '../etc/passwd')
      expect(result.isValid).toBe(false)
    })
  })

  describe('Path traversal detection', () => {
    it('detects .. sequences', () => {
      expect(hasPathTraversal('../etc/passwd')).toBe(true)
    })

    it('detects backslashes', () => {
      expect(hasPathTraversal('folder\\file')).toBe(true)
    })

    it('allows clean filename', () => {
      expect(hasPathTraversal('my-document.pdf')).toBe(false)
    })
  })

  describe('Text sanitization', () => {
    it('strips HTML tags', () => {
      const result = sanitizeText('<script>alert(1)</script>Hello')
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('enforces max length', () => {
      const longText = 'a'.repeat(3000)
      expect(sanitizeText(longText, 100).length).toBeLessThanOrEqual(100)
    })
  })

  describe('UUID validation', () => {
    it('accepts valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('rejects invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false) // v1, not v4
    })
  })
})
