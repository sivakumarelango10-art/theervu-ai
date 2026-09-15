'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  ExternalLink,
  FileText,
  Languages,
  Loader2,
  Menu,
  Mic,
  MicOff,
  Paperclip,
  Search,
  ShieldCheck,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { UserNav } from '@/components/auth/UserNav'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { LANGUAGE_LIST, getLanguageByCode } from '@/lib/i18n/languages'

const DocumentUploadModal = dynamic(
  () => import('@/components/documents/DocumentUploadModal').then((m) => m.DocumentUploadModal),
  { ssr: false }
)
const FeedbackModal = dynamic(
  () => import('@/components/feedback/FeedbackModal').then((m) => m.FeedbackModal),
  { ssr: false }
)

const logoUrl = '/theervu-logo.png'


const querySchema = z.object({
  question: z
    .string()
    .min(3, { message: 'Please describe your situation (at least 3 characters).' })
    .max(1000, { message: 'Question cannot exceed 1000 characters.' }),
})

type QueryFormValues = z.infer<typeof querySchema>

const capabilities = [
  {
    icon: Search,
    title: 'Understand the task',
    body: 'Tell us what feels confusing. We turn everyday language into a clear, actionable next step.',
    action: 'ask',
  },
  {
    icon: FileText,
    title: 'Make sense of documents',
    body: 'Get plain-language explanations of forms, official letters, policies, and complex instructions.',
    action: 'upload',
  },
  {
    icon: ShieldCheck,
    title: 'Verify what matters',
    body: 'See source context clearly, what is confirmed, and what still needs your verification.',
    action: 'services',
  },
  {
    icon: Zap,
    title: 'Move forward with confidence',
    body: 'Receive a practical plan tailored to your situation, not a generic computer-generated answer.',
    action: 'before-you-go',
  },
]

const steps = [
  {
    number: '01',
    title: 'Describe your situation',
    body: 'Start with a question, an official notice, or a goal. No technical terminology or special phrasing needed.',
  },
  {
    number: '02',
    title: 'Get structured guidance',
    body: 'TheervuAI organizes the details into plain-language answers, practical options, and immediate actions.',
  },
  {
    number: '03',
    title: 'Take your next step',
    body: 'Use your personalized checklist to prepare with confidence, make informed decisions, and move forward.',
  },
]

