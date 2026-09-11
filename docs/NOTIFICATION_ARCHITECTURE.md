# Notification Architecture — TheervuAI

## Overview

TheervuAI includes a notification foundation that supports in-app notifications with provider interfaces for email, SMS, and push (pending configuration).

## Channel Status

| Channel | Status | Requires |
|---|---|---|
| In-App | ✅ Implemented | Supabase configured |
| Email | 🔌 Interface ready | `RESEND_API_KEY` or `SENDGRID_API_KEY` |
| SMS | 🔌 Interface ready | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` |
| Push | 🔌 Interface ready | `FCM_SERVER_KEY` |
| WhatsApp | 🔌 Not implemented | TBD |

All unimplemented channels return `DeliveryStatus.PROVIDER_UNAVAILABLE` and never fake delivery.

## Notification Categories

| Category | Description |
|---|---|
| `application_reminder` | Follow-up on a tracked application |
| `document_expiry` | Document about to expire |
| `service_update` | Update to a saved civic service |
| `preparation_reminder` | Reminder to complete a Before-You-Go plan |
| `system_info` | Platform-level information |
| `feedback_response` | Response to user feedback |

## Database Schema

```sql
-- public.notifications
id, user_id, category, priority, title, body,
action_url, action_label, related_record_id,
is_read, delivery_status, delivered_at, read_at,
expires_at, created_at, updated_at

-- public.notification_preferences
user_id, in_app, email, sms, push_enabled,
application_reminders, document_expiry, service_updates,
preparation_reminders, system_info,
reminder_lead_time_days, timezone
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List user notifications (unread first) |
| `GET` | `/api/notifications?unread=true` | Unread only |
| `PATCH` | `/api/notifications` | Mark single notification as read |
| `PATCH` | `/api/notifications` `{ markAll: true }` | Mark all as read |

## User Preferences

- `in_app`: Always true (cannot be disabled)
- `email`, `sms`, `push`: False by default (opt-in)
- `reminder_lead_time_days`: 1–30 days before deadline
- `timezone`: IANA timezone string (default: `Asia/Kolkata`)

## Production Configuration

To enable email notifications:
```env
RESEND_API_KEY=re_xxxxxxxxxx
```

To enable SMS notifications:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+91xxxxxxxxxx
```
