'use client'

import * as React from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Fatal Global Error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#fbfcfe] px-6 text-center font-sans antialiased text-slate-800">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#102b57]">System Error</h1>
          <p className="text-sm text-slate-500">
            A critical error occurred while rendering the application layout.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-[#12366b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2a55]"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  )
}
