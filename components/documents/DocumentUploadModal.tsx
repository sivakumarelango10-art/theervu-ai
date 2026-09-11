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
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Languages,
  Loader2,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { LANGUAGE_LIST } from '@/lib/i18n/languages'
import type { DocumentWorkflowAction } from '@/lib/ai/schemas'

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanCreated?: (planData: any) => void
}

const WORKFLOW_OPTIONS: Array<{ value: DocumentWorkflowAction; label: string }> = [
  { value: 'explain', label: 'Explain this document' },
  { value: 'summarize', label: 'Summarize key points' },
  { value: 'extract_info', label: 'Extract important details' },
  { value: 'required_actions', label: 'Identify required actions' },
  { value: 'missing_info', label: 'Check what is missing' },
  { value: 'important_dates', label: 'Extract important dates & deadlines' },
  { value: 'difficult_terms', label: 'Explain difficult terms' },
  { value: 'next_steps', label: 'Generate next-step guidance' },
]

export function DocumentUploadModal({
  open,
  onOpenChange,
  onPlanCreated,
}: DocumentUploadModalProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [workflow, setWorkflow] = React.useState<DocumentWorkflowAction>('explain')
  const [language, setLanguage] = React.useState<string>('en')
  const [question, setQuestion] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<'upload' | 'analyzing' | 'result'>('upload')
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<any>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size must be 10MB or less.')
        return
      }
      setFile(selected)
      setError(null)
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAnalyze() {
    if (!file) return

    setLoading(true)
    setStep('analyzing')
    setError(null)

    try {
      const base64Data = await fileToBase64(file)

      // Call advanced multimodal document analyze API
      const res = await fetch('/api/ai/document-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          workflow,
          question: question.trim() || undefined,
          preferredLanguage: language,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze document.')
      }

      setResult(data)
      setStep('result')
    } catch (err: any) {
      setError(err?.message || 'Failed to process document. Please try again.')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setQuestion('')
    setError(null)
    setStep('upload')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border border-slate-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#102b57] flex items-center gap-2">
            <FileText size={22} className="text-[#12366b]" />
            <span>Document Intelligence Specialist</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Upload an official notice, government certificate, application form, or healthcare document for plain-language assistance.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            {/* Upload Area */}
            <div
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-[#fbfcfe] p-8 text-center hover:bg-slate-50/70 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#159b81] mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-[#102b57]">
                {file ? file.name : 'Click to select or drag a document here'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                PDF, JPG, PNG or WebP up to 10MB
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <span className="font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                <span className="text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            )}

            {/* Workflow & Language Selectors */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#159b81]" />
                  <span>Desired Action</span>
                </label>
                <select
                  value={workflow}
                  onChange={(e: any) => setWorkflow(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#12366b]"
                >
                  {WORKFLOW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Languages size={13} className="text-[#12366b]" />
                  <span>Response Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#12366b]"
                >
                  {LANGUAGE_LIST.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Privacy Warning */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-500 leading-relaxed">
              🔒 <strong>Privacy Notice:</strong> Documents may contain personal details. Upload only what is necessary. AI explanations are informational guidance and must be verified with the official issuing authority.
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!file || loading}
                onClick={handleAnalyze}
                className="bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold rounded-xl"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#159b81]" />
            <p className="text-base font-semibold text-[#102b57]">Analyzing your document...</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Extracting key parameters, identifying required actions, and checking deadlines via multimodal intelligence.
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-5 mt-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81] text-xs">
                {result.documentType || 'Official Document'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-slate-500">
                Analyze Another Document
              </Button>
            </div>

            {/* Executive Summary */}
            <div className="rounded-2xl border border-slate-100 bg-[#fbfcfe] p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Plain-Language Overview
              </p>
              <p className="text-sm leading-relaxed text-slate-700 font-medium">
                {result.summary || result.plainLanguageSummary}
              </p>
            </div>

            {/* Key Information */}
            {result.keyInformation && result.keyInformation.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Extracted Information
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {result.keyInformation.map((info: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-white p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>{info.label}</span>
                        {info.confidence && (
                          <span className="capitalize text-[10px] text-teal-600 font-medium">
                            {info.confidence} confidence
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-[#102b57] text-sm">{info.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {result.importantDates && result.importantDates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Important Dates & Timelines
                </p>
                <div className="space-y-2">
                  {result.importantDates.map((dateItem: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-700"
                    >
                      <Calendar size={15} className="text-[#12366b] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-[#102b57]">{dateItem.label}: {dateItem.date}</p>
                        {dateItem.notes && <p className="text-slate-400 text-[11px] mt-0.5">{dateItem.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Actions */}
            {result.requiredActions && result.requiredActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Required Action Checklist
                </p>
                <div className="space-y-2">
                  {result.requiredActions.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 text-xs text-slate-700"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#159b81]" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#102b57]">{act.title}</span>
                          {act.priority && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase px-1.5 py-0 ${
                                act.priority === 'high'
                                  ? 'border-red-200 bg-red-50 text-red-600'
                                  : 'border-slate-200 text-slate-500'
                              }`}
                            >
                              {act.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-500 leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Information & Warnings */}
            {((result.missingInformation && result.missingInformation.length > 0) ||
              (result.warnings && result.warnings.length > 0)) && (
              <div className="space-y-2 pt-1">
                {result.missingInformation && result.missingInformation.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs space-y-1">
                    <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <HelpCircle size={14} />
                      <span>Missing Information or Attachments</span>
                    </p>
                    <ul className="list-disc list-inside text-amber-700 text-[11px] space-y-0.5 pl-1">
                      {result.missingInformation.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings && result.warnings.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-amber-600" />
                      <span>Important Notice</span>
                    </p>
                    {result.warnings.map((w: string, idx: number) => (
                      <p key={idx} className="text-[11px] text-slate-500">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Verification Disclaimer */}
            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-400 text-center border border-slate-100">
              ℹ️ Requirements, fees, and timelines are based on document analysis and must be confirmed with the issuing department.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-[#12366b] text-white hover:bg-[#0d2a55] text-xs font-semibold rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