const quickPrompts = [
  "Doctor's visit",
  'Official notice',
  'What to prepare?',
]

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function Page() {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false)

  // AI Response state
  const [loading, setLoading] = React.useState(false)
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [aiResponse, setAiResponse] = React.useState<{
    answer: string
    summary: string
    steps?: string[]
    sources?: Array<{ title: string; url: string; authority: string }>
    disclaimer?: string
    isEmergency?: boolean
  } | null>(null)

  // Regional Language selection
  const [selectedLang, setSelectedLang] = React.useState('en')

  // Modular Voice Input Hook
  const voiceInput = useVoiceInput({
    defaultLanguage: selectedLang,
    onTranscript: (text) => {
      form.setValue('question', text, { shouldValidate: true })
    },
  })

  // Modular Voice Output Hook
  const voiceOutput = useVoiceOutput()

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      question: '',
    },
  })

  async function onSubmit(values: QueryFormValues) {
    setLoading(true)
    setIsStreaming(true)
    setAiResponse({
      summary: 'Analyzing your situation...',
      answer: '',
      steps: [],
      sources: [],
    })
    voiceOutput.stop()

    try {
      const res = await fetch('/api/ai/chat?stream=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: values.question,
          preferredLanguage: selectedLang,
          stream: true,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed.' }))
        setAiResponse({
          summary: 'Could not complete request.',
          answer: errData.error || 'Please try again.',
        })
        return
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedAnswer = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data: ')) {
              try {
                const event = JSON.parse(trimmed.slice(6))
                if (event.type === 'token' && event.content) {
                  accumulatedAnswer += event.content
                  setAiResponse((prev) => ({
                    summary:
                      prev?.summary === 'Analyzing your situation...'
                        ? 'Guidance for your situation'
                        : prev?.summary || 'Guidance for your situation',
                    answer: accumulatedAnswer,
                    steps: prev?.steps,
                    sources: prev?.sources,
                    disclaimer: prev?.disclaimer,
                    isEmergency: prev?.isEmergency,
                  }))
                } else if (event.type === 'done' && event.data) {
                  setAiResponse((prev) => ({
                    ...event.data,
                    answer: accumulatedAnswer || event.data.answer || prev?.answer || '',
                  }))
                }
              } catch {}
            }
          }
        }
      } else {
        const data = await res.json()
        setAiResponse(data)
      }
    } catch {
      setAiResponse({
        summary: 'Connection error',
        answer: 'We could not reach the assistance server. Please check your internet connection and try again.',
      })
    } finally {
      setIsStreaming(false)
      setLoading(false)
    }
  }

  function handlePromptClick(promptText: string) {
    form.setValue('question', promptText, { shouldValidate: true })
    setAiResponse(null)
    voiceOutput.stop()
  }

  function toggleVoiceInput() {
    if (voiceInput.isListening) {
      voiceInput.stopListening()
    } else {
      voiceInput.startListening(selectedLang)
    }
  }

  function handleCapabilityClick(action: string) {
    if (action === 'ask') {
      const input = document.getElementById('question')
      input?.focus()
    } else if (action === 'upload') {
      setUploadModalOpen(true)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <Link href="#top" className="flex items-center" aria-label="TheervuAI home">
            <Image
              src={logoUrl}
              alt="TheervuAI"
              width={160}
              height={40}
              priority
              className="h-10 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link
              href="/before-you-go"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#12366b]"
            >
              Before You Go
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#12366b]"
            >
              Services
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#12366b]"
            >
              How it works
            </a>
            <a
              href="#trust"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#12366b]"
            >
              Why TheervuAI
            </a>
            <UserNav />
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <UserNav />
            <button
              className="rounded-md p-2 text-[#12366b]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-100 px-5 py-4 md:hidden"
            >
              <div className="flex flex-col gap-4 text-sm">
                <Link
                  href="/before-you-go"
                  onClick={() => setMenuOpen(false)}
                  className="font-medium text-slate-700"
                >
                  Before You Go
                </Link>
                <Link
                  href="/services"
                  onClick={() => setMenuOpen(false)}
                  className="font-medium text-slate-700"
                >
                  Services Directory
                </Link>
                <a
                  href="#how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className="font-medium text-slate-700"
                >
                  How it works
                </a>
                <a
                  href="#trust"
                  onClick={() => setMenuOpen(false)}
                  className="font-medium text-slate-700"
                >
                  Why TheervuAI
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section id="top" className="relative border-b border-slate-100 bg-[#fbfcfe] pt-8 pb-14 sm:pt-12 sm:pb-18">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          {/* Top text block: Headline, Description, Plain-language answers */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-[#102b57] sm:text-4xl lg:text-[46px] text-balance">
              Turn confusion into a clear next step.
            </h1>
            <p className="mx-auto mt-3.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base text-pretty">
              TheervuAI helps you understand complex situations, prepare with confidence, and
              move forward with guidance you can trust.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-[#159b81] shrink-0" /> Plain-language answers
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-[#159b81] shrink-0" /> Source-aware guidance
              </span>
            </div>
          </motion.div>

          {/* This down: The chat box */}
          <motion.div
            id="assistant"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative mx-auto mt-7 max-w-[760px]"
          >
            <div
              className="absolute -top-10 left-1/2 h-36 w-72 -translate-x-1/2 rounded-full bg-[#e4f7f3] blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <Card className="relative overflow-hidden rounded-2xl border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/50 sm:p-3">
              <div className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">
                      Your starting point
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-[#243b61]">
                      What would you like to solve?
                    </h2>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Compass size={18} className="text-[#12366b]" />
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-all focus-within:border-[#12366b] focus-within:ring-3 focus-within:ring-[#12366b]/10">
                            <FormControl>
                              <Textarea
                                {...field}
                                id="question"
                                onChange={(e) => {
                                  field.onChange(e)
                                  if (aiResponse) setAiResponse(null)
                                }}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === 'Enter' &&
                                    !e.shiftKey &&
                                    !e.nativeEvent.isComposing
                                  ) {
                                    e.preventDefault()
                                    form.handleSubmit(onSubmit)()
                                  }
                                }}
                                placeholder="For example: I need to prepare for a hospital visit, understand an official notice, or clarify next steps..."
                                className="min-h-[96px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-[#243b61] shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0"
                              />
                            </FormControl>
                            <div className="mt-2.5 flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1 text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => setUploadModalOpen(true)}
                                  aria-label="Upload document to analyze"
                                  title="Upload document"
                                  className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                >
                                  <Paperclip size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={toggleVoiceInput}
                                  aria-label={voiceInput.isListening ? "Stop voice dictation" : "Start voice dictation"}
                                  aria-pressed={voiceInput.isListening}
                                  title={voiceInput.isListening ? "Listening... Click to stop" : "Voice dictation"}
                                  className={`rounded-md p-1.5 transition-colors ${
                                    voiceInput.isListening
                                      ? 'bg-rose-100 text-rose-600 animate-pulse'
                                      : 'hover:bg-slate-100 hover:text-slate-600'
                                  }`}
                                >
                                  {voiceInput.isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                                {voiceInput.isListening && (
                                  <div className="flex items-center gap-1.5 pl-1" aria-label="Audio active">
                                    <span className="text-[11px] font-semibold text-rose-600">
                                      Listening
                                    </span>
                                    <div className="flex items-end gap-0.5 h-3.5" title={`Audio level: ${voiceInput.audioLevel}%`}>
                                      <span
                                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(4, (voiceInput.audioLevel * 14) / 100)}px` }}
                                      />
                                      <span
                                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(6, (voiceInput.audioLevel * 18) / 100)}px` }}
                                      />
                                      <span
                                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(4, (voiceInput.audioLevel * 12) / 100)}px` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Regional Language Dropdown */}
                                <div className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-2">
                                  <Languages size={13} className="text-slate-400" />
                                  <select
                                    value={selectedLang}
                                    onChange={(e) => setSelectedLang(e.target.value)}
                                    aria-label="Select response language"
                                    className="bg-transparent text-[11px] font-medium text-slate-600 outline-none hover:text-slate-900 cursor-pointer"
                                  >
                                    {LANGUAGE_LIST.map((l) => (
                                      <option key={l.code} value={l.code}>
                                        {l.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={loading}
                                aria-disabled={loading}
                                aria-label={loading ? 'Generating AI response, please wait' : 'Submit your question'}
                                className="h-8 gap-1.5 bg-[#12366b] px-3.5 text-xs font-semibold text-white hover:bg-[#0d2a55] whitespace-nowrap"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Continue</span>
                                    <ArrowRight size={13} className="shrink-0" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>

                {/* AI Assistant Response Card */}
                <AnimatePresence>
                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed space-y-3 ${
                        aiResponse.isEmergency
                          ? 'border-red-200 bg-red-50/60 text-red-900'
                          : 'border-teal-200 bg-[#f2fbf8] text-[#286b5d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-[#102b57]">
                          {aiResponse.summary}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Voice Read Aloud Button */}
                          {voiceOutput.isSupported && (
                            <button
                              type="button"
                              onClick={() => {
                                if (voiceOutput.isPlaying) {
                                  voiceOutput.stop()
                                } else {
                                  voiceOutput.speak(aiResponse.answer, selectedLang)
                                }
                              }}
                              className={`h-7 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                voiceOutput.isPlaying
                                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                              title={voiceOutput.isPlaying ? 'Stop voice reading' : 'Read answer aloud'}
                            >
                              {voiceOutput.isPlaying ? (
                                <>
                                  <Square size={11} className="fill-current" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={13} className="text-[#159b81]" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>
                          )}

                          <Button
                            asChild
                            size="xs"
                            className="h-7 bg-[#12366b] text-white hover:bg-[#0d2a55] text-[11px] font-semibold"
                          >
                            <Link
                              href={`/before-you-go?task=${encodeURIComponent(
                                form.getValues('question')
                              )}`}
                            >
                              Turn into Checklist
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <p className="text-slate-700 whitespace-pre-line text-xs font-normal">
                        {aiResponse.answer}
                        {isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-[#159b81] ml-0.5 animate-pulse align-middle" />
                        )}
                      </p>

                      {aiResponse.steps && aiResponse.steps.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                            Recommended Next Steps:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                            {aiResponse.steps.map((st, i) => (
                              <li key={i}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiResponse.sources && aiResponse.sources.length > 0 && (
                        <div className="pt-2 border-t border-teal-100 flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Source:
                          </span>
                          {aiResponse.sources.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#12366b] hover:underline"
                            >
                              <span>{s.title}</span>
                              <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      )}

                      {aiResponse.disclaimer && (
                        <p className="text-[10px] text-slate-400 italic pt-1">
                          {aiResponse.disclaimer}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Try asking:</span>
                  {quickPrompts.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePromptClick(item)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How it works Section - Clean, beautifully structured layout */}
      <section id="how-it-works" className="border-b border-slate-100 bg-[#f8fafc]/50 py-20 lg:py-28">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#159b81]">
              A simpler way forward
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#102b57] sm:text-4xl text-balance">
              From question to confidence.
            </h2>
            <p className="mt-3.5 text-base leading-relaxed text-slate-600 text-pretty">
              You bring the situation. We organize the details so you always know what comes next.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="mt-14 grid gap-6 md:grid-cols-3"
          >
            {steps.map(({ number, title, body }, i) => (
              <motion.div
                key={number}
                variants={fadeInUp}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 font-bold text-[#159b81] text-sm">
                      {number}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[#102b57] leading-snug">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 text-pretty">
                    {body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="mx-auto max-w-[1180px] px-5 py-20 lg:px-8 lg:py-28">
        <div className="max-w-[620px]">
          <span className="text-xs font-bold uppercase tracking-[.16em] text-[#159b81]">
            One trusted place to begin
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-[#102b57] sm:text-4xl text-balance">
            Make the complicated feel manageable.
          </h2>
          <p className="mt-3.5 text-base leading-relaxed text-slate-600 text-pretty">
            From healthcare and government services to everyday decisions, TheervuAI helps you
            find your footing.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {capabilities.map(({ icon: Icon, title, body, action }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {action === 'services' ? (
                <Link href="/services" className="block h-full">
                  <Card className="group h-full flex flex-col justify-between rounded-xl border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff5fb] text-[#28558c]">
                          <Icon size={20} />
                        </div>
                        <h3 className="mt-5 text-base font-semibold text-[#243b61] leading-snug">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
                          {body}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="mt-6 text-slate-400 transition-colors group-hover:text-[#159b81]"
                      />
                    </CardContent>
                  </Card>
                </Link>
              ) : action === 'before-you-go' ? (
                <Link href="/before-you-go" className="block h-full">
                  <Card className="group h-full flex flex-col justify-between rounded-xl border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff5fb] text-[#28558c]">
                          <Icon size={20} />
                        </div>
                        <h3 className="mt-5 text-base font-semibold text-[#243b61] leading-snug">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
                          {body}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="mt-6 text-slate-400 transition-colors group-hover:text-[#159b81]"
                      />
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <div
                  onClick={() => handleCapabilityClick(action)}
                  className="cursor-pointer h-full"
                >
                  <Card className="group h-full flex flex-col justify-between rounded-xl border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff5fb] text-[#28558c]">
                          <Icon size={20} />
                        </div>
                        <h3 className="mt-5 text-base font-semibold text-[#243b61] leading-snug">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
                          {body}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="mt-6 text-slate-400 transition-colors group-hover:text-[#159b81]"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust & Principles Section */}
      <section
        id="trust"
        className="mx-auto grid max-w-[1180px] gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28"
      >
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff8f5] text-[#159b81]">
            <ShieldCheck size={22} />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#102b57] sm:text-4xl text-balance">
            Guidance that respects your context.
          </h2>
          <p className="mt-4 max-w-[470px] text-base leading-relaxed text-slate-600 text-pretty">
            TheervuAI is designed to be helpful without pretending every answer is universal. We
            make uncertainty visible and keep you in control.
          </p>
          <Button
            asChild
            variant="link"
            className="mt-5 p-0 text-sm font-semibold text-[#12366b] hover:text-[#159b81]"
          >
            <Link href="/before-you-go" className="inline-flex items-center gap-1.5">
              <span>Start with a visit plan</span>
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#243b61]">
              Official sources, clearly marked
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
              Know where important information comes from before you act on it.
            </p>
          </Card>
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#243b61]">No question is too small</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
              Start wherever you are. We&apos;ll help organize the rest.
            </p>
          </Card>
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#243b61]">Built for real life</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
              Clear, practical guidance for the moments that matter most.
            </p>
          </Card>
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#243b61]">Your pace, your choices</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
              You decide what to share and which step to take next.
            </p>
          </Card>
        </div>
      </section>

      {/* Regional Language / Access Banner */}
      <section className="border-t border-slate-100 bg-[#f3faf8]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 px-5 py-16 sm:flex-row sm:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#286b5d]">
              <Languages size={17} /> Help that meets you where you are
            </div>
            <p className="mt-3 max-w-[600px] text-2xl font-semibold tracking-[-0.025em] text-[#123b58] text-balance">
              Clearer answers should be accessible to everyone.
            </p>
            <p className="mt-2 text-sm text-[#668278]">
              TheervuAI supports Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, and Gujarati.
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 h-11 px-6 rounded-xl bg-[#12366b] text-white hover:bg-[#0d2a55] shadow-xs"
          >
            <Link href="/settings" className="inline-flex items-center gap-2 whitespace-nowrap">
              <span>Choose Your Language</span>
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Trust, Privacy & Official Verification Section */}
      <section id="trust" className="border-t border-slate-100 bg-white py-16 scroll-mt-20">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#159b81]">
              Transparency & Reliability
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102b57] sm:text-3xl">
              Built on Trust, Privacy, and Safety
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              When preparing for visits to public institutions, accuracy and clarity matter. Here is how TheervuAI safeguards your privacy and delivers verified guidance.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#159b81] ring-1 ring-teal-200">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#102b57]">Verified Sources</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Procedures are cross-referenced with official portals (<code className="text-[11px] font-mono text-slate-600">.gov.in</code>, <code className="text-[11px] font-mono text-slate-600">.nic.in</code>) and verified departmental citizen charters.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#12366b] ring-1 ring-blue-200">
                <FileText size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#102b57]">Ephemeral Documents</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Uploaded notices and medical summaries are analyzed strictly in-memory. Documents are never stored or repurposed without your explicit consent.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200">
                <Mic size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#102b57]">Zero Audio Storage</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Voice dictation runs on-device using browser speech recognition. No raw voice recordings are stored or retained on any server.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <Compass size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#102b57]">Civic Independence</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                TheervuAI is an independent assistance guide. We are not a government agency and do not guarantee application approvals or replace professional counsel.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>
                <strong>Emergency Assistance Notice:</strong> For immediate medical, fire, or safety emergencies, call national dispatchers directly at <strong className="underline">112</strong> or <strong className="underline">108</strong>.
              </span>
            </div>
            <a
              href="tel:112"
              className="font-semibold text-[#12366b] hover:underline"
            >
              Call 112 Dispatch →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image src={logoUrl} alt="TheervuAI" width={144} height={36} className="h-9 w-auto object-contain" />
            <span className="hidden text-xs text-slate-400 sm:inline">
              Clarity for what comes next.
            </span>
          </div>
          <div className="flex gap-5 text-xs text-slate-500">
            <Link href="/services" className="transition-colors hover:text-[#12366b]">
              Services
            </Link>
            <Link href="/before-you-go" className="transition-colors hover:text-[#12366b]">
              Before You Go
            </Link>
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="transition-colors hover:text-[#12366b]"
            >
              Feedback
            </button>
            <a href="#trust" className="transition-colors hover:text-[#12366b]">
              Privacy & Safety
            </a>
          </div>
          <p className="text-xs text-slate-400">© 2026 TheervuAI</p>
        </div>
      </footer>

      {/* Modals */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
      />
    </main>
  )
}
