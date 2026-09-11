export type SourceType = 'official' | 'secondary' | 'unknown'

export type DomainCategory = 
  | 'central_gov' 
  | 'state_gov' 
  | 'municipal' 
  | 'institutional' 
  | 'secondary' 
  | 'unknown'

export type FreshnessStatus = 'fresh' | 'recent' | 'stale' | 'unverified'

export interface SourceMetadata {
  title: string
  url: string
  domain: string
  sourceType: SourceType
  domainCategory: DomainCategory
  isSecure: boolean
  lastVerified: string | null
  freshness: FreshnessStatus
  verificationLabel: string
}

export const OFFICIAL_SOURCE_DISCLAIMER =
  'Requirements, fees, timings, and procedures may change. Always verify details with the official department before visiting.'

const CENTRAL_GOV_DOMAINS = [
  'parivahan.gov.in',
  'passportindia.gov.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'services.india.gov.in',
  'mha.gov.in',
  'mohfw.gov.in',
  'pmjay.gov.in',
  'india.gov.in',
  'digilocker.gov.in',
  'nvsp.in',
  'epfindia.gov.in',
]

const STATE_GOV_DOMAINS = [
  'tn.gov.in',
  'karnataka.gov.in',
  'kerala.gov.in',
  'maharashtra.gov.in',
  'delhi.gov.in',
  'telangana.gov.in',
  'ap.gov.in',
  'up.gov.in',
  'wb.gov.in',
  'rajasthan.gov.in',
  'mp.gov.in',
  'gujarat.gov.in',
  'odisha.gov.in',
  'bihar.gov.in',
  'haryana.gov.in',
  'punjab.gov.in',
]

const MUNICIPAL_DOMAINS = [
  'chennaicorporation.gov.in',
  'bbmp.gov.in',
  'mcgm.gov.in',
  'mcdonline.nic.in',
  'ghmc.gov.in',
  'kmcgov.in',
  'punecorporation.org',
]

const INSTITUTIONAL_DOMAINS = [
  'rbi.org.in',
  'sbi.co.in',
  'aiims.edu',
  'aiimsbhopal.edu.in',
  'aiimsnewdelhi.edu.in',
  'postalpension.gov.in',
  'indiapost.gov.in',
]

export function getDomainCategory(hostname: string): DomainCategory {
  const host = hostname.toLowerCase()

  if (MUNICIPAL_DOMAINS.some((dom) => host === dom || host.endsWith(`.${dom}`))) {
    return 'municipal'
  }
  if (STATE_GOV_DOMAINS.some((dom) => host === dom || host.endsWith(`.${dom}`))) {
    return 'state_gov'
  }
  if (CENTRAL_GOV_DOMAINS.some((dom) => host === dom || host.endsWith(`.${dom}`))) {
    return 'central_gov'
  }
  if (INSTITUTIONAL_DOMAINS.some((dom) => host === dom || host.endsWith(`.${dom}`))) {
    return 'institutional'
  }
  if (host.endsWith('.gov.in') || host.endsWith('.nic.in')) {
    return 'central_gov'
  }

  return 'secondary'
}

export function calculateFreshness(lastVerifiedStr: string | null): FreshnessStatus {
  if (!lastVerifiedStr) return 'unverified'
  try {
    const verifiedDate = new Date(lastVerifiedStr)
    const now = new Date()
    const diffDays = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return 'fresh' // future or today
    if (diffDays <= 30) return 'fresh'
    if (diffDays <= 90) return 'recent'
    return 'stale'
  } catch {
    return 'unverified'
  }
}

/**
 * Inspects, classifies and validates a URL into official or secondary civic reference with domain category and freshness metadata.
 */
export function classifySource(
  url: string, 
  title: string = 'Official Resource',
  lastVerifiedOverride?: string | null
): SourceMetadata {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const isSecure = parsed.protocol === 'https:'

    const isGov = hostname.endsWith('.gov.in') || 
                  hostname.endsWith('.nic.in') ||
                  CENTRAL_GOV_DOMAINS.some((dom) => hostname === dom || hostname.endsWith(`.${dom}`)) ||
                  STATE_GOV_DOMAINS.some((dom) => hostname === dom || hostname.endsWith(`.${dom}`)) ||
                  MUNICIPAL_DOMAINS.some((dom) => hostname === dom || hostname.endsWith(`.${dom}`))

    const isInstitutional = INSTITUTIONAL_DOMAINS.some((dom) => hostname === dom || hostname.endsWith(`.${dom}`))
    
    const sourceType: SourceType = (isGov || isInstitutional) ? 'official' : 'secondary'
    const domainCategory = getDomainCategory(hostname)
    const lastVerified = lastVerifiedOverride !== undefined ? lastVerifiedOverride : '2026-09-01'
    const freshness = calculateFreshness(lastVerified)

    let verificationLabel = 'Official Source'
    if (domainCategory === 'central_gov') verificationLabel = 'Central Government Portal'
    else if (domainCategory === 'state_gov') verificationLabel = 'State Government Portal'
    else if (domainCategory === 'municipal') verificationLabel = 'Municipal / Local Body'
    else if (domainCategory === 'institutional') verificationLabel = 'Official Institution'
    else if (sourceType === 'secondary') verificationLabel = 'Secondary Reference'

    return {
      title,
      url,
      domain: hostname,
      sourceType,
      domainCategory,
      isSecure,
      lastVerified,
      freshness,
      verificationLabel,
    }
  } catch {
    return {
      title,
      url,
      domain: 'external',
      sourceType: 'unknown',
      domainCategory: 'unknown',
      isSecure: false,
      lastVerified: null,
      freshness: 'unverified',
      verificationLabel: 'Unverified External Link',
    }
  }
}
