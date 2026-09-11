/**
 * AI Intent Classification Engine for TheervuAI
 *
 * Classifies civic queries into structured intents to route them to the
 * correct workflow. Returns confidence scores, required entities, and
 * missing information so the AI can ask targeted clarifying questions.
 *
 * ZERO HALLUCINATION RULE: This classifier never invents official processes.
 * It only routes — all factual content comes from verified service records.
 */

// ─── Intent Types ───────────────────────────────────────────────────────────

export type CivicIntent =
  | 'general_civic_info'
  | 'scheme_discovery'
  | 'document_lookup'
  | 'eligibility_check'
  | 'application_procedure'
  | 'application_status'
  | 'service_comparison'
  | 'complaint_guidance'
  | 'emergency_civic'
  | 'location_service_discovery'
  | 'document_analysis'
  | 'translation'
  | 'voice_query'
  | 'followup_question'
  | 'action_planning'
  | 'unsupported'

export type RoutingTarget =
  | 'chat_assistant'
  | 'before_you_go'
  | 'service_directory'
  | 'document_analyzer'
  | 'application_tracker'
  | 'complaint_drafter'
  | 'emergency_handler'
  | 'translator'
  | 'action_planner'
  | 'unsupported_handler'

export interface ClassifiedIntent {
  intent: CivicIntent
  confidence: number // 0–1
  routingTarget: RoutingTarget
  requiredEntities: string[] // e.g. ['state', 'service_type']
  missingInfo: string[] // entities we need but don't have
  detectedEntities: Record<string, string> // e.g. { state: 'Tamil Nadu', service: 'passport' }
  flags: {
    isEmergency: boolean
    needsLocation: boolean
    isDocumentRelated: boolean
    isMultiService: boolean
    isFollowUp: boolean
    requiresConfirmation: boolean
  }
}

// ─── Intent Signal Definitions ───────────────────────────────────────────────

interface IntentSignal {
  intent: CivicIntent
  keywords: string[]
  negativeKeywords?: string[]
  routingTarget: RoutingTarget
  requiredEntities: string[]
  weight: number
}

