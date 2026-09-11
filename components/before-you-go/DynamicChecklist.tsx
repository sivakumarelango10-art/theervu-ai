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
  Plus,
  RotateCcw,
  HelpCircle,
  XCircle,
  FileEdit,
  Save,
} from 'lucide-react'

export type ItemReadiness = 'ready' | 'missing' | 'unclear'

export interface ChecklistItem {
  id?: string
  title: string
  description?: string
  required: boolean
  completed: boolean
  priority?: number
  readiness?: ItemReadiness
  userNotes?: string
  isCustom?: boolean
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
  const [sections, setSections] = React.useState<PlanSection[]>(() => {
    return plan.sections.map((sec) => ({
      ...sec,
      items: sec.items.map((i) => ({
        ...i,
        readiness: i.readiness || (i.completed ? 'ready' : 'missing'),
      })),
    }))
  })

  const [filter, setFilter] = React.useState<'all' | 'ready' | 'missing' | 'unclear'>('all')
  const [saved, setSaved] = React.useState(isSaved)
  const [copied, setCopied] = React.useState(false)

  // Custom Item Modal State
  const [addingSectionIdx, setAddingSectionIdx] = React.useState<number | null>(null)
  const [newCustomTitle, setNewCustomTitle] = React.useState('')
  const [newCustomDesc, setNewCustomDesc] = React.useState('')
  const [newCustomRequired, setNewCustomRequired] = React.useState(false)

  // Editing Item Notes State
  const [editingNoteKey, setEditingNoteKey] = React.useState<string | null>(null)
  const [tempNote, setTempNote] = React.useState('')

  React.useEffect(() => {
    setSections(
      plan.sections.map((sec) => ({
        ...sec,
        items: sec.items.map((i) => ({
          ...i,
          readiness: i.readiness || (i.completed ? 'ready' : 'missing'),
        })),
      }))
    )
  }, [plan])

  // Calculate totals
  const allItems = sections.flatMap((s) => s.items)
  const totalCount = allItems.length
  const readyCount = allItems.filter((i) => i.readiness === 'ready' || i.completed).length
  const missingCount = allItems.filter((i) => (i.readiness === 'missing' || !i.completed) && i.readiness !== 'unclear').length
  const unclearCount = allItems.filter((i) => i.readiness === 'unclear').length
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0

