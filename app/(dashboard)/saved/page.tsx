'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserNav } from '@/components/auth/UserNav'
import { AddReminderModal } from '@/components/reminders/AddReminderModal'
import { AddApplicationModal } from '@/components/applications/AddApplicationModal'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react'

const logoUrl = '/theervu-logo.png'

// ─── Types matching API response shapes ──────────────────────────────────────

interface SavedItem {
  id: string
  title: string
  item_type: string
  url?: string
  description?: string
  created_at: string
}

interface Reminder {
  id: string
  title: string
  description?: string
  reminder_date: string
  scheduled_for?: string
  status: string
  priority?: string
  reminder_type?: string
}

interface Application {
  id: string
  service_name: string
  status: string
  reference_number?: string
  applied_date?: string
  submission_date?: string
  authority?: string
  notes?: string
  portal_url?: string
  next_action?: string
  next_action_date?: string
  next_action_deadline?: string
}

export default function SavedItemsPage() {
  const [activeTab, setActiveTab] = React.useState<'plans' | 'reminders' | 'applications'>('plans')
  const [items, setItems] = React.useState<SavedItem[]>([])
  const [reminders, setReminders] = React.useState<Reminder[]>([])
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)
  const [reminderModalOpen, setReminderModalOpen] = React.useState(false)
  const [applicationModalOpen, setApplicationModalOpen] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [savedRes, remindersRes, applicationsRes] = await Promise.all([
          fetch('/api/saved-items').then((r) => r.json()).catch(() => ({ savedItems: [] })),
          fetch('/api/reminders').then((r) => r.json()).catch(() => ({ reminders: [] })),
          fetch('/api/applications').then((r) => r.json()).catch(() => ({ applications: [] })),
        ])

        if (savedRes.savedItems) {
          setItems(savedRes.savedItems)
        }
        if (remindersRes.reminders) {
          setReminders(remindersRes.reminders)
        }
        if (applicationsRes.applications) {
          setApplications(applicationsRes.applications)
        }
      } catch (err) {
        console.warn('Could not load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleDeleteSaved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/saved-items/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('Failed to delete saved item:', err)
    }
  }

  async function handleToggleReminder(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    )

    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
    } catch (err) {
      console.warn('Failed to update reminder:', err)
    }
  }

  async function handleDeleteReminder(id: string) {
    setReminders((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('Failed to delete reminder:', err)
    }
  }

  async function handleUpdateApplicationStatus(id: string, newStatus: string) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )

    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (err) {
      console.warn('Failed to update application status:', err)
    }
  }

  async function handleDeleteApplication(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id))
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('Failed to delete application tracker:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved / Issued</Badge>
      case 'under_review':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Under Review</Badge>
      case 'info_requested':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Action Required</Badge>
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Draft</Badge>
      case 'submitted':
      default:
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200">Submitted</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center" aria-label="TheervuAI home">
              <img src={logoUrl} alt="TheervuAI" width={144} height={36} className="h-9 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline text-xs font-semibold text-slate-400 uppercase tracking-widest">
              My Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/before-you-go"
              className="text-xs font-semibold text-slate-600 hover:text-[#12366b] transition-colors"
            >
              Before You Go
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#12366b] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-[#102b57] sm:text-4xl">
              Saved Items & Applications
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Access your personalized preparation plans, reminders, and tracked civic applications in one private place.
            </p>
          </div>

          {activeTab === 'reminders' && (
            <Button
              onClick={() => setReminderModalOpen(true)}
              size="sm"
              className="h-9 bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold rounded-xl self-start sm:self-auto gap-1.5"
            >
              <Plus size={14} />
              <span>Add Reminder</span>
            </Button>
          )}

          {activeTab === 'applications' && (
            <Button
              onClick={() => setApplicationModalOpen(true)}
              size="sm"
              className="h-9 bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold rounded-xl self-start sm:self-auto gap-1.5"
            >
              <Plus size={14} />
              <span>Track New Application</span>
            </Button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'border-[#12366b] text-[#12366b]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bookmark size={14} />
            <span>Saved Plans ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'border-[#12366b] text-[#12366b]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText size={14} />
            <span>Tracked Applications ({applications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'reminders'
                ? 'border-[#12366b] text-[#12366b]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bell size={14} />
            <span>Active Reminders ({reminders.length})</span>
          </button>
        </div>

        {/* Tab 1: Saved Plans */}
        {activeTab === 'plans' && (
          <div className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-2xl bg-white border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81] text-[10px]">
                          {item.item_type === 'plan' ? 'Preparation Plan' : 'Document'}
                        </Badge>
                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Delete saved item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <h3 className="text-base font-semibold text-[#102b57]">
                        {item.title}
                      </h3>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>

                      <Button
                        asChild
                        size="sm"
                        className="h-8 bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold"
                      >
                        <Link
                          href={`/before-you-go?task=${encodeURIComponent(item.title)}`}
                          className="gap-1.5"
                        >
                          <span>Open Plan</span>
                          <ArrowRight size={13} />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <Bookmark size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#102b57]">No saved plans yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you generate a preparation plan in Before You Go, click &quot;Save Plan&quot; to keep it here.
                  </p>
                </div>
                <Button asChild size="sm" className="bg-[#12366b] text-white hover:bg-[#0d2a55]">
                  <Link href="/before-you-go">Create Your First Plan</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tracked Applications (Phase 6 New) */}
        {activeTab === 'applications' && (
          <div className="mt-6">
            {/* Manual Tracking Disclosure Banner */}
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#102b57]">Personal Application Tracker</p>
                  <p className="text-slate-500 mt-0.5">
                    Indian government departments do not provide public live status APIs. Tracking here is manual and private to help you manage reference numbers and deadlines.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setApplicationModalOpen(true)}
                size="sm"
                className="h-8 bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold shrink-0"
              >
                <Plus size={13} className="mr-1" /> Add Application
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-2xl bg-white border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {applications.map((app) => (
                  <Card
                    key={app.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(app.status)}
                        <div className="flex items-center gap-1">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                            className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-slate-700 outline-none cursor-pointer"
                            aria-label="Update status"
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="info_requested">Action Required</option>
                            <option value="approved">Approved</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleDeleteApplication(app.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            aria-label="Delete application"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-[#102b57]">
                        {app.service_name}
                      </h3>

                      {app.authority && (
                        <p className="text-xs text-slate-500 font-medium">
                          {app.authority}
                        </p>
                      )}

                      {app.reference_number && (
                        <div className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-700">
                          Ref: {app.reference_number}
                        </div>
                      )}

                      {app.next_action && (
                        <div className="rounded-lg bg-amber-50/70 border border-amber-200/50 p-2 text-xs text-amber-900">
                          <strong>Next Step:</strong> {app.next_action}
                          {app.next_action_deadline && (
                            <span className="block text-[11px] text-amber-700 mt-0.5">
                              Deadline: {app.next_action_deadline}
                            </span>
                          )}
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-xs text-slate-500 italic">
                          &quot;{app.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {app.submission_date ? `Submitted: ${app.submission_date}` : 'Status tracked'}
                      </span>
                      {app.portal_url && (
                        <a
                          href={app.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#12366b] hover:underline font-medium"
                        >
                          <span>Official Portal</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#102b57]">No tracked applications</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Keep your government application reference numbers, submission dates, and appointment steps organized.
                  </p>
                </div>
                <Button
                  onClick={() => setApplicationModalOpen(true)}
                  size="sm"
                  className="bg-[#12366b] text-white hover:bg-[#0d2a55]"
                >
                  <Plus size={14} className="mr-1.5" />
                  Track Your First Application
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reminders */}
        {activeTab === 'reminders' && (
          <div className="mt-6">
            {/* Reminder scope & notification permission banner */}
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#102b57]">In-App Schedule Tracker</p>
                <p className="text-slate-500 mt-0.5">
                  Reminders track your appointment and filing dates in your dashboard. (SMS/email alerts are not sent).
                </p>
              </div>

              {typeof window !== 'undefined' && 'Notification' in window && (
                <button
                  type="button"
                  onClick={async () => {
                    if (Notification.permission === 'default') {
                      const res = await Notification.requestPermission()
                      if (res === 'granted') {
                        try {
                          new Notification('TheervuAI Alerts Enabled', {
                            body: 'Browser notifications are now active on this device.',
                            icon: '/theervu-logo.png',
                          })
                        } catch {}
                      }
                    }
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    Notification.permission === 'granted'
                      ? 'border-teal-200 bg-teal-50 text-[#159b81]'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {Notification.permission === 'granted'
                    ? '✓ Browser Alerts Active'
                    : 'Enable Browser Alerts'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : reminders.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {reminders.map((reminder) => {
                  const isDone = reminder.status === 'completed'
                  const scheduledDate = reminder.scheduled_for ? new Date(reminder.scheduled_for) : new Date(reminder.reminder_date)
                  const isPast = scheduledDate < new Date() && !isDone

                  return (
                    <Card
                      key={reminder.id}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                        isDone
                          ? 'border-slate-100 bg-slate-50/50 opacity-70'
                          : isPast
                          ? 'border-amber-200 bg-amber-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              isDone
                                ? 'border-slate-200 text-slate-400'
                                : 'border-teal-200 bg-teal-50 text-[#159b81]'
                            }`}
                          >
                            {reminder.reminder_type?.replace('_', ' ') || 'Appointment'}
                          </Badge>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleReminder(reminder.id, reminder.status)}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg border transition-colors ${
                                isDone
                                  ? 'border-teal-300 bg-teal-50 text-[#159b81]'
                                  : 'border-slate-200 text-slate-500 hover:border-teal-500'
                              }`}
                              title={isDone ? 'Mark Pending' : 'Mark Completed'}
                            >
                              <CheckCircle2 size={13} className="inline mr-1" />
                              {isDone ? 'Completed' : 'Pending'}
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              aria-label="Delete reminder"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h3
                          className={`text-sm font-semibold ${
                            isDone ? 'line-through text-slate-400' : 'text-[#102b57]'
                          }`}
                        >
                          {reminder.title}
                        </h3>

                        {reminder.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {reminder.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className={isPast ? 'text-amber-500' : 'text-slate-400'} />
                          {scheduledDate.toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        {isPast && (
                          <span className="text-[10px] font-semibold text-amber-600">
                            Due
                          </span>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <Bell size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#102b57]">No active reminders</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Set appointment dates, fee deadlines, or document follow-ups to stay on schedule.
                  </p>
                </div>
                <Button
                  onClick={() => setReminderModalOpen(true)}
                  size="sm"
                  className="bg-[#12366b] text-white hover:bg-[#0d2a55]"
                >
                  <Plus size={14} className="mr-1.5" />
                  Set Your First Reminder
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <AddReminderModal
        open={reminderModalOpen}
        onOpenChange={setReminderModalOpen}
        onSuccess={(newReminder) => setReminders((prev) => [newReminder, ...prev])}
      />

      <AddApplicationModal
        isOpen={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        onSuccess={(newApp) => setApplications((prev) => [newApp, ...prev])}
      />
    </div>
  )
}
