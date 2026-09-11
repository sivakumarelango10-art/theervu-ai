export interface CivicService {
  id: string
  name: string
  slug: string
  category: string
  description: string
  authority: string
  state: string
  officialUrl: string
  status: string
}

export const SEED_SERVICES: CivicService[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Driving Licence Renewal',
    slug: 'driving-licence-renewal',
    category: 'Transport & RTO',
    description:
      'Step-by-step guidance for renewing private or commercial driving licences, Form 1A medical requirements, and slot booking.',
    authority: 'Ministry of Road Transport and Highways (Parivahan Sewa)',
    state: 'All India',
    officialUrl: 'https://parivahan.gov.in/parivahan/',
    status: 'active',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Fresh Passport Application',
    slug: 'fresh-passport-application',
    category: 'Identity & Passports',
    description:
      'Standard and Tatkaal passport documentation requirements, appointment scheduling, Non-ECR proof, and PSK reporting protocols.',
    authority: 'Passport Seva Kendra, Ministry of External Affairs',
    state: 'All India',
    officialUrl: 'https://www.passportindia.gov.in/',
    status: 'active',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Aadhaar Address Update',
    slug: 'aadhaar-address-update',
    category: 'Identity & Passports',
    description:
      'Valid document checklist for online self-service portal or offline Aadhaar Seva Kendra address correction.',
    authority: 'Unique Identification Authority of India (UIDAI)',
    state: 'All India',
    officialUrl: 'https://myaadhaar.uidai.gov.in/',
    status: 'active',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Ration Card Family Addition',
    slug: 'ration-card-member-addition',
    category: 'Civil Supplies & Welfare',
    description:
      'Adding newborn child or spouse to the family ration card, birth certificate requirements, and Taluk Civil Supplies counter flow.',
    authority: 'Department of Food, Civil Supplies and Consumer Affairs',
    state: 'All India',
    officialUrl: 'https://nfsa.gov.in/',
    status: 'active',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Ayushman Bharat Health Card (PM-JAY)',
    slug: 'ayushman-bharat-health-card',
    category: 'Healthcare & Welfare',
    description:
      'Eligibility verification, e-KYC steps, and generation of the Ayushman Golden Card for cashless hospital treatments up to ₹5 Lakhs.',
    authority: 'National Health Authority (NHA)',
    state: 'All India',
    officialUrl: 'https://beneficiary.nha.gov.in/',
    status: 'active',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Birth Certificate Extract & Name Inclusion',
    slug: 'birth-certificate-issuance',
    category: 'Municipal & Civil Registration',
    description:
      'Procuring an official extract, name addition for children within 1 year, and municipal corporation counter procedures.',
    authority: 'Office of the Registrar General of India (CRS)',
    state: 'All India',
    officialUrl: 'https://crsorgi.gov.in/',
    status: 'active',
  },
]
