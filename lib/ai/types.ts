/**
 * Core TypeScript definitions for the TheervuAI centralized Gemini AI service.
 */

// ==============================================================================
// 1. Structured Output Types (Section 6 Specification)
// ==============================================================================

export interface ChecklistStep {
  title: string
  description: string
  required: boolean
}

export interface DocumentRequirement {
  name: string
  description: string
  mandatory: boolean | 'unknown'
}

export interface FeeItem {
  name: string
  amount: string
  notes: string
}

export interface TimingEstimate {
  estimatedDuration: string
  bestTimeToVisit: string
}

export interface StructuredBeforeYouGoPlan {
  title: string
  summary: string
  steps: ChecklistStep[]
  documents: DocumentRequirement[]
  fees: FeeItem[]
  timing: TimingEstimate
  warnings: string[]
  sourceNotes: string[]
}

// ==============================================================================
// 2. Chat Assistant Types
// ==============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatSource {
  title: string
  url: string
  authority: string
}

export interface ChatResponse {
  answer: string
  summary: string
  steps: string[]
  sources: ChatSource[]
  disclaimer?: string
  isEmergency: boolean
}

// ==============================================================================
// 3. Document Explanation Types
// ==============================================================================

export interface DocumentKeyDetail {
  label: string
  value: string
}

export interface DocumentExplanationResult {
  documentType: string
  plainLanguageSummary: string
  keyDetails: DocumentKeyDetail[]
  actionItems: string[]
  questionsToAsk: string[]
  warnings: string[]
  disclaimer?: string
}

// ==============================================================================
// 4. Error Handling & Safety Types
// ==============================================================================

export type GeminiErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTH_FAILED'
  | 'TIMEOUT'
  | 'INVALID_PAYLOAD'
  | 'GENERATION_FAILED'
  | 'SAFETY_BLOCKED'

export interface NormalizedGeminiError {
  userMessage: string
  code: GeminiErrorCode
  isRateLimit: boolean
}

export interface SafetyEvaluationResult {
  isSafe: boolean
  isEmergency: boolean
  sanitizedInput: string
  emergencyResponse?: string
  disclaimer?: string
  reason?: string
}
