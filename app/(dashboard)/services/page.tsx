'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserNav } from '@/components/auth/UserNav'
import { type CivicService, SEED_SERVICES } from '@/lib/data/services'
import { LocationSelector } from '@/components/location/LocationSelector'
import { ServiceDetailModal } from '@/components/services/ServiceDetailModal'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Search,
  ShieldCheck,
  Clock,
  Building,
  CalendarCheck2,
  FileText,
} from 'lucide-react'

const logoUrl = '/theervu-logo.png'

const categories = [
  'All',
  'Transport & RTO',
  'Identity & Passports',
  'Civil Supplies & Welfare',
  'Healthcare & Welfare',
  'Revenue & Certificates',
  'Municipal & Property',
  'Pensions & Social Security',
  'Employment & Rights',
]

export default function ServicesPage() {
  const [services, setServices] = React.useState<CivicService[]>(SEED_SERVICES)
  const [selectedCategory, setSelectedCategory] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedState, setSelectedState] = React.useState('All India')
  const [selectedDistrict, setSelectedDistrict] = React.useState('')
  const [selectedServiceForModal, setSelectedServiceForModal] = React.useState<CivicService | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function loadServices() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'All') params.set('category', selectedCategory)
        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        if (selectedState && selectedState !== 'All India') params.set('state', selectedState)
        if (selectedDistrict.trim()) params.set('district', selectedDistrict.trim())

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
  }, [selectedCategory, searchQuery, selectedState, selectedDistrict])

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

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-[.14em] text-emerald-700 border border-emerald-200/50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Civic Intelligence
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#102b57] sm:text-4xl">
              Civic & Institutional Services
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Verified requirements, mandatory documents, official fee structures, and counter procedures for government and public services across India.
            </p>
          </div>

          {/* Location Selector */}
          <div className="shrink-0">
            <LocationSelector
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onStateChange={(st) => setSelectedState(st)}
              onDistrictChange={(dist) => setSelectedDistrict(dist)}
            />
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. Driving Licence, Passport, Ayushman Card, Ration)..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-[#12366b] focus:ring-2 focus:ring-[#12366b]/10"
              aria-label="Search civic services"
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

        {/* Services Count Header */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <span>
            Showing <strong className="text-slate-800">{services.length}</strong> verified services
            {selectedState !== 'All India' ? ` in ${selectedState}` : ''}
            {selectedDistrict ? ` (${selectedDistrict})` : ''}
          </span>
          {loading && <span className="text-xs text-amber-600 animate-pulse">Updating...</span>}
        </div>

        {/* Services Grid */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81] text-[10px]">
                    {svc.category}
                  </Badge>
                  <span className="text-[11px] font-medium text-slate-400">
                    {svc.state}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#102b57] leading-snug group-hover:text-[#12366b] transition-colors">
                  {svc.name}
                </h3>

                <p className="text-xs font-medium text-slate-400 leading-snug">
                  {svc.department} • {svc.authority}
                </p>

                <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                  {svc.description}
                </p>

                {/* Key metadata pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 border border-slate-100">
                    <Building className="h-3 w-3 text-slate-400" />
                    {svc.officeType}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 border border-slate-100">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {svc.expectedTimeline}
                  </span>
                  {svc.appointmentRequired && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 border border-amber-200/60 text-amber-800 font-medium">
                      <CalendarCheck2 className="h-3 w-3" />
                      Appt. Req.
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceForModal(svc)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#12366b] transition-colors"
                >
                  <FileText size={13} />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={svc.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${svc.sourceName}`}
                    className="p-1.5 text-slate-400 hover:text-[#12366b] transition-colors rounded-md hover:bg-slate-50"
                  >
                    <ExternalLink size={14} />
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
                      className="gap-1"
                    >
                      <span>Prepare</span>
                      <ArrowRight size={13} />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {services.length === 0 && !loading && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">No matching verified services found.</p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your state filter or search keywords.
            </p>
          </div>
        )}
      </main>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceForModal}
        isOpen={!!selectedServiceForModal}
        onClose={() => setSelectedServiceForModal(null)}
      />
    </div>
  )
}
