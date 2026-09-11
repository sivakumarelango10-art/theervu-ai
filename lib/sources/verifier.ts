export type SourceType = 'official' | 'secondary' | 'unknown'

export interface SourceMetadata {
  title: string
  url: string
  domain: string
  sourceType: SourceType
  lastVerified: string | null
}

export const OFFICIAL_SOURCE_DISCLAIMER =
  'Requirements, fees, timings, and procedures may change. Always verify details with the official department before visiting.'

const OFFICIAL_DOMAINS = [
  'gov.in',
  'nic.in',
  'parivahan.gov.in',
  'passportindia.gov.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'services.india.gov.in',
  'tn.gov.in',
  'karnataka.gov.in',
  'kerala.gov.in',
  'maharashtra.gov.in',
  'delhi.gov.in',
  'mha.gov.in',
  'mohfw.gov.in',
  'pmjay.gov.in',
]

/**
 * Inspects and classifies a URL into official or secondary civic reference.
 */
export function classifySource(url: string, title: string = 'Official Resource'): SourceMetadata {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    const isOfficial = OFFICIAL_DOMAINS.some(
      (dom) => hostname === dom || hostname.endsWith(`.${dom}`)
    )

    return {
      title,
      url,
      domain: hostname,
      sourceType: isOfficial ? 'official' : 'secondary',
      lastVerified: '2026-09-01',
    }
  } catch {
    return {
      title,
      url,
      domain: 'external',
      sourceType: 'unknown',
      lastVerified: null,
    }
  }
}
