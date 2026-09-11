'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DynamicChecklist, type PreparationPlanData } from '@/components/before-you-go/DynamicChecklist'
import { UserNav } from '@/components/auth/UserNav'
import { ArrowLeft, ArrowRight, Compass, Loader2, Sparkles } from 'lucide-react'

const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202026%2C%2012_32_08%20PM-ujooLO8049TXC3GzHMoaAhqYO0csBM.png'

export default function BeforeYouGoPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#fbfcfe] p-12 text-center text-xs text-slate-400">Loading Before You Go...</div>}>
      <BeforeYouGoContent />
    </React.Suspense>
  )
}

function BeforeYouGoContent() {
  const searchParams = useSearchParams()
  const initialTask = searchParams.get('task') || ''
  const initialService = searchParams.get('service') || ''

  const [task, setTask] = React.useState(initialTask)
  const [location, setLocation] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [plan, setPlan] = React.useState<PreparationPlanData | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Auto-generate if query param provided
  React.useEffect(() => {
    if (initialTask && !plan && !loading) {
      handleGenerate(initialTask, '')
    }
  }, [initialTask])

  async function handleGenerate(taskText?: string, locText?: string) {
    const query = taskText || task
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: query,
          location: locText || location,
          serviceSlug: initialService || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate plan.')
      }

      setPlan(data)
    } catch (err: any) {
      setError(err?.message || 'Error generating preparation plan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center" aria-label="TheervuAI home">
              <img src={logoUrl} alt="TheervuAI" className="h-9 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Before You Go Assistant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/services"
              className="text-xs font-semibold text-slate-600 hover:text-[#12366b] transition-colors"
            >
              Browse Services
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

        {/* Input Card */}
        <Card className="rounded-2xl border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs mb-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-[#102b57] sm:text-3xl">
              Plan Your Institutional Visit
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Enter your task or purpose of visit. We will organize your required documents, counter procedures, and verified checklists.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleGenerate()
            }}
            className="mt-6 grid gap-4 sm:grid-cols-[1.5fr_1fr_auto]"
          >
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Driving Licence Renewal, Passport Tatkaal, Hospital Outpatient"
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:border-[#12366b] focus:ring-2 focus:ring-[#12366b]/10"
              required
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="State or City (e.g. Tamil Nadu, Mumbai)"
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:border-[#12366b] focus:ring-2 focus:ring-[#12366b]/10"
            />
            <Button
              type="submit"
              disabled={loading || !task.trim()}
              className="h-11 rounded-xl bg-[#12366b] px-6 text-sm font-semibold text-white hover:bg-[#0d2a55]"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Generate Plan <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </Card>

        {/* Dynamic Checklist or Loading View */}
        {loading && (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#159b81]" />
            <p className="text-base font-semibold text-[#102b57]">
              Generating your personalized preparation plan...
            </p>
            <p className="text-xs text-slate-400">
              Retrieving verified requirements, checklist items, and official source links.
            </p>
          </div>
        )}

        {!loading && plan && (
          <DynamicChecklist
            plan={plan}
            onSavePlan={async () => {
              // Save to saved_items
              await fetch('/api/saved-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  item_type: 'plan',
                  item_reference_id: plan.id || 'plan_' + Date.now(),
                  title: plan.title,
                  metadata: plan,
                }),
              })
            }}
          />
        )}
      </main>
    </div>
  )
}
