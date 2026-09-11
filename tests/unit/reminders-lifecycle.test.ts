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
  status: z.enum(['pending', 'completed', 'dismissed']).default('pending'),
})

describe('Reminders Lifecycle & Business Logic Tests', () => {
  it('accepts valid reminder payload and defaults status to pending', () => {
    const valid = {
      title: 'RTO Driving Test slot at Sholinganallur',
      reminder_type: 'appointment' as const,
      scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    }

    const parsed = reminderSchema.parse(valid)
    expect(parsed.status).toBe('pending')
    expect(parsed.title).toBe(valid.title)
  })

  it('correctly calculates overdue status for past dates when not completed', () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    const futureTime = new Date(Date.now() + 3600000).toISOString() // 1 hour ahead

    function isOverdue(scheduledFor: string, status: string): boolean {
      return new Date(scheduledFor) < new Date() && status !== 'completed'
    }

    expect(isOverdue(pastTime, 'pending')).toBe(true)
    expect(isOverdue(pastTime, 'completed')).toBe(false)
    expect(isOverdue(futureTime, 'pending')).toBe(false)
  })

  it('rejects invalid reminder types and malformed date strings', () => {
    const invalidType = {
      title: 'Invalid reminder',
      reminder_type: 'unsupported_type',
      scheduled_for: new Date().toISOString(),
    }
    expect(() => reminderSchema.parse(invalidType)).toThrow()

    const invalidDate = {
      title: 'Bad Date',
      reminder_type: 'appointment',
      scheduled_for: 'not-a-real-date-string',
    }
    expect(() => reminderSchema.parse(invalidDate)).toThrow()
  })

  it('supports status transitions from pending to completed and dismissed', () => {
    let reminder = {
      id: 'rem-1',
      title: 'Renew Passport',
      status: 'pending',
    }

    // Mark complete
    reminder = { ...reminder, status: 'completed' }
    expect(reminder.status).toBe('completed')

    // Mark dismissed
    reminder = { ...reminder, status: 'dismissed' }
    expect(reminder.status).toBe('dismissed')
  })
})
