'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserNav } from '@/components/auth/UserNav'
import { type CivicService, SEED_SERVICES } from '@/lib/data/services'
import { ArrowLeft, ArrowRight, ExternalLink, Landmark, Search } from 'lucide-react'

const logoUrl = '/theervu-logo.png'

const categories = [
  'All',
  'Transport & RTO',
  'Identity & Passports',
  'Civil Supplies & Welfare',
  'Healthcare & Welfare',
  'Municipal & Civil Registration',
]

export default function ServicesPage() {
  const [services, setServices] = React.useState<CivicService[]>(SEED_SERVICES)
  const [selectedCategory, setSelectedCategory] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function loadServices() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'All') params.set('category', selectedCategory)
        if (searchQuery.trim()) params.set('q', searchQuery.trim())

        const res = await fetch(`/api/services?${params.toString()}`)
        const data = await res.json()
        if (data.services) {
          setServices(data.services)
        }
      } catch (err) {
        console.warn('Could not fetch services, using seed data:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(loadServices, 250)
    return () => clearTimeout(timer)
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center" aria-label="TheervuAI home">
              <img src={logoUrl} alt="TheervuAI" className="h-9 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Civic Services Directory
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
          <span className="text-xs font-bold uppercase tracking-[.16em] text-[#159b81]">
            Verified Information
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#102b57] sm:text-4xl">
            Civic & Institutional Services
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Explore verified requirements, required documents, and counter guidance for everyday public services.
          </p>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g., Licence, Passport, Ayushman, Ration)..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-[#12366b] focus:ring-2 focus:ring-[#12366b]/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#12366b] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81] text-[10px]">
                    {svc.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{svc.state}</span>
                </div>

                <h3 className="text-lg font-semibold text-[#102b57] leading-snug">
                  {svc.name}
                </h3>

                <p className="text-xs font-medium text-slate-400 leading-snug">
                  {svc.authority}
                </p>

                <p className="text-xs leading-relaxed text-slate-600">
                  {svc.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <a
                  href={svc.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#12366b] font-medium"
                >
                  <span>Official Portal</span>
                  <ExternalLink size={12} />
                </a>

                <Button
                  asChild
                  size="sm"
                  className="h-8 rounded-lg bg-[#12366b] px-3 text-xs font-semibold text-white hover:bg-[#0d2a55]"
                >
                  <Link
                    href={`/before-you-go?task=${encodeURIComponent(svc.name)}&service=${encodeURIComponent(
                      svc.slug
                    )}`}
                    className="gap-1.5"
                  >
                    <span>Prepare</span>
                    <ArrowRight size={13} />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {services.length === 0 && !loading && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">No matching services found.</p>
            <p className="mt-1 text-xs text-slate-400">
              Try searching with different keywords or browse by category.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