  function setItemReadiness(secIdx: number, itemIdx: number, readiness: ItemReadiness) {
    const updated = [...sections]
    const item = updated[secIdx].items[itemIdx]
    item.readiness = readiness
    item.completed = readiness === 'ready'
    setSections(updated)

    if (onItemToggle) {
      onItemToggle(secIdx, itemIdx, item.completed)
    }

    if (plan.id && item.id) {
      fetch(`/api/preparation-plans/${plan.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, is_completed: item.completed }),
      }).catch((err) => {
        console.warn('Could not sync checklist item with server:', err)
      })
    }
  }

  function handleResetChecklist() {
    if (window.confirm('Reset all checklist items back to missing?')) {
      const updated = sections.map((sec) => ({
        ...sec,
        items: sec.items.map((i) => ({
          ...i,
          completed: false,
          readiness: 'missing' as ItemReadiness,
        })),
      }))
      setSections(updated)
    }
  }

  function handleAddCustomItem(secIdx: number) {
    if (!newCustomTitle.trim()) return

    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      title: newCustomTitle.trim(),
      description: newCustomDesc.trim() || undefined,
      required: newCustomRequired,
      completed: false,
      readiness: 'missing',
      isCustom: true,
    }

    const updated = [...sections]
    updated[secIdx].items.push(newItem)
    setSections(updated)

    setNewCustomTitle('')
    setNewCustomDesc('')
    setNewCustomRequired(false)
    setAddingSectionIdx(null)
  }

  function handleSaveNote(secIdx: number, itemIdx: number) {
    const updated = [...sections]
    updated[secIdx].items[itemIdx].userNotes = tempNote.trim()
    setSections(updated)
    setEditingNoteKey(null)
    setTempNote('')
  }

  function handleShare() {
    const text =
      `${plan.title}\n${plan.summary}\n\nReadiness (${readyCount}/${totalCount} Ready):\n` +
      sections
        .map(
          (s) =>
            `${s.title}:\n` +
            s.items
              .map(
                (i) =>
                  `[${i.readiness === 'ready' ? 'READY' : i.readiness === 'unclear' ? 'UNCLEAR' : 'MISSING'}] ${i.title}${
                    i.userNotes ? ` (Note: ${i.userNotes})` : ''
                  }`
              )
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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetChecklist}
              title="Reset items"
              className="h-9 gap-1.5 border-slate-200 text-slate-500 hover:text-slate-800"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
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

        {/* Multi-State Progress Section */}
        <div className="mt-8 rounded-xl border border-slate-100 bg-[#fbfcfe] p-4 sm:p-5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between text-xs font-semibold gap-2">
            <span className="text-slate-600 uppercase tracking-wider">Readiness Status</span>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="text-emerald-700 font-bold">{readyCount} Ready</span>
              <span className="text-rose-600">{missingCount} Missing</span>
              {unclearCount > 0 && <span className="text-amber-600">{unclearCount} Unclear</span>}
              <span className="text-[#102b57] font-bold">({progressPercent}%)</span>
            </div>
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
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
          onClick={() => setFilter('ready')}
          aria-pressed={filter === 'ready'}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
            filter === 'ready'
              ? 'bg-emerald-700 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Ready ({readyCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('missing')}
          aria-pressed={filter === 'missing'}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
            filter === 'missing'
              ? 'bg-rose-700 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Missing ({missingCount})
        </button>
        {unclearCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter('unclear')}
            aria-pressed={filter === 'unclear'}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              filter === 'unclear'
                ? 'bg-amber-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Unclear ({unclearCount})
          </button>
        )}
      </div>

      {/* Checklist Sections */}
      <div className="space-y-5">
        {sections.map((section, secIdx) => {
          const visibleItems = section.items.filter((item) => {
            if (filter === 'ready') return item.readiness === 'ready'
            if (filter === 'missing') return item.readiness === 'missing'
            if (filter === 'unclear') return item.readiness === 'unclear'
            return true
          })

          return (
            <div
              key={section.title + secIdx}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#102b57] flex items-center gap-2">
                  <span>{section.title}</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({section.items.filter((i) => i.readiness === 'ready').length} / {section.items.length} ready)
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => setAddingSectionIdx(addingSectionIdx === secIdx ? null : secIdx)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#12366b] hover:underline"
                >
                  <Plus size={13} />
                  <span>Add item</span>
                </button>
              </div>

              {/* Add Custom Item Form */}
              {addingSectionIdx === secIdx && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-700">Add custom checklist item to {section.title}</div>
                  <input
                    type="text"
                    placeholder="Item title (e.g. 2 stamp size photos, Notarized affidavit)..."
                    value={newCustomTitle}
                    onChange={(e) => setNewCustomTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#12366b]"
                  />
                  <input
                    type="text"
                    placeholder="Optional notes or details..."
                    value={newCustomDesc}
                    onChange={(e) => setNewCustomDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#12366b]"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={newCustomRequired}
                        onChange={(e) => setNewCustomRequired(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span>Mark as mandatory</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingSectionIdx(null)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddCustomItem(secIdx)}
                        className="h-7 bg-[#12366b] text-white text-xs"
                      >
                        Add to List
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Item List */}
              <div className="divide-y divide-slate-100">
                {visibleItems.map((item, itemIdx) => {
                  const actualItemIdx = section.items.indexOf(item)
                  const itemKey = `${secIdx}-${actualItemIdx}`
                  const isReady = item.readiness === 'ready'
                  const isUnclear = item.readiness === 'unclear'
                  const isMissing = item.readiness === 'missing'

                  return (
                    <div
                      key={item.id || itemKey}
                      className="group py-3.5 rounded-xl px-2.5 -mx-2.5 transition-colors hover:bg-slate-50/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isReady
                                  ? 'text-slate-400 line-through'
                                  : 'text-[#102b57]'
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.required && (
                              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                Required
                              </span>
                            )}
                            {item.isCustom && (
                              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                                Custom
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p
                              className={`text-xs leading-relaxed ${
                                isReady ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {item.description}
                            </p>
                          )}

                          {item.userNotes && (
                            <p className="text-[11px] text-amber-800 bg-amber-50/70 rounded px-2 py-0.5 inline-block mt-1 border border-amber-200/50">
                              <strong>Note:</strong> {item.userNotes}
                            </p>
                          )}
                        </div>

                        {/* Readiness Tri-State Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Mark Ready"
                            aria-label={`Mark "${item.title}" as ready`}
                            aria-pressed={isReady}
                            onClick={() => setItemReadiness(secIdx, actualItemIdx, 'ready')}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                              isReady
                                ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-700'
                            }`}
                          >
                            <Check size={14} className={isReady ? 'stroke-[2.5]' : ''} />
                          </button>

                          <button
                            type="button"
                            title="Mark Missing / Need to get"
                            aria-label={`Mark "${item.title}" as missing`}
                            aria-pressed={isMissing}
                            onClick={() => setItemReadiness(secIdx, actualItemIdx, 'missing')}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                              isMissing
                                ? 'bg-rose-100 text-rose-800 font-semibold'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-rose-700'
                            }`}
                          >
                            <XCircle size={14} className={isMissing ? 'stroke-[2.5]' : ''} />
                          </button>

                          <button
                            type="button"
                            title="Mark Unclear / Need clarification"
                            aria-label={`Mark "${item.title}" as unclear`}
                            aria-pressed={isUnclear}
                            onClick={() => setItemReadiness(secIdx, actualItemIdx, 'unclear')}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                              isUnclear
                                ? 'bg-amber-100 text-amber-800 font-semibold'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-amber-700'
                            }`}
                          >
                            <HelpCircle size={14} className={isUnclear ? 'stroke-[2.5]' : ''} />
                          </button>

                          <button
                            type="button"
                            title="Add Note"
                            aria-label={`Add note for "${item.title}"`}
                            aria-expanded={editingNoteKey === itemKey}
                            onClick={() => {
                              setEditingNoteKey(editingNoteKey === itemKey ? null : itemKey)
                              setTempNote(item.userNotes || '')
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <FileEdit size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Note Edit Drawer */}
                      {editingNoteKey === itemKey && (
                        <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-100">
                          <input
                            type="text"
                            placeholder="Add personal note (e.g. Original is in bank locker, 2 copies made)..."
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-[#12366b]"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveNote(secIdx, actualItemIdx)}
                            className="h-7 bg-[#12366b] text-white text-xs px-2.5"
                          >
                            <Save size={12} className="mr-1" /> Save
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {visibleItems.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No items in this section match the active filter.
                  </div>
                )}
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
