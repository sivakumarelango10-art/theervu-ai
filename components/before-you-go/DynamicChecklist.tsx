'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  Bookmark,
  Check,
  CheckCircle2,
  ExternalLink,
  Printer,
  Share2,
} from 'lucide-react'

export interface ChecklistItem {
  id?: string
  title: string
  description?: string
  required: boolean
  completed: boolean
  priority?: number
}

export interface PlanSection {
  title: string
  items: ChecklistItem[]
}

export interface PreparationPlanData {
  id?: string
  title: string
  summary: string
  location: string
  service: string
  sections: PlanSection[]
  warnings?: string[]
  sources?: Array<{
    title: string
    url: string
    authority: string
  }>
}

interface DynamicChecklistProps {
  plan: PreparationPlanData
  onItemToggle?: (sectionIndex: number, itemIndex: number, newStatus: boolean) => void
  onSavePlan?: () => void
  isSaved?: boolean
}

export function DynamicChecklist({
  plan,
  onItemToggle,
  onSavePlan,
  isSaved = false,
}: DynamicChecklistProps) {
  const [sections, setSections] = React.useState<PlanSection[]>(plan.sections)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('all')
  const [saved, setSaved] = React.useState(isSaved)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setSections(plan.sections)
  }, [plan])

  // Calculate totals
  const allItems = sections.flatMap((s) => s.items)
  const totalCount = allItems.length
  const completedCount = allItems.filter((i) => i.completed).length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  function handleToggle(secIdx: number, itemIdx: number) {
    const updated = [...sections]
    const item = updated[secIdx].items[itemIdx]
    const newStatus = !item.completed
    item.completed = newStatus
    setSections(updated)

    if (onItemToggle) {
      onItemToggle(secIdx, itemIdx, newStatus)
    }

    // Call API if plan has an ID
    if (plan.id && item.id) {
      fetch(`/api/preparation-plans/${plan.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, is_completed: newStatus }),
      }).catch((err) => {
        console.warn('Could not sync checklist item with server:', err)
        // Rollback optimistic update
        item.completed = !newStatus
        setSections([...sections])
      })
    }
  }

  function handleShare() {
    const text = `${plan.title}\n${plan.summary}\n\nChecklist (${completedCount}/${totalCount} completed):\n` +
      sections
        .map(
          (s) =>
            `${s.title}:\n` +
            s.items
              .map((i) => `[${i.completed ? 'X' : ' '}] ${i.title}`)
              .join('\n')
        )
        .join('\n\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header & Meta Card */}
      <Card className="rounded-2xl border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81]">
                {plan.service || 'Institutional Visit'}
              </Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-600">
                {plan.location || 'All India'}
              </Badge>
            </div>
            <h2 className="text-2xl font-semibold text-[#102b57] sm:text-3xl">
              {plan.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {plan.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 gap-1.5 border-slate-200 text-slate-700"
            >
              {copied ? <Check size={14} className="text-teal-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 border-slate-200 text-slate-700"
            >
              <Printer size={14} />
              <span>Print</span>
            </Button>
            {onSavePlan && (
              <Button
                variant={saved ? 'secondary' : 'default'}
                size="sm"
                onClick={() => {
                  setSaved(!saved)
                  onSavePlan()
                }}
                className={saved ? 'bg-teal-50 text-[#159b81] border border-teal-200' : 'bg-[#12366b] text-white'}
              >
                <Bookmark size={14} className={saved ? 'fill-current' : ''} />
                <span>{saved ? 'Saved' : 'Save Plan'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-8 rounded-xl border border-slate-100 bg-[#fbfcfe] p-4 sm:p-5">
          <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 uppercase tracking-wider">Preparation Progress</span>
            <span className="text-[#102b57] font-bold">
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5 bg-slate-200" />
        </div>
      </Card>

      {/* Warnings & Variations Alert */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900 flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <span className="font-semibold">Verify before your visit:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
              {plan.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-[#12366b] text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          All Items ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-[#12366b] text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Pending ({totalCount - completedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-[#12366b] text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-5">
        {sections.map((section, secIdx) => {
          const visibleItems = section.items.filter((item) => {
            if (filter === 'pending') return !item.completed
            if (filter === 'completed') return item.completed
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4"
            >
              <h3 className="text-base font-semibold text-[#102b57] flex items-center justify-between">
                <span>{section.title}</span>
                <span className="text-xs font-normal text-slate-400">
                  {section.items.filter((i) => i.completed).length} / {section.items.length} done
                </span>
              </h3>

              <div className="divide-y divide-slate-100">
                {section.items.map((item, itemIdx) => {
                  if (filter === 'pending' && item.completed) return null
                  if (filter === 'completed' && !item.completed) return null

                  return (
                    <div
                      key={item.title + itemIdx}
                      onClick={() => handleToggle(secIdx, itemIdx)}
                      className="group flex cursor-pointer items-start gap-3.5 py-3.5 transition-colors hover:bg-slate-50/70 rounded-xl px-2.5 -mx-2.5 select-none"
                    >
                      <button
                        type="button"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                          item.completed
                            ? 'border-[#159b81] bg-[#159b81] text-white'
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                        aria-label={item.completed ? 'Mark pending' : 'Mark completed'}
                      >
                        {item.completed && <Check size={13} className="stroke-[3]" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-medium transition-all ${
                              item.completed
                                ? 'text-slate-400 line-through'
                                : 'text-[#102b57]'
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.required && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                              Required
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={`text-xs leading-relaxed ${
                              item.completed ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Official Sources Section */}
      {plan.sources && plan.sources.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Official Source Context
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 hover:border-slate-300 hover:text-[#12366b] transition-all"
              >
                <div>
                  <p className="font-semibold">{src.title}</p>
                  <p className="text-slate-400 text-[11px]">{src.authority}</p>
                </div>
                <ExternalLink size={14} className="shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
