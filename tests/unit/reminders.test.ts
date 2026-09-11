import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reminder_type: z
    .enum(['appointment', 'document_expiry', 'checklist', 'follow_up'])
    .default('appointment'),
  scheduled_for: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled date/time format',
  }),
})

describe('Phase 4 User-Controlled Reminders Validation', () => {
  it('validates a valid reminder object', () => {
    const valid = {
      title: 'Passport Biometric Appointment',
      description: 'Carry ARN printout and original birth certificate.',
      reminder_type: 'appointment',
      scheduled_for: '2026-09-20T10:30:00.000Z',
    }

    const res = reminderSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it('rejects empty title', () => {
    const invalid = {
      title: '',
      scheduled_for: '2026-09-20T10:30:00.000Z',
    }

    const res = reminderSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const invalid = {
      title: 'Test Reminder',
      scheduled_for: 'invalid-date',
    }

    const res = reminderSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })

  it('rejects unauthorized reminder types', () => {
    const invalid = {
      title: 'Test Reminder',
      reminder_type: 'spam_notification',
      scheduled_for: '2026-09-20T10:30:00.000Z',
    }

    const res = reminderSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })
})
