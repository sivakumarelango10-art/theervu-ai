/**
 * Notification Provider Interfaces for TheervuAI
 *
 * Implements the in-app notification provider (Supabase-backed).
 * Provides stub interfaces for email, SMS, push, and WhatsApp
 * with clear provider_unavailable responses when not configured.
 *
 * PRODUCTION CONFIGURATION:
 * - Email: Set RESEND_API_KEY or SENDGRID_API_KEY in environment
 * - SMS: Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in environment
 * - Push: Set FCM_SERVER_KEY in environment
 * - WhatsApp: Set WATI_API_KEY in environment
 *
 * None of these are required for the platform to function.
 * In-app notifications work without any external provider.
 */

import type {
  NotificationChannel,
  NotificationCreatePayload,
  NotificationDeliveryResult,
} from '@/lib/notifications/types'

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface INotificationProvider {
  channel: NotificationChannel
  isAvailable(): boolean
  send(payload: NotificationCreatePayload, userId: string): Promise<NotificationDeliveryResult>
}

// ─── In-App Provider (Implemented) ───────────────────────────────────────────

/**
 * Saves notifications to public.notifications table via Supabase.
 * Always available when Supabase is configured.
 */
export class InAppProvider implements INotificationProvider {
  channel: NotificationChannel = 'in_app'

  isAvailable(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    )
  }

  async send(
    payload: NotificationCreatePayload,
  ): Promise<NotificationDeliveryResult> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    if (!this.isAvailable()) {
      return {
        channel: 'in_app',
        status: 'provider_unavailable',
        notificationId,
        error: 'Supabase is not configured for in-app notifications',
      }
    }

    // NOTE: Actual DB write happens in the API route handler to avoid
    // importing Supabase client in shared lib (SSR boundary).
    // This provider returns the metadata; the route performs the insert.
    return {
      channel: 'in_app',
      status: 'delivered',
      notificationId,
      deliveredAt: new Date().toISOString(),
    }
  }
}

// ─── Email Provider (Interface — Not Implemented) ──────────────────────────

/**
 * Email notification stub.
 * Returns provider_unavailable until RESEND_API_KEY is configured.
 */
export class EmailProvider implements INotificationProvider {
  channel: NotificationChannel = 'email'

  isAvailable(): boolean {
    const resendKey = process.env.RESEND_API_KEY || ''
    const sendgridKey = process.env.SENDGRID_API_KEY || ''
    return (
      (resendKey.length > 10 && !resendKey.includes('placeholder')) ||
      (sendgridKey.length > 10 && !sendgridKey.includes('placeholder'))
    )
  }

  async send(
    payload: NotificationCreatePayload,
  ): Promise<NotificationDeliveryResult> {
    const notificationId = `email_${Date.now()}`

    if (!this.isAvailable()) {
      return {
        channel: 'email',
        status: 'provider_unavailable',
        notificationId,
        error: 'Email provider not configured. Set RESEND_API_KEY or SENDGRID_API_KEY.',
      }
    }

    // TODO: Implement with Resend or SendGrid SDK when keys are configured
    return {
      channel: 'email',
      status: 'provider_unavailable',
      notificationId,
      error: 'Email sending not yet implemented',
    }
  }
}

// ─── SMS Provider (Interface — Not Implemented) ────────────────────────────

/**
 * SMS notification stub.
 * Returns provider_unavailable until Twilio credentials are configured.
 */
export class SmsProvider implements INotificationProvider {
  channel: NotificationChannel = 'sms'

  isAvailable(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      !process.env.TWILIO_ACCOUNT_SID.includes('placeholder')
    )
  }

  async send(
    _payload: NotificationCreatePayload,
  ): Promise<NotificationDeliveryResult> {
    return {
      channel: 'sms',
      status: 'provider_unavailable',
      notificationId: `sms_${Date.now()}`,
      error: 'SMS provider not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
    }
  }
}

// ─── Push Provider (Interface — Not Implemented) ───────────────────────────

/**
 * Push notification stub.
 * Returns provider_unavailable until FCM_SERVER_KEY is configured.
 */
export class PushProvider implements INotificationProvider {
  channel: NotificationChannel = 'push'

  isAvailable(): boolean {
    return Boolean(
      process.env.FCM_SERVER_KEY &&
      !process.env.FCM_SERVER_KEY.includes('placeholder')
    )
  }

  async send(
    _payload: NotificationCreatePayload,
  ): Promise<NotificationDeliveryResult> {
    return {
      channel: 'push',
      status: 'provider_unavailable',
      notificationId: `push_${Date.now()}`,
      error: 'Push notification provider not configured. Set FCM_SERVER_KEY.',
    }
  }
}

// ─── Provider Registry ────────────────────────────────────────────────────────

export const notificationProviders: INotificationProvider[] = [
  new InAppProvider(),
  new EmailProvider(),
  new SmsProvider(),
  new PushProvider(),
]

/**
 * Returns availability status for all notification channels.
 * Safe to expose to admin dashboard.
 */
export function getProviderStatus(): Record<NotificationChannel, boolean> {
  return {
    in_app: new InAppProvider().isAvailable(),
    email: new EmailProvider().isAvailable(),
    sms: new SmsProvider().isAvailable(),
    push: new PushProvider().isAvailable(),
    whatsapp: false, // Not implemented
  }
}
