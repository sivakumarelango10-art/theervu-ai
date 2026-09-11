import { describe, it, expect } from 'vitest'
import {
  defaultNotificationPreferences,
} from '@/lib/notifications/types'
import {
  InAppProvider,
  EmailProvider,
  SmsProvider,
  PushProvider,
  getProviderStatus,
} from '@/lib/notifications/provider'

describe('Notification Architecture', () => {
  describe('defaultNotificationPreferences', () => {
    it('creates preferences with in_app always enabled', () => {
      const prefs = defaultNotificationPreferences('test-user-id')
      expect(prefs.inApp).toBe(true)
      expect(prefs.userId).toBe('test-user-id')
      expect(prefs.timezone).toBe('Asia/Kolkata')
    })

    it('defaults email, sms, push to false (opt-in)', () => {
      const prefs = defaultNotificationPreferences('user-123')
      expect(prefs.email).toBe(false)
      expect(prefs.sms).toBe(false)
      expect(prefs.push).toBe(false)
    })

    it('defaults reminders to enabled', () => {
      const prefs = defaultNotificationPreferences('user-123')
      expect(prefs.applicationReminders).toBe(true)
      expect(prefs.preparationReminders).toBe(true)
    })
  })

  describe('EmailProvider', () => {
    it('returns provider_unavailable when not configured', async () => {
      const provider = new EmailProvider()
      // In test environment, email keys are not configured
      if (!provider.isAvailable()) {
        const result = await provider.send({
          userId: 'test',
          category: 'system_info',
          title: 'Test',
          body: 'Test message',
        })
        expect(result.status).toBe('provider_unavailable')
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('SmsProvider', () => {
    it('returns provider_unavailable when not configured', async () => {
      const provider = new SmsProvider()
      if (!provider.isAvailable()) {
        const result = await provider.send({
          userId: 'test',
          category: 'application_reminder',
          title: 'Reminder',
          body: 'Follow up on your application',
        })
        expect(result.status).toBe('provider_unavailable')
        expect(result.channel).toBe('sms')
      }
    })
  })

  describe('PushProvider', () => {
    it('returns provider_unavailable when not configured', async () => {
      const provider = new PushProvider()
      if (!provider.isAvailable()) {
        const result = await provider.send({
          userId: 'test',
          category: 'document_expiry',
          title: 'Expiry Alert',
          body: 'Your document is expiring soon',
        })
        expect(result.status).toBe('provider_unavailable')
        expect(result.channel).toBe('push')
      }
    })
  })

  describe('getProviderStatus', () => {
    it('returns a status map for all channels', () => {
      const status = getProviderStatus()
      expect(typeof status.in_app).toBe('boolean')
      expect(typeof status.email).toBe('boolean')
      expect(typeof status.sms).toBe('boolean')
      expect(typeof status.push).toBe('boolean')
      expect(status.whatsapp).toBe(false) // Not implemented
    })
  })
})
