'use client'

import React from 'react'
import Link from 'next/link'
import {
  X,
  ShieldCheck,
  ExternalLink,
  Clock,
  Building,
  FileCheck2,
  CalendarCheck2,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CivicService } from '@/lib/data/services'
import { OFFICIAL_SOURCE_DISCLAIMER } from '@/lib/sources/verifier'

export interface ServiceDetailModalProps {
  service: CivicService | null
  isOpen: boolean
  onClose: () => void
}

export function ServiceDetailModal({
  service,
  isOpen,
  onClose,
}: ServiceDetailModalProps) {
  if (!isOpen || !service) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-service-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[#159b81] text-[11px] font-semibold">
                {service.category}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="h-3 w-3" />
                Verified Portal Data
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {service.state}
              </span>
            </div>
            <h2 id="modal-service-title" className="text-xl font-bold text-[#102b57] tracking-tight">
              {service.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {service.department} • {service.authority}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
            aria-label="Close service details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-slate-700 text-sm">
          {/* Overview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Overview</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {service.description}
            </p>
          </div>

          {/* Key Facts Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Building className="h-3.5 w-3.5 text-slate-500" />
                <span>Office to Visit</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{service.officeType}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <CalendarCheck2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Appointment</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {service.appointmentRequired ? 'Prior Slot Mandatory' : 'Walk-in / Direct'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Timeline</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{service.expectedTimeline}</p>
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                Required Documents
              </h3>
              <span className="text-[11px] text-slate-400">
                {service.requiredDocuments.filter((d) => d.mandatory).length} Mandatory
              </span>
            </div>
            <div className="space-y-2">
              {service.requiredDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3 border text-xs leading-relaxed ${
                    doc.mandatory
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-100 bg-slate-50/50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{doc.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.mandatory
                          ? 'bg-amber-100/70 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-slate-600">{doc.description}</p>
                  {doc.alternatives && doc.alternatives.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-400 italic">
                      Accepted alternatives: {doc.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              Eligibility Criteria
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              {service.eligibility.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Official Fees */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              Official Fees & Payment Mode
            </h3>
            <div className="space-y-1.5">
              {service.fees.map((fee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-800">{fee.name}</span>
                    <span className="text-slate-400 ml-2">({fee.paymentMode})</span>
                  </div>
                  <span className="font-bold text-slate-900">{fee.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Procedure */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Standard Procedure Steps
            </h3>
            <div className="space-y-2">
              {service.applicationSteps.map((step) => (
                <div key={step.stepNumber} className="flex gap-3 text-xs">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#12366b] text-white font-bold text-[10px]">
                    {step.stepNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{step.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                        {step.isOnline ? 'Online' : 'In-Person'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Advisories */}
          {service.importantNotes && service.importantNotes.length > 0 && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                Official Guidelines & Advisories
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-950">
                {service.importantNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Disclaimer */}
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            <p>
              <strong>Official Source:</strong> {service.sourceName} •{' '}
              <a
                href={service.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#12366b] underline inline-flex items-center gap-0.5"
              >
                {service.officialSourceUrl}
                <ExternalLink size={10} />
              </a>
            </p>
            <p className="mt-1">{OFFICIAL_SOURCE_DISCLAIMER}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <a
            href={service.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#12366b] font-medium"
          >
            <span>Visit {service.sourceName}</span>
            <ExternalLink size={13} />
          </a>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Close
            </Button>

            <Button
              asChild
              size="sm"
              className="h-9 rounded-lg bg-[#12366b] px-4 text-xs font-semibold text-white hover:bg-[#0d2a55]"
            >
              <Link
                href={`/before-you-go?task=${encodeURIComponent(service.name)}&service=${encodeURIComponent(
                  service.slug
                )}`}
                className="gap-1.5"
              >
                <span>Prepare for This Service</span>
                <ArrowRight size={13} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
