'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log sanitized error metrics without exposing internal stack traces to users
    console.error('TheervuAI Runtime Error caught by boundary:', error.message)
  }, [error])

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-xs ring-1 ring-amber-200">
        <AlertTriangle size={32} />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#102b57] sm:text-3xl">
        Something went wrong
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        We encountered an unexpected issue while loading this page. No private data or progress was affected.
      </p>

      {error.digest && (
        <p className="mt-2 text-xs font-mono text-slate-400">
          Reference ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="h-10 gap-2 bg-[#12366b] px-5 font-semibold text-white hover:bg-[#0d2a55]"
        >
          <RefreshCw size={15} />
          <span>Try Again</span>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Link href="/">
            <ArrowLeft size={15} />
            <span>Return to Homepage</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
