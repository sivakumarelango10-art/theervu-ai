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
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react'

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanCreated?: (planData: any) => void
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  onPlanCreated,
}: DocumentUploadModalProps) {
  const [file, setFile] = React.useState<File | null>(null)
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

  async function handleAnalyze() {
    if (!file) return

    setLoading(true)
    setStep('analyzing')
    setError(null)

    try {
      // 1. Upload File
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'Official or Medical Document')

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Upload failed.')
      }

      // 2. Explain Document
      const explainRes = await fetch('/api/ai/explain-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: uploadData.id,
          extractedText:
            uploadData.extractedText ||
            `Document submitted: ${file.name}. Review procedural requirements and dates.`,
          documentType: 'Official Document',
        }),
      })

      const explainData = await explainRes.json()
      if (!explainRes.ok) {
        throw new Error(explainData.error || 'Explanation generation failed.')
      }

      setResult(explainData)
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
    setStep('upload')
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#102b57] flex items-center gap-2">
            <FileText className="text-[#159b81]" size={22} />
            <span>Make Sense of a Document</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Upload an official letter, government notice, or medical report for a clear, plain-English breakdown.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="mt-4 space-y-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-[#fbfcfe] p-8 text-center transition-all hover:border-[#12366b]/40 hover:bg-slate-50/60"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#159b81]">
                <UploadCloud size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#102b57]">
                {file ? file.name : 'Click to select or drag and drop'}
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
                className="border-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!file || loading}
                onClick={handleAnalyze}
                className="bg-[#12366b] text-white hover:bg-[#0d2a55]"
              >
                Analyze Document
              </Button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#159b81]" />
            <p className="text-sm font-semibold text-[#102b57]">Analyzing your document...</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Extracting key requirements, simplifying bureaucratic language, and preparing action steps.
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81]">
                {result.documentType || 'Official Document'}
              </Badge>
              <Button variant="ghost" size="xs" onClick={reset} className="text-xs text-slate-500">
                Upload another
              </Button>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Plain-Language Explanation
              </p>
              <p className="text-sm leading-relaxed text-slate-700 font-medium">
                {result.plainLanguageSummary}
              </p>
            </div>

            {/* Action Items */}
            {result.actionItems && result.actionItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  What you should do next
                </p>
                <div className="space-y-2">
                  {result.actionItems.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-3 text-xs text-slate-700 shadow-2xs"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#159b81]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions to Ask Doctor or Official */}
            {result.questionsToAsk && result.questionsToAsk.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Questions to ask your doctor or counter official
                </p>
                <div className="space-y-1.5">
                  {result.questionsToAsk.map((q: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600"
                    >
                      <HelpCircle size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-100 pt-3">
                {result.disclaimer}
              </p>
            )}

            <div className="flex justify-end pt-3">
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-[#12366b] text-white hover:bg-[#0d2a55]"
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
