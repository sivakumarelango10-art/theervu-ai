'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Loader2 } from 'lucide-react'

interface AddReminderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (reminder: any) => void
}

export function AddReminderModal({ open, onOpenChange, onSuccess }: AddReminderModalProps) {
  const [title, setTitle] = React.useState('')
  const [scheduledFor, setScheduledFor] = React.useState('')
  const [reminderType, setReminderType] = React.useState<
    'appointment' | 'document_expiry' | 'checklist' | 'follow_up'
  >('appointment')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Set default scheduled time to tomorrow at 10:00 AM
  React.useEffect(() => {
    if (open && !scheduledFor) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      setScheduledFor(tomorrow.toISOString().slice(0, 16))
    }
  }, [open, scheduledFor])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a reminder title.')
      return
    }
    if (!scheduledFor) {
      setError('Please select a scheduled date and time.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          reminder_type: reminderType,
          scheduled_for: new Date(scheduledFor).toISOString(),
          description,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create reminder.')
      }

      onSuccess(data)
      onOpenChange(false)
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setError(err?.message || 'Error creating reminder.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#102b57] flex items-center gap-2">
            <Bell size={20} className="text-[#159b81]" />
            <span>Set a Preparation Reminder</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Keep track of official appointment dates, counter visits, or document deadlines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="reminder-title" className="text-xs font-semibold text-slate-700">
              Reminder Title *
            </label>
            <Input
              id="reminder-title"
              placeholder="e.g., RTO Biometrics Appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="reminder-type" className="text-xs font-semibold text-slate-700">
                Reminder Type
              </label>
              <select
                id="reminder-type"
                value={reminderType}
                onChange={(e: any) => setReminderType(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#12366b]"
              >
                <option value="appointment">Appointment</option>
                <option value="document_expiry">Document Expiry</option>
                <option value="checklist">Checklist Review</option>
                <option value="follow_up">Counter Follow-up</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="scheduled-for" className="text-xs font-semibold text-slate-700">
                Date & Time *
              </label>
              <Input
                id="scheduled-for"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="text-xs rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="reminder-description" className="text-xs font-semibold text-slate-700">
              Notes (Optional)
            </label>
            <Textarea
              id="reminder-description"
              placeholder="e.g., Carry 2 passport photos, Form 1 printout, and exact cash fee."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-xl h-20 resize-none"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
            🔒 Reminders are strictly user-controlled and private to your account.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Reminder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