const INTENT_SIGNALS: IntentSignal[] = [
  // Emergency
  {
    intent: 'emergency_civic',
    keywords: ['emergency', 'urgent', 'immediately', 'fire', 'flood', 'disaster', 'accident', 'police help', 'crime', 'theft report'],
    routingTarget: 'emergency_handler',
    requiredEntities: [],
    weight: 10,
  },

  // Document Analysis
  {
    intent: 'document_analysis',
    keywords: ['explain this document', 'what does this letter mean', 'decode this notice', 'upload document', 'analyze document', 'read this form', 'what is this notice', 'translate document'],
    routingTarget: 'document_analyzer',
    requiredEntities: ['document_text'],
    weight: 9,
  },

  // Scheme Discovery
  {
    intent: 'scheme_discovery',
    keywords: ['scheme', 'yojana', 'benefit', 'subsidy', 'government scheme', 'pm scheme', 'welfare scheme', 'social security', 'pension scheme', 'scholarship', 'free', 'government benefit'],
    routingTarget: 'service_directory',
    requiredEntities: ['category'],
    weight: 7,
  },

  // Eligibility Check
  {
    intent: 'eligibility_check',
    keywords: ['am i eligible', 'who can apply', 'eligibility', 'qualify', 'entitled to', 'can i get', 'do i qualify', 'requirements to apply', 'who is eligible'],
    routingTarget: 'chat_assistant',
    requiredEntities: ['service_type'],
    weight: 8,
  },

  // Document Lookup
  {
    intent: 'document_lookup',
    keywords: ['documents needed', 'what documents', 'documents required', 'papers needed', 'what to bring', 'documents to submit', 'required documents', 'mandatory documents', 'proof required'],
    routingTarget: 'before_you_go',
    requiredEntities: ['service_type'],
    weight: 8,
  },

  // Application Procedure
  {
    intent: 'application_procedure',
    keywords: ['how to apply', 'apply for', 'application process', 'steps to get', 'procedure', 'process', 'how do i get', 'apply online', 'offline application', 'step by step'],
    routingTarget: 'before_you_go',
    requiredEntities: ['service_type'],
    weight: 7,
  },

  // Application Status
  {
    intent: 'application_status',
    keywords: ['track application', 'application status', 'check status', 'where is my application', 'reference number', 'arn', 'application number', 'track my', 'status of'],
    routingTarget: 'application_tracker',
    requiredEntities: ['reference_number'],
    weight: 8,
  },

  // Service Comparison
  {
    intent: 'service_comparison',
    keywords: ['compare', 'difference between', 'vs', 'versus', 'which is better', 'similar services', 'alternatives', 'which should i choose', 'what is the difference'],
    routingTarget: 'service_directory',
    requiredEntities: ['service_type'],
    weight: 7,
  },

  // Complaint Guidance
  {
    intent: 'complaint_guidance',
    keywords: ['file complaint', 'lodge complaint', 'register complaint', 'grievance', 'cpgrams', 'rti', 'right to information', 'escalate', 'complain about', 'raise issue', 'not satisfied'],
    routingTarget: 'complaint_drafter',
    requiredEntities: ['department'],
    weight: 7,
  },

  // Location Service Discovery
  {
    intent: 'location_service_discovery',
    keywords: ['near me', 'nearest', 'in my city', 'in my district', 'nearby office', 'rto near', 'hospital near', 'bank near', 'where is the', 'office location', 'address of'],
    routingTarget: 'service_directory',
    requiredEntities: ['location', 'service_type'],
    weight: 7,
  },

  // Translation
  {
    intent: 'translation',
    keywords: ['translate', 'in hindi', 'in tamil', 'in telugu', 'in kannada', 'in malayalam', 'in bengali', 'in marathi', 'explain in', 'say in'],
    routingTarget: 'translator',
    requiredEntities: ['target_language'],
    weight: 6,
  },

  // Follow-up
  {
    intent: 'followup_question',
    keywords: ['what about', 'and then', 'what next', 'after that', 'then what', 'clarify', 'more details', 'elaborate', 'you mentioned', 'can you explain more'],
    routingTarget: 'chat_assistant',
    requiredEntities: [],
    weight: 5,
  },

  // Action Planning
  {
    intent: 'action_planning',
    keywords: ['help me prepare', 'make a plan', 'plan for', 'before i go', 'prepare for visit', 'checklist', 'what should i do', 'guide me', 'prepare checklist', 'prepare application'],
    routingTarget: 'action_planner',
    requiredEntities: ['service_type'],
    weight: 8,
  },

  // General civic info (lowest weight — fallback for civic topics)
  {
    intent: 'general_civic_info',
    keywords: ['government', 'ministry', 'department', 'rule', 'law', 'regulation', 'policy', 'act', 'right', 'citizen', 'civic', 'public service', 'municipal'],
    routingTarget: 'chat_assistant',
    requiredEntities: [],
    weight: 3,
  },
]

// ─── Entity Detection ────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
  'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
  'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
  'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
  'delhi', 'jammu and kashmir', 'ladakh', 'chandigarh', 'puducherry',
]

const SERVICE_KEYWORDS: Record<string, string> = {
  'passport': 'passport',
  'aadhaar': 'aadhaar',
  'aadhar': 'aadhaar',
  'pan card': 'pan_card',
  'pan': 'pan_card',
  'driving licence': 'driving_licence',
  'dl': 'driving_licence',
  'ration card': 'ration_card',
  'voter id': 'voter_id',
  'birth certificate': 'birth_certificate',
  'income certificate': 'income_certificate',
  'caste certificate': 'caste_certificate',
  'community certificate': 'community_certificate',
  'rc transfer': 'vehicle_rc',
  'vehicle registration': 'vehicle_rc',
  'ayushman': 'ayushman_bharat',
  'pm-jay': 'ayushman_bharat',
  'rti': 'rti',
  'encumbrance': 'encumbrance_certificate',
}

const LANGUAGE_KEYWORDS: Record<string, string> = {
  'hindi': 'hi', 'tamil': 'ta', 'telugu': 'te', 'kannada': 'kn',
  'malayalam': 'ml', 'bengali': 'bn', 'marathi': 'mr', 'gujarati': 'gu',
  'punjabi': 'pa', 'odia': 'or', 'english': 'en',
}

function detectEntities(text: string): Record<string, string> {
  const lower = text.toLowerCase()
  const entities: Record<string, string> = {}

  // Detect state
  for (const state of INDIAN_STATES) {
    if (lower.includes(state)) {
      entities.state = state
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      break
    }
  }

  // Detect service type
  for (const [kw, service] of Object.entries(SERVICE_KEYWORDS)) {
    if (lower.includes(kw)) {
      entities.service_type = service
      break
    }
  }

  // Detect target language
  for (const [kw, code] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (lower.includes(kw)) {
      entities.target_language = code
      break
    }
  }

  // Detect reference/application number patterns
  const refMatch = lower.match(/\b([a-z0-9]{6,20})\b/)
  if (lower.includes('reference') || lower.includes('arn') || lower.includes('application number')) {
    if (refMatch) entities.reference_number = refMatch[1]
  }

  return entities
}

