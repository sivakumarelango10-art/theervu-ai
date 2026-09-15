/**
 * Cross-Tab Realtime Broadcast Channel
 *
 * Keeps multiple browser tabs and windows in 100% real-time synchronization,
 * even before external cloud services are configured or connected.
 */

export type RealtimeEventType =
  | 'APPLICATIONS_CHANGED'
  | 'REMINDERS_CHANGED'
  | 'SAVED_ITEMS_CHANGED'
  | 'CHECKLIST_CHANGED'

export interface RealtimeEvent {
  type: RealtimeEventType
  action: 'insert' | 'update' | 'delete' | 'toggle'
  id?: string
  timestamp: number
}

const CHANNEL_NAME = 'theervu_realtime_bus'

let channelInstance: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null
  }
  if (!channelInstance) {
    try {
      channelInstance = new BroadcastChannel(CHANNEL_NAME)
    } catch {
      channelInstance = null
    }
  }
  return channelInstance
}

/**
 * Dispatches a realtime event to all other open tabs in the same browser session.
 */
export function broadcastRealtimeEvent(
  type: RealtimeEventType,
  action: RealtimeEvent['action'] = 'update',
  id?: string
) {
  const ch = getChannel()
  if (!ch) return

  try {
    const payload: RealtimeEvent = {
      type,
      action,
      id,
      timestamp: Date.now(),
    }
    ch.postMessage(payload)
  } catch (err) {
    console.debug('Failed to broadcast realtime message:', err)
  }
}

/**
 * Subscribes a listener to realtime cross-tab events.
 * Returns an unsubscribe teardown function.
 */
export function subscribeToRealtimeBroadcast(
  handler: (event: RealtimeEvent) => void
): () => void {
  const ch = getChannel()
  if (!ch) return () => {}

  const listener = (msg: MessageEvent<RealtimeEvent>) => {
    if (msg.data && msg.data.type) {
      handler(msg.data)
    }
  }

  ch.addEventListener('message', listener)
  return () => {
    ch.removeEventListener('message', listener)
  }
}
