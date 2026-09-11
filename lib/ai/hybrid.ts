import { SEED_SERVICES, type CivicService } from '@/lib/data/services'

/**
 * Hybrid Civic AI Retrieval Engine
 * 
 * Bridges deterministic verified civic catalogs with Gemini generative models
 * ensuring official rules, fees, and requirements are never fabricated.
 */

export interface HybridContextResult {
  matchedService: CivicService | null
  hybridSystemContext: string | null
  confidence: number
}

/**
 * Matches a user question or task description against the catalog of verified civic services.
 */
export function findMatchingCivicService(
  query: string,
  userState?: string
): { service: CivicService | null; confidence: number } {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return { service: null, confidence: 0 }

  // Keyword intent mapping aligned to SEED_SERVICES slugs
  const intentKeywords: Record<string, string[]> = {
    'driving-licence-renewal': ['driving licence', 'driver license', 'dl', 'learner licence', 'll', 'rto licence', 'drive test', 'dl renewal'],
    'vehicle-rc-transfer': ['rc transfer', 'vehicle ownership', 'registration certificate', 'rto rc', 'vahan'],
    'fresh-passport-application': ['passport', 'tatkaal', 'passport seva', 'apply passport', 'psk', 'post office passport'],
    'aadhaar-address-update': ['aadhaar', 'update address aadhaar', 'uidai', 'aadhar card', 'myaadhaar'],
    'pan-card-new-application': ['pan card', 'apply pan', 'utiitsl', 'nsdl pan', 'pan correction', 'income tax pan', 'form 49a'],
    'ration-card-member-addition': ['ration card', 'smart ration card', 'pds', 'food security card', 'civil supplies', 'member addition'],
    'ayushman-bharat-card': ['ayushman', 'pmjay', 'health card', '5 lakh health insurance', 'golden card', 'beneficiary portal'],
    'community-certificate': ['caste certificate', 'community certificate', 'sc certificate', 'st certificate', 'obc certificate'],
    'income-certificate': ['income certificate', 'revenue department', 'tahsildar', 'salary certificate'],
    'birth-certificate-issuance': ['birth certificate', 'crs', 'registrar general', 'delayed registration'],
    'encumbrance-certificate': ['encumbrance certificate', 'ec', 'property ec', 'sub registrar', 'reginet', 'patta'],
    'rti-online-application': ['rti', 'right to information', 'first appeal', 'pio', 'rti portal', 'file rti'],
  }

  let bestMatch: CivicService | null = null
  let maxScore = 0

  for (const service of SEED_SERVICES) {
    let score = 0
    const keywords = intentKeywords[service.slug] || []

    // 1. Direct slug match
    if (normalized.includes(service.slug)) {
      score += 10
    }

    // 2. Keyword match
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        score += 5
      }
    }

    // 3. Name match
    if (normalized.includes(service.name.toLowerCase())) {
      score += 8
    }

    // 4. Token overlap
    const nameTokens = service.name.toLowerCase().split(/\s+/)
    for (const token of nameTokens) {
      if (token.length > 3 && normalized.includes(token)) {
        score += 2
      }
    }

    // 5. State affinity
    if (userState && userState !== 'All India') {
      if (service.state.toLowerCase() === userState.toLowerCase()) {
        score += 3
      } else if (service.state !== 'All India' && service.state.toLowerCase() !== userState.toLowerCase()) {
        score -= 2
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestMatch = service
    }
  }

  // Threshold: score >= 4 is considered a confident match
  if (maxScore >= 4 && bestMatch) {
    return { service: bestMatch, confidence: Math.min(1.0, maxScore / 10) }
  }

  return { service: null, confidence: 0 }
}

/**
 * Formats a verified civic service record into structured instructions for Gemini
 */
export function buildVerifiedCivicContext(service: CivicService): string {
  const docsList = service.requiredDocuments
    .map(
      (d) =>
        `- ${d.name} (${d.mandatory ? 'MANDATORY' : 'OPTIONAL'}): ${d.description}${
          d.alternatives ? ` [Accepted alternatives: ${d.alternatives.join(', ')}]` : ''
        }`
    )
    .join('\n')

  const stepsList = service.applicationSteps
    .map((s) => `${s.stepNumber}. [${s.isOnline ? 'ONLINE' : 'IN-PERSON'}] ${s.title}: ${s.description}`)
    .join('\n')

  const feesList = service.fees
    .map((f) => `- ${f.name}: ${f.amount} (Payment mode: ${f.paymentMode})`)
    .join('\n')

  return `
--- VERIFIED OFFICIAL CIVIC KNOWLEDGE (GROUND TRUTH) ---
Service Name: ${service.name}
Department / Authority: ${service.department} (${service.authority})
Applicable Jurisdiction: ${service.state}
Office Type to Visit: ${service.officeType}
Appointment Required: ${service.appointmentRequired ? 'YES (Mandatory prior booking)' : 'NO (Walk-in or purely online)'}
Official Portal / URL: ${service.officialSourceUrl} (${service.sourceName})
Last Verified: ${service.lastVerifiedAt}
Expected Timeline: ${service.expectedTimeline}

ELIGIBILITY CRITERIA:
${service.eligibility.map((e) => `- ${e}`).join('\n')}

VERIFIED REQUIRED DOCUMENTS:
${docsList}

VERIFIED FEES & PAYMENT:
${feesList}

PROCEDURE STEPS:
${stepsList}

IMPORTANT NOTES & ADVISORIES:
${service.importantNotes.map((n) => `- ${n}`).join('\n')}

MANDATORY INSTRUCTIONS FOR AI GENERATION:
1. STRICT ZERO-FABRICATION RULE: The requirements, fees, documents, and steps above are VERIFIED OFFICIAL FACTS from ${service.sourceName}.
2. You MUST prioritize and cite these exact facts in your response.
3. Do NOT invent or speculate different fees, extra required documents, or office procedures.
4. If the user asks about a detail not present in this verified context, state explicitly: "Information not available in the current verified database. Please check the official portal at ${service.officialSourceUrl}."
5. Always provide the official portal link (${service.officialSourceUrl}) so the user can verify current timings and slots.
--- END VERIFIED OFFICIAL CIVIC KNOWLEDGE ---
`.trim()
}

/**
 * Augments incoming chat or preparation prompts with verified civic context if an intent match exists.
 */
export function getHybridRetrievalContext(
  query: string,
  userState?: string
): HybridContextResult {
  const { service, confidence } = findMatchingCivicService(query, userState)

  if (!service) {
    return {
      matchedService: null,
      hybridSystemContext: null,
      confidence: 0,
    }
  }

  return {
    matchedService: service,
    hybridSystemContext: buildVerifiedCivicContext(service),
    confidence,
  }
}
