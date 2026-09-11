/**
 * Notification System Types for TheervuAI
 *
 * Defines the data model for in-app notifications, notification preferences,
 * and delivery status.
 *
 * ARCHITECTURE:
 * - In-app notifications: Implemented (writes to public.notifications table)
 * - Email: Provider interface only — requires SendGrid/Resend configuration
 * - SMS/WhatsApp: Provider interface only — requires Twilio/WATI configuration
 * - Push: Provider interface only — requires FCM/APNS configuration
 *
 * All unimplemented channels return DeliveryStatus.PROVIDER_UNAVAILABLE
 * and never fake delivery.
 */

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationCategory =
  | 'application_reminder'    // Follow-up on a tracked application
  | 'document_expiry'         // Document about to expire (e.g., passport, license)
  | 'service_update'          // Update to a saved civic service
  | 'preparation_reminder'    // Reminder to complete a Before-You-Go plan
  | 'system_info'             // Platform-level information
  | 'feedback_response'       // Response to user feedback (admin)

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type DeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'provider_unavailable'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp'

export interface Notification {
  id: string
  userId: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  body: string
  actionUrl?: string       // Deep link within the app (e.g., /saved?tab=applications)
  actionLabel?: string     // Button label for the action
  relatedRecordId?: string // ID of the related entity (application ID, plan ID, etc.)
  relatedRecordType?: string
  isRead: boolean
  deliveryStatus: DeliveryStatus
  deliveredAt?: string
  readAt?: string
  expiresAt?: string       // Auto-dismiss after this date
  createdAt: string
  updatedAt: string
}

export interface NotificationPreferences {
  userId: string
  inApp: boolean           // Always true — cannot be disabled
  email: boolean           // Requires email provider config
  sms: boolean             // Requires SMS provider config
  push: boolean            // Requires push provider config
  applicationReminders: boolean
  documentExpiry: boolean
  serviceUpdates: boolean
  preparationReminders: boolean
  systemInfo: boolean
  reminderLeadTimeDays: number // Days before deadline to send reminder
  timezone: string         // IANA timezone string (e.g., 'Asia/Kolkata')
  updatedAt: string
}

export interface NotificationCreatePayload {
  userId: string
  category: NotificationCategory
  priority?: NotificationPriority
  title: string
  body: string
  actionUrl?: string
  actionLabel?: string
  relatedRecordId?: string
  relatedRecordType?: string
  expiresAt?: string
}

export interface NotificationDeliveryResult {
  channel: NotificationChannel
  status: DeliveryStatus
  notificationId: string
  deliveredAt?: string
  error?: string
}

// ─── Default Preferences ─────────────────────────────────────────────────────

export function defaultNotificationPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    inApp: true,
    email: false,
    sms: false,
    push: false,
    applicationReminders: true,
    documentExpiry: true,
    serviceUpdates: false,
    preparationReminders: true,
    systemInfo: true,
    reminderLeadTimeDays: 3,
    timezone: 'Asia/Kolkata',
    updatedAt: new Date().toISOString(),
  }
}
