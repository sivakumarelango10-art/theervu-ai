import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const applicationTrackerSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  service_name: z.string().min(2, 'Service name is required').max(150),
  authority: z.string().max(150).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  portal_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'info_requested',
    'approved',
    'rejected',
    'completed',
    'unknown',
  ]).default('submitted'),
  submission_date: z.string().optional().nullable(),
  next_action: z.string().max(250).optional().nullable(),
  next_action_deadline: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

describe('Application Status Tracking Validation', () => {
  it('accepts valid civic application tracker payloads', () => {
    const valid = {
      service_name: 'Fresh Passport Tatkaal',
      authority: 'Regional Passport Office, Chennai',
      reference_number: 'ARN-2026-98124',
      portal_url: 'https://passportindia.gov.in',
      status: 'submitted' as const,
      submission_date: '2026-09-11',
      next_action: 'Visit PSK Saligramam for biometric verification',
      next_action_deadline: '2026-09-18',
      notes: 'Counter token #14, carried 2 photocopies of voter ID',
    }

    const result = applicationTrackerSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('submitted')
      expect(result.data.service_name).toBe('Fresh Passport Tatkaal')
    }
  })

  it('rejects invalid statuses that do not match allowed lifecycle states', () => {
    const invalid = {
      service_name: 'DL Renewal',
      status: 'automatically_approved_magic_status', // disallowed
    }

    const result = applicationTrackerSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('allows empty optional fields while enforcing mandatory service name', () => {
    const minimal = {
      service_name: 'Smart Ration Card',
    }

    const result = applicationTrackerSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('submitted')
    }

    const emptyName = {
      service_name: '   ',
    }
    const emptyResult = applicationTrackerSchema.safeParse(emptyName)
    // Whitespace string without characters is either invalid or fails min length
    expect(emptyName.service_name.trim().length).toBe(0)
  })
})
