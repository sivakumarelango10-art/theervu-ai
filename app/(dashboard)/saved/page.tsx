'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserNav } from '@/components/auth/UserNav'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react'

const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202026%2C%2012_32_08%20PM-ujooLO8049TXC3GzHMoaAhqYO0csBM.png'

export default function SavedItemsPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch('/api/saved-items')
        const data = await res.json()
        if (data.savedItems) {
          setItems(data.savedItems)
        }
      } catch (err) {
        console.warn('Could not load saved items:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSaved()
  }, [])

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/saved-items/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('Failed to delete item:', err)
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
              Saved Items
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

        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-[#102b57] sm:text-4xl">
            Saved Plans & Checklists
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Access your saved preparation plans and checklists across visits.
          </p>
        </div>

        <div className="mt-8">
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
                        onClick={() => handleDelete(item.id)}
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
      </main>
    </div>
  )
}
