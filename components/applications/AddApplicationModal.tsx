'use client'

import React, { useState } from 'react'
import { X, ShieldAlert, Plus, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newApp: any) => void
  defaultServiceName?: string
  defaultAuthority?: string
}

export function AddApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultServiceName = '',
  defaultAuthority = '',
}: AddApplicationModalProps) {
  const [serviceName, setServiceName] = useState(defaultServiceName)
  const [authority, setAuthority] = useState(defaultAuthority)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [status, setStatus] = useState('submitted')
  const [submissionDate, setSubmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [nextAction, setNextAction] = useState('')
  const [nextActionDeadline, setNextActionDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!serviceName.trim()) {
      setErrorMsg('Please enter a service name.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName.trim(),
          authority: authority.trim() || null,
          reference_number: referenceNumber.trim() || null,
          portal_url: portalUrl.trim() || null,
          status,
          submission_date: submissionDate || null,
          next_action: nextAction.trim() || null,
          next_action_deadline: nextActionDeadline || null,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save application tracker')
      }

      onSuccess(data.application)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-application"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12366b]/10 text-[#12366b]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 id="modal-add-application" className="text-base font-bold text-[#102b57]">
                Track Civic Application
              </h2>
              <p className="text-xs text-slate-500">Record and track your government or institutional request</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close track application modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy & Manual Disclosure Notice */}
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-amber-900 leading-relaxed">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
              User-Controlled & Private Tracking
            </div>
            <p className="text-[11px] text-amber-800">
              Application tracking in TheervuAI is manual and private. Your reference number is stored securely for your personal records and is never shared or made public.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Service Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Fresh Passport, Driving Licence Renewal, Income Certificate"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b] focus:ring-1 focus:ring-[#12366b]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department / Authority
              </label>
              <input
                type="text"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. Regional Transport Office, RPO Chennai"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reference / ARN Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. ARN-2026-98124 (Optional)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              >
                <option value="draft">Draft (Preparing)</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review / Scrutiny</option>
                <option value="info_requested">Action Required / Clarification</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed / Issued</option>
                <option value="rejected">Rejected / Resubmit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Submission Date
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Official Portal URL (Optional)
              </label>
              <input
                type="url"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="https://parivahan.gov.in"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Action
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Visit PSK for Biometrics, Counter 4"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Action Deadline
              </label>
              <input
                type="date"
                value={nextActionDeadline}
                onChange={(e) => setNextActionDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Personal Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special remarks, counter numbers, token slips, or payment receipts..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#12366b]"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="h-8 bg-[#12366b] hover:bg-[#0d2a55] text-white text-xs px-4"
            >
              {submitting ? 'Saving...' : 'Save Tracker'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
