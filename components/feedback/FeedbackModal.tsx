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
import { Textarea } from '@/components/ui/textarea'
import { Check, MessageSquare, Star } from 'lucide-react'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [rating, setRating] = React.useState<number>(5)
  const [category, setCategory] = React.useState<string>('general')
  const [message, setMessage] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please provide feedback message.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          rating,
          message,
          page_context: window.location.pathname,
        }),
      })

      if (!res.ok) {
        throw new Error('Could not submit feedback.')
      }

      setSubmitted(true)
      setTimeout(() => {
        onOpenChange(false)
        setSubmitted(false)
        setMessage('')
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#102b57] flex items-center gap-2">
            <MessageSquare size={20} className="text-[#159b81]" />
            <span>Help Us Improve TheervuAI</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Tell us about your experience or report missing services.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#159b81]">
              <Check size={20} />
            </div>
            <p className="text-sm font-semibold text-[#102b57]">Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Rating */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                Overall Experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    aria-pressed={star <= rating}
                    className="p-1 text-amber-400 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={22}
                      className={star <= rating ? 'fill-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                Topic
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-[#12366b]"
              >
                <option value="general">General Feedback</option>
                <option value="plan_accuracy">Preparation Plan Accuracy</option>
                <option value="usability">Website Usability</option>
                <option value="missing_service">Request a Missing Service</option>
                <option value="bug">Report an Issue</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                Your Comments
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What worked well, or what can we explain better?"
                className="min-h-[80px] text-xs"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-[#12366b] text-white hover:bg-[#0d2a55]"
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