// ─── Unsupported patterns ────────────────────────────────────────────────────

const UNSUPPORTED_PATTERNS = [
  /\b(stock|crypto|bitcoin|nft|trading|forex|invest)\b/i,
  /\b(porn|adult|explicit|nude)\b/i,
  /\b(hack|exploit|bypass|jailbreak)\b/i,
  /\b(love|relationship|dating|marriage advice)\b/i,
  /\b(entertainment|movie|game|sports score)\b/i,
]

// ─── Main Classifier ──────────────────────────────────────────────────────────

/**
 * Classifies a civic query into a structured intent.
 *
 * @param query - Raw user text
 * @param isFollowUp - Whether this is a follow-up in an ongoing conversation
 * @returns Structured ClassifiedIntent
 */
export function classifyIntent(
  query: string,
  isFollowUp: boolean = false,
): ClassifiedIntent {
  const lower = query.toLowerCase().trim()

  // 1. Check for unsupported content
  for (const pattern of UNSUPPORTED_PATTERNS) {
    if (pattern.test(query)) {
      return buildResult('unsupported', 0.9, 'unsupported_handler', [], {}, query)
    }
  }

  // 2. Mark follow-up questions
  if (isFollowUp && lower.split(' ').length < 6) {
    return buildResult('followup_question', 0.75, 'chat_assistant', [], {}, query, { isFollowUp: true })
  }

  // 3. Score each intent signal
  const scores: Array<{ signal: IntentSignal; score: number }> = []

  for (const signal of INTENT_SIGNALS) {
    let score = 0

    for (const kw of signal.keywords) {
      if (lower.includes(kw)) {
        score += signal.weight
      }
    }

    if (signal.negativeKeywords) {
      for (const neg of signal.negativeKeywords) {
        if (lower.includes(neg)) {
          score -= signal.weight * 0.5
        }
      }
    }

    if (score > 0) {
      scores.push({ signal, score })
    }
  }

  // 4. Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  // 5. No match → general civic info or unsupported
  if (scores.length === 0) {
    // Short ambiguous queries
    if (lower.split(' ').length < 3) {
      return buildResult('followup_question', 0.5, 'chat_assistant', [], {}, query, { isFollowUp })
    }
    return buildResult('general_civic_info', 0.4, 'chat_assistant', [], {}, query)
  }

  const best = scores[0]
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const confidence = Math.min(0.98, best.score / Math.max(totalScore, best.score) + 0.1)

  const entities = detectEntities(query)

  // 6. Determine missing info
  const missingInfo = best.signal.requiredEntities.filter((e) => !entities[e])

  return buildResult(
    best.signal.intent,
    confidence,
    best.signal.routingTarget,
    best.signal.requiredEntities,
    entities,
    query,
    { isFollowUp },
  )
}

function buildResult(
  intent: CivicIntent,
  confidence: number,
  routingTarget: RoutingTarget,
  requiredEntities: string[],
  detectedEntities: Record<string, string>,
  query: string,
  flagOverrides: Partial<ClassifiedIntent['flags']> = {},
): ClassifiedIntent {
  const lower = query.toLowerCase()
  const missingInfo = requiredEntities.filter((e) => !detectedEntities[e])

  return {
    intent,
    confidence: Math.round(confidence * 100) / 100,
    routingTarget,
    requiredEntities,
    missingInfo,
    detectedEntities,
    flags: {
      isEmergency: intent === 'emergency_civic',
      needsLocation:
        intent === 'location_service_discovery' || missingInfo.includes('location'),
      isDocumentRelated:
        intent === 'document_analysis' ||
        intent === 'document_lookup' ||
        lower.includes('document') ||
        lower.includes('certificate'),
      isMultiService: intent === 'service_comparison',
      isFollowUp: intent === 'followup_question' || flagOverrides.isFollowUp || false,
      requiresConfirmation:
        intent === 'action_planning' ||
        intent === 'complaint_guidance',
      ...flagOverrides,
    },
  }
}

/**
 * Returns a human-readable description of a classified intent result.
 * Useful for debugging and logging (no PII included).
 */
export function describeIntent(result: ClassifiedIntent): string {
  return `intent=${result.intent} confidence=${result.confidence} route=${result.routingTarget} missing=${result.missingInfo.join(',') || 'none'}`
}
