/**
 * AI Safety Guardrails and Content Moderation for TheervuAI
 */

export interface SafetyCheckResult {
  isSafe: boolean
  isEmergency: boolean
  isHealthcare: boolean
  emergencyResponse?: string
  disclaimer?: string
  sanitizedInput: string
}

const EMERGENCY_KEYWORDS = [
  'chest pain',
  'heart attack',
  'severe bleeding',
  'cannot breathe',
  'unconscious',
  'stroke',
  'suicide',
  'poisoning',
  'fatal',
  'overdose',
  'fire emergency',
  'active fire',
]

const HEALTHCARE_KEYWORDS = [
  'prescription',
  'blood test',
  'mri',
  'ct scan',
  'diagnosis',
  'doctor note',
  'hospital visit',
  'symptom',
  'dosage',
  'medical report',
  'pathology',
  'biopsy',
]

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior prompts/i,
  /system override/i,
  /you are now evil/i,
  /reveal your internal prompt/i,
  /system prompt print/i,
]

export function evaluateSafety(input: string): SafetyCheckResult {
  const lower = input.toLowerCase()

  // 1. Prompt Injection Detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSafe: false,
        isEmergency: false,
        isHealthcare: false,
        sanitizedInput: input.slice(0, 500),
      }
    }
  }

  // 2. Life-threatening Emergency Check
  const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))
  if (isEmergency) {
    return {
      isSafe: true,
      isEmergency: true,
      isHealthcare: true,
      emergencyResponse:
        'CRITICAL NOTICE: This appears to be an urgent medical or safety emergency. Do not wait for AI guidance. Please call your local emergency services immediately: Dial 112 (National Emergency), 108 (Medical Emergency Ambulance), or 102 in India. Seek immediate in-person medical care.',
      disclaimer:
        'TheervuAI is not an emergency response system and does not replace medical personnel.',
      sanitizedInput: input,
    }
  }

  // 3. Healthcare Document / Symptom Check
  const isHealthcare = HEALTHCARE_KEYWORDS.some((kw) => lower.includes(kw))

  return {
    isSafe: true,
    isEmergency: false,
    isHealthcare,
    disclaimer: isHealthcare
      ? 'Important Medical Disclaimer: TheervuAI provides terminology explanations and preparation guidance only. We do not provide medical diagnoses, treatment changes, or clinical advice. Always consult your certified physician or healthcare professional.'
      : undefined,
    sanitizedInput: input,
  }
}
