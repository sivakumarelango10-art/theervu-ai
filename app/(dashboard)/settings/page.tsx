'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserNav } from '@/components/auth/UserNav'
import { createClient } from '@/lib/supabase/client'
import { SUPPORTED_LANGUAGES } from '@/lib/ai/prompts'
import { ArrowLeft, Check, Globe, Loader2, User } from 'lucide-react'

const logoUrl = '/theervu-logo.png'

export default function SettingsPage() {
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [language, setLanguage] = React.useState('en')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (data.profile) {
          setFullName(data.profile.full_name || '')
          setEmail(data.profile.email || '')
          setLanguage(data.profile.preferred_language || 'en')
        }
      } catch (err) {
        console.warn('Could not load profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          preferred_language: language,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile settings.')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err: any) {
      setError(err?.message || 'Error saving settings.')
    } finally {
      setSaving(false)
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
              Profile & Preferences
            </span>
          </div>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#12366b] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#102b57] sm:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your display name and preferred language for AI guidance.
            </p>
          </div>

          <Card className="rounded-2xl border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            {loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                <p className="text-xs text-slate-400">Loading settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="h-10 text-sm"
                    required
                  />
                </div>

                {/* Email (Google Auth) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Email Address
                  </label>
                  <Input
                    value={email}
                    disabled
                    className="h-10 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Linked to your Google account.
                  </p>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Preferred AI Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.name} ({info.nativeName})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    TheervuAI will provide preparation plans and advice in your chosen regional language.
                  </p>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                {success && (
                  <div className="flex items-center gap-2 rounded-lg bg-teal-50 p-2.5 text-xs text-[#159b81] font-medium">
                    <Check size={14} />
                    <span>Your preferences have been saved successfully.</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#12366b] text-white hover:bg-[#0d2a55] font-semibold text-xs h-9 px-5"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
