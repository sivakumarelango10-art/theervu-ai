'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { env } from '@/lib/config/env'
import {
  subscribeToRealtimeBroadcast,
  type RealtimeEventType,
  type RealtimeEvent,
} from '@/lib/realtime/broadcast'

export interface RealtimeSyncOptions {
  table?: 'application_trackers' | 'reminders' | 'saved_items' | 'preparation_items'
  eventType?: RealtimeEventType
  onUpdate: (event?: RealtimeEvent) => void
  debounceMs?: number
}

/**
 * Universal Real-Time Synchronization Hook
 *
 * Listens simultaneously to:
 * 1. Supabase Postgres CDC (Change Data Capture) via WebSockets when cloud DB is connected.
 * 2. Cross-tab BroadcastChannel events across browser windows in local and cloud modes.
 */
export function useRealtimeSync({
  table,
  eventType,
  onUpdate,
  debounceMs = 150,
}: RealtimeSyncOptions) {
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const triggerUpdate = React.useCallback(
    (event?: RealtimeEvent) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onUpdate(event)
      }, debounceMs)
    },
    [onUpdate, debounceMs]
  )

  // 1. Cross-Tab BroadcastChannel Subscription
  React.useEffect(() => {
    const unsubscribe = subscribeToRealtimeBroadcast((event) => {
      if (!eventType || event.type === eventType) {
        triggerUpdate(event)
      }
    })

    return () => {
      unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [eventType, triggerUpdate])

  // 2. Supabase Realtime Channel Subscription (if cloud DB is configured)
  React.useEffect(() => {
    if (!env.supabase.isConfigured || !table) return

    let channel: any = null

    try {
      const supabase = createClient()
      const channelId = `realtime_${table}_${Math.random().toString(36).substring(7)}`

      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload: any) => {
            triggerUpdate({
              type: eventType || 'APPLICATIONS_CHANGED',
              action: payload.eventType === 'INSERT' ? 'insert' : payload.eventType === 'DELETE' ? 'delete' : 'update',
              id: payload.new?.id || payload.old?.id,
              timestamp: Date.now(),
            })
          }
        )
        .subscribe()
    } catch (err) {
      console.debug('Supabase realtime subscription unavailable:', err)
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient()
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [table, eventType, triggerUpdate])
}
