/**
 * Structured Civic Services Knowledge Catalog
 * Normalized schema containing verified requirements, official sources, and procedure steps.
 */

export interface ServiceDocument {
  name: string
  description: string
  mandatory: boolean
  alternatives?: string[]
}

export interface ServiceStep {
  stepNumber: number
  title: string
  description: string
  isOnline: boolean
}

export interface ServiceFee {
  name: string
  amount: string
  paymentMode: string
}

export interface CivicService {
  id: string
  name: string
  slug: string
  category:
    | 'Transport & RTO'
    | 'Identity & Passports'
    | 'Civil Supplies & Welfare'
    | 'Healthcare & Welfare'
    | 'Revenue & Certificates'
    | 'Municipal & Property'
    | 'Pensions & Social Security'
    | 'Employment & Rights'
  description: string
  department: string
  authority: string
  state: string
  district?: string
  officeType: string
  officialUrl: string
  officialSourceUrl: string
  sourceName: string
  sourceType: 'central_gov' | 'state_gov' | 'municipal' | 'statutory'
  lastVerifiedAt: string
  verificationStatus: 'verified' | 'needs_confirmation' | 'location_dependent'
  eligibility: string[]
  requiredDocuments: ServiceDocument[]
  applicationSteps: ServiceStep[]
  appointmentRequired: boolean
  fees: ServiceFee[]
  expectedTimeline: string
  importantNotes: string[]
  locationDependency: 'none' | 'state' | 'district' | 'municipal'
  disclaimer: string
  status: 'active' | 'archived'
}

export const SEED_SERVICES: CivicService[] = [
  // 1. Transport & RTO
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Driving Licence Renewal',
    slug: 'driving-licence-renewal',
    category: 'Transport & RTO',
    description:
      'Renewal of expired non-transport or transport driving licences, Form 1A medical fitness certification, and biometric capture.',
    department: 'Regional Transport Office (RTO)',
    authority: 'Ministry of Road Transport and Highways (MoRTH)',
    state: 'All India',
    officeType: 'RTO / Automated Driving Test Track',
    officialUrl: 'https://parivahan.gov.in/parivahan/',
    officialSourceUrl: 'https://sarathi.parivahan.gov.in/',
    sourceName: 'Parivahan Sewa Official Portal',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: [
      'Holder of an expired or soon-to-expire driving licence (within 1 year before or after expiry).',
      'Age 40 and above requires Form 1A certified by a registered medical practitioner.',
    ],
    requiredDocuments: [
      {
        name: 'Original Physical Driving Licence',
        description: 'Original plastic smart card or laminate licence.',
        mandatory: true,
      },
      {
        name: 'Form 1A Medical Certificate',
        description: 'Signed by an MBBS medical practitioner (mandatory if applicant is over 40 years old).',
        mandatory: false,
        alternatives: ['Online e-Form 1A via Sarathi Doctor Portal'],
      },
      {
        name: 'Current Address Proof',
        description: 'Self-attested copy of Aadhaar, Passport, or Electricity bill if address has changed.',
        mandatory: false,
      },
      {
        name: 'Payment & Slot Booking Slip',
        description: 'Printed ARN acknowledgment receipt from Sarathi.',
        mandatory: true,
      },
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Submit Online Renewal on Sarathi',
        description: 'Fill DL number and date of birth, select renewal service, and upload Form 1A if over 40.',
        isOnline: true,
      },
      {
        stepNumber: 2,
        title: 'Pay Prescribed Renewal Fee',
        description: 'Pay renewal fee online via Bharatkosh or State treasury payment gateway.',
        isOnline: true,
      },
      {
        stepNumber: 3,
        title: 'Visit RTO for Biometrics',
        description: 'Report to local RTO with original licence and application receipt for signature & photo capture.',
        isOnline: false,
      },
    ],
    appointmentRequired: true,
    fees: [
      { name: 'Standard Renewal (within grace period)', amount: '₹200', paymentMode: 'Online via Sarathi' },
      { name: 'Late Fee (per year after grace period)', amount: '₹1,000 / year', paymentMode: 'Online via Sarathi' },
    ],
    expectedTimeline: '15 to 30 working days after biometric visit',
    importantNotes: [
      'Driving with a licence expired beyond 1 year requires a re-test on the test track.',
      'Always carry 2 passport photos in case of offline registry signature backup.',
    ],
    locationDependency: 'state',
    disclaimer: 'RTO token booking procedures and late fee waivers vary slightly across state transport departments.',
    status: 'active',
  },

  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Vehicle Ownership Transfer (RC Transfer)',
    slug: 'vehicle-rc-transfer',
    category: 'Transport & RTO',
    description:
      'Transferring vehicle registration certificate from seller to buyer following purchase, inheritance, or auction.',
    department: 'Motor Vehicles Department',
    authority: 'Ministry of Road Transport and Highways (MoRTH)',
    state: 'All India',
    officeType: 'Regional Transport Office (RTO)',
    officialUrl: 'https://parivahan.gov.in/parivahan/',
    officialSourceUrl: 'https://vahan.parivahan.gov.in/vahanservice/',
    sourceName: 'Vahan Citizen Services',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: [
      'Valid buyer and seller agreement.',
      'No active hypothecation on vehicle (or NOC obtained from financing bank).',
    ],
    requiredDocuments: [
      { name: 'Form 29 & Form 30', description: 'Notice of transfer and application for transfer signed by buyer and seller.', mandatory: true },
      { name: 'Original Registration Certificate (RC Book)', description: 'Physical Smart Card RC book.', mandatory: true },
      { name: 'Valid Insurance Certificate', description: 'Motor insurance policy with minimum 1 month validity.', mandatory: true },
      { name: 'Pollution Under Control (PUC) Certificate', description: 'Valid emission test certificate.', mandatory: true },
      { name: 'Buyer Address Proof', description: 'Aadhaar, Voter ID, or Utility bill in the jurisdiction of the RTO.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Initiate Transfer on Vahan Portal', description: 'Enter vehicle registration number, verify Aadhaar OTP for buyer/seller.', isOnline: true },
      { stepNumber: 2, title: 'Pay Transfer Tax & Fees', description: 'Pay state transfer fee online.', isOnline: true },
      { stepNumber: 3, title: 'Submit Hard Copies to RTO', description: 'Submit physical dossier with original RC card at RTO receiving counter.', isOnline: false },
    ],
    appointmentRequired: false,
    fees: [
      { name: 'Two-Wheeler Transfer Fee', amount: '₹150 + Smart Card fee ₹200', paymentMode: 'Online via Vahan' },
      { name: 'Four-Wheeler Transfer Fee', amount: '₹300 + Smart Card fee ₹200', paymentMode: 'Online via Vahan' },
    ],
    expectedTimeline: '20 to 45 working days',
    importantNotes: [
      'If transferring to a different RTO jurisdiction within the same state, verify whether local clearance is needed.',
      'Inter-state transfer requires a Form 28 No Objection Certificate (NOC) from the origin RTO.',
    ],
    locationDependency: 'state',
    disclaimer: 'Transfer fees and road-tax parity rules differ when shifting ownership across state borders.',
    status: 'active',
  },

  // 2. Identity & Passports
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Fresh Passport Application',
    slug: 'fresh-passport-application',
    category: 'Identity & Passports',
    description:
      'Standard and Tatkaal application process for Indian citizens seeking a first-time international passport.',
    department: 'Consular, Passport and Visa (CPV) Division',
    authority: 'Ministry of External Affairs (MEA)',
    state: 'All India',
    officeType: 'Passport Seva Kendra (PSK) / Post Office PSK (POPSK)',
    officialUrl: 'https://www.passportindia.gov.in/',
    officialSourceUrl: 'https://www.passportindia.gov.in/AppOnlineProject/online/procFormNew',
    sourceName: 'Passport Seva Online Portal',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: [
      'Citizen of India by birth, registration, or naturalization.',
      'No pending criminal summons or travel restraint orders.',
    ],
    requiredDocuments: [
      { name: 'Proof of Date of Birth', description: 'Birth Certificate issued by Municipal Authority or School Leaving Certificate.', mandatory: true },
      { name: 'Proof of Present Address', description: 'Aadhaar Card, Bank Passbook (Scheduled Bank), or Electricity Bill.', mandatory: true },
      { name: 'Non-ECR Proof (if applicable)', description: 'Matriculation (10th standard) certificate or higher educational degree.', mandatory: false },
      { name: 'Appointment Receipt (ARN)', description: 'Printed appointment confirmation with barcode.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Register on Passport Seva Portal', description: 'Create account, fill online Form 1, select booklet type (36 or 60 pages).', isOnline: true },
      { stepNumber: 2, title: 'Pay Fee & Schedule PSK Slot', description: 'Pay ₹1,500 online and book biometric interview slot.', isOnline: true },
      { stepNumber: 3, title: 'Visit PSK for Counter Verification', description: 'Report 15 mins before slot. Pass through Token, Counter A (biometrics), Counter B (verification), Counter C (granting).', isOnline: false },
      { stepNumber: 4, title: 'Police Verification', description: 'Local police officer visits residence or calls to station for identity confirmation.', isOnline: false },
    ],
    appointmentRequired: true,
    fees: [
      { name: 'Standard Fresh Passport (36 pages, 10 yrs)', amount: '₹1,500', paymentMode: 'Online Net Banking / SBI' },
      { name: 'Tatkaal Fresh Passport (36 pages)', amount: '₹3,500 (₹1,500 online + ₹2,000 at PSK)', paymentMode: 'Partial online, remainder at PSK' },
    ],
    expectedTimeline: '10 to 20 working days for Normal; 3 to 5 days for Tatkaal',
    importantNotes: [
      'Ensure names on Aadhaar, Birth Certificate, and 10th marksheet match character-for-character.',
      'Minor applicants require both parents to be present or legal consent Annexure D.',
    ],
    locationDependency: 'none',
    disclaimer: 'Police verification duration depends on local commissionerate protocols.',
    status: 'active',
  },

  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Aadhaar Address & Demographic Update',
    slug: 'aadhaar-address-update',
    category: 'Identity & Passports',
    description:
      'Online and offline procedures for correcting residential address, marital status, or spelling mistakes on Aadhaar cards.',
    department: 'Unique Identification Authority of India',
    authority: 'UIDAI, Ministry of Electronics & IT',
    state: 'All India',
    officeType: 'Aadhaar Seva Kendra (ASK) / Bank Branch / Post Office',
    officialUrl: 'https://uidai.gov.in/',
    officialSourceUrl: 'https://myaadhaar.uidai.gov.in/',
    sourceName: 'myAadhaar Self Service Update Portal',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Aadhaar holder with an active mobile number linked for OTP (for online mode).'],
    requiredDocuments: [
      { name: 'Proof of Address (PoA)', description: 'Passport, Bank statement with photo, Voter ID, Ration Card, Electricity bill (within 3 months).', mandatory: true },
      { name: 'Existing Aadhaar Number', description: '12-digit UID number.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Login to myAadhaar with OTP', description: 'Enter Aadhaar and authenticate using OTP sent to registered mobile.', isOnline: true },
      { stepNumber: 2, title: 'Upload Proof of Address', description: 'Enter updated address details in English and regional script; upload scanned document.', isOnline: true },
      { stepNumber: 3, title: 'Pay Service Charge', description: 'Pay ₹50 online fee.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Demographic Update Fee', amount: '₹50', paymentMode: 'Online via myAadhaar portal' }],
    expectedTimeline: '3 to 15 working days',
    importantNotes: [
      'Biometric updates (fingerprints, iris, facial photo) cannot be completed online; mandatory visit to ASK is required.',
      'Children must update biometrics at age 5 and age 15 (Mandatory Biometric Update - free of charge).',
    ],
    locationDependency: 'none',
    disclaimer: 'Document verification is audited against UIDAI standard list of valid PoA documents.',
    status: 'active',
  },

  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'New PAN Card (Form 49A)',
    slug: 'pan-card-new-application',
    category: 'Identity & Passports',
    description:
      'Application for allotment of a Permanent Account Number for Indian citizens, tax filing, and bank KYC.',
    department: 'Income Tax Department',
    authority: 'Central Board of Direct Taxes (CBDT)',
    state: 'All India',
    officeType: 'NSDL (Protean) / UTIITSL Facilitation Center',
    officialUrl: 'https://incometax.gov.in/',
    officialSourceUrl: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    sourceName: 'Protean e-Gov Technologies (NSDL)',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Indian resident individual requiring financial identification.'],
    requiredDocuments: [
      { name: 'Identity Proof', description: 'Aadhaar Card, Voter ID, Passport, or Driving Licence.', mandatory: true },
      { name: 'Address Proof', description: 'Aadhaar Card, Utility bill, or Bank passbook.', mandatory: true },
      { name: 'Date of Birth Proof', description: 'Birth certificate, 10th certificate, or Aadhaar.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Fill Form 49A Online', description: 'Choose e-KYC mode (paperless using Aadhaar OTP) or physical document submission.', isOnline: true },
      { stepNumber: 2, title: 'Pay Allotment Fee', description: 'Pay ₹107 for physical card or ₹72 for e-PAN only.', isOnline: true },
      { stepNumber: 3, title: 'Download e-PAN', description: 'e-PAN is generated and emailed within 48 hours; physical card dispatched via India Post.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Physical PAN Card dispatch', amount: '₹107', paymentMode: 'Online via Debit/UPI/Net Banking' }],
    expectedTimeline: '2 working days for e-PAN; 10 to 15 days for physical card delivery',
    importantNotes: ['Aadhaar must be linked to PAN within the statutory timeframe to avoid inoperative status.'],
    locationDependency: 'none',
    disclaimer: 'Instant e-PAN is also available free of charge on the Income Tax e-filing portal for Aadhaar holders.',
    status: 'active',
  },

  // 3. Civil Supplies & Welfare
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Ration Card Family Member Addition',
    slug: 'ration-card-member-addition',
    category: 'Civil Supplies & Welfare',
    description:
      'Adding newborn children or a newly married spouse to an existing family smart ration card.',
    department: 'Civil Supplies and Consumer Protection Department',
    authority: 'Ministry of Consumer Affairs, Food and Public Distribution',
    state: 'Tamil Nadu',
    officeType: 'Taluk Supply Office (TSO) / e-Sevai Center',
    officialUrl: 'https://www.tnpds.gov.in/',
    officialSourceUrl: 'https://www.tnpds.gov.in/pages/register/ration-card-addition.xhtml',
    sourceName: 'TNPDS Public Portal',
    sourceType: 'state_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Head of family holding an active NFSA or State smart ration card.'],
    requiredDocuments: [
      { name: 'Original Smart Ration Card', description: 'Existing family ration card number.', mandatory: true },
      { name: 'Birth Certificate (for newborn)', description: 'Official municipal birth certificate mentioning parents names.', mandatory: false },
      { name: 'Marriage Certificate & Surrender Certificate (for spouse)', description: 'Name deletion certificate from spouse parents ration card.', mandatory: false },
      { name: 'Aadhaar of New Member', description: 'Mandatory Aadhaar photocopy for members aged 5 and above.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Submit Request on TNPDS or e-District', description: 'Upload birth certificate or deletion slip and enter Aadhaar.', isOnline: true },
      { stepNumber: 2, title: 'Field Verification by Revenue Inspector', description: 'Civil Supplies staff or RI confirms residential living status.', isOnline: false },
      { stepNumber: 3, title: 'Card Endorsement at Fair Price Shop', description: 'Updated entitlement printed on card or updated in PoS machine.', isOnline: false },
    ],
    appointmentRequired: false,
    fees: [{ name: 'e-Sevai Portal Service Fee', amount: '₹60', paymentMode: 'Counter cash at e-Sevai' }],
    expectedTimeline: '15 to 30 working days',
    importantNotes: ['Ensure spouse name is first removed from maternal ration card before applying for addition.'],
    locationDependency: 'state',
    disclaimer: 'Ration card categories (PHH, NPHH, AAY) determine rice/sugar quota allocations.',
    status: 'active',
  },

  // 4. Healthcare & Welfare
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Ayushman Bharat PM-JAY Golden Card',
    slug: 'ayushman-bharat-card',
    category: 'Healthcare & Welfare',
    description:
      'Cashless secondary and tertiary healthcare coverage up to ₹5 Lakhs per family per year at empaneled hospitals.',
    department: 'National Health Authority',
    authority: 'Ministry of Health and Family Welfare (MoHFW)',
    state: 'All India',
    officeType: 'Empaneled Public/Private Hospital / Common Service Center (CSC)',
    officialUrl: 'https://pmjay.gov.in/',
    officialSourceUrl: 'https://beneficiary.nha.gov.in/',
    sourceName: 'Beneficiary NHA Portal',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: [
      'Families identified under SECC 2011 rural and urban occupational deprivation criteria.',
      'All senior citizens aged 70+ (expanded under PM-JAY Senior Scheme regardless of income).',
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Biometric or mobile OTP authenticated Aadhaar.', mandatory: true },
      { name: 'Ration Card', description: 'Valid State food security ration card.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Check Name on Beneficiary Portal', description: 'Search mobile number, ration card, or Aadhaar on beneficiary.nha.gov.in.', isOnline: true },
      { stepNumber: 2, title: 'Complete e-KYC', description: 'Perform facial or biometric Aadhaar e-KYC.', isOnline: true },
      { stepNumber: 3, title: 'Instant Card Download', description: 'Download laminated digital Ayushman PVC card.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Government Card Issuance', amount: 'Free of Cost (₹0)', paymentMode: 'No charge' }],
    expectedTimeline: 'Instant online generation; 24 hours for review cases',
    importantNotes: ['Carry your card or Aadhaar directly to any empaneled hospital Ayushman Mitra desk.'],
    locationDependency: 'none',
    disclaimer: 'Treatment packages and pre-authorization protocols are governed by NHA clinical guidelines.',
    status: 'active',
  },

  // 5. Revenue & Certificates
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Community & Caste Certificate',
    slug: 'community-certificate',
    category: 'Revenue & Certificates',
    description:
      'Government document certifying that an individual belongs to a specific Scheduled Caste (SC), Scheduled Tribe (ST), OBC, or MBC category for reservation benefits.',
    department: 'Revenue Administration & Disaster Management',
    authority: 'State Revenue Department',
    state: 'Tamil Nadu',
    officeType: 'Taluk Office / e-Sevai Center / Revenue Inspector Counter',
    officialUrl: 'https://edistricts.tn.gov.in/',
    officialSourceUrl: 'https://tnesevai.tn.gov.in/',
    sourceName: 'TN e-Sevai Service Portal',
    sourceType: 'state_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Citizen belonging to recognized community within state gazette notification.'],
    requiredDocuments: [
      { name: 'Applicant Photo', description: 'Recent passport-size color photograph.', mandatory: true },
      { name: 'Address Proof', description: 'Aadhaar, Ration card, or Voter ID.', mandatory: true },
      { name: 'Father/Mother Community Certificate', description: 'Certificate of parent or sibling showing community.', mandatory: true },
      { name: 'School Transfer Certificate (TC)', description: 'TC mentioning community of applicant or parent.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Submit Online at e-Sevai', description: 'Fill application and upload self-attested documents.', isOnline: true },
      { stepNumber: 2, title: 'Village Administrative Officer (VAO) Inquiry', description: 'VAO inspects village registers and forwards to Revenue Inspector.', isOnline: false },
      { stepNumber: 3, title: 'Tahsildar Digital Signature', description: 'Tahsildar approves digitally signed certificate available for download.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Statutory Application Processing', amount: '₹60', paymentMode: 'e-Sevai Counter / Online' }],
    expectedTimeline: '15 to 30 working days',
    importantNotes: ['Never submit forged school records; community certificates undergo permanent archival verification.'],
    locationDependency: 'state',
    disclaimer: 'OBC non-creamy layer certificates must be renewed annually with updated income figures.',
    status: 'active',
  },

  {
    id: '00000000-0000-0000-0000-000000000009',
    name: 'Income Certificate',
    slug: 'income-certificate',
    category: 'Revenue & Certificates',
    description:
      'Revenue document stating the annual family income of a household from all declared sources for scholarships and fee concessions.',
    department: 'Revenue Department',
    authority: 'State Revenue & Disaster Management Department',
    state: 'All India',
    officeType: 'Taluk Office / Tehsildar Office / e-District Center',
    officialUrl: 'https://services.india.gov.in/',
    officialSourceUrl: 'https://edistricts.tn.gov.in/',
    sourceName: 'e-District National Portal',
    sourceType: 'state_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Permanent resident of the taluk/district.'],
    requiredDocuments: [
      { name: 'Salary Certificate or Form 16', description: 'Salary slip from employer or auditor affidavit for self-employed.', mandatory: true },
      { name: 'Income Tax Return (ITR)', description: 'Latest ITR-V acknowledgment if taxable.', mandatory: false },
      { name: 'Ration Card / Family Card', description: 'Proof of family composition.', mandatory: true },
      { name: 'Aadhaar Card', description: 'Applicant identity proof.', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Apply on State e-District Portal', description: 'Submit income declaration and upload proof of earnings.', isOnline: true },
      { stepNumber: 2, title: 'VAO / Revenue Inspector Verification', description: 'Revenue staff inspects agricultural land records, employer slips, and local house status.', isOnline: false },
      { stepNumber: 3, title: 'Download Digitally Signed Certificate', description: 'Tahsildar issues certificate valid for 1 financial year.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Processing Fee', amount: '₹60', paymentMode: 'Online Net Banking / CSC' }],
    expectedTimeline: '10 to 15 working days',
    importantNotes: ['Income certificates are valid for 1 financial year (April 1 to March 31).'],
    locationDependency: 'state',
    disclaimer: 'Agricultural income computation follows state land revenue guidelines.',
    status: 'active',
  },

  // 6. Municipal & Property
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Birth Certificate Extract & Name Inclusion',
    slug: 'birth-certificate-issuance',
    category: 'Municipal & Property',
    description:
      'Registration of birth within 21 days, issuance of formal birth extract, and inclusion of child name before schooling.',
    department: 'Civil Registration System',
    authority: 'Office of the Registrar General of India (CRS)',
    state: 'All India',
    officeType: 'Municipal Corporation / Town Panchayat / Village Panchayat',
    officialUrl: 'https://crsorgi.gov.in/',
    officialSourceUrl: 'https://crsorgi.gov.in/web/index.php/auth/login',
    sourceName: 'Civil Registration System (ORGI)',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Birth occurred within institutional hospital or residential jurisdiction.'],
    requiredDocuments: [
      { name: 'Hospital Discharge Summary / Form 2', description: 'Hospital notification form signed by obstetrician/superintendent.', mandatory: true },
      { name: 'Parents Aadhaar Cards', description: 'Self-attested photocopies of mother and father UID cards.', mandatory: true },
      { name: 'Parents Marriage Certificate', description: 'Proof of marriage for family registry alignment.', mandatory: false },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Hospital Logs Event on CRS', description: 'Hospital registers institutional delivery within 21 days free of charge.', isOnline: true },
      { stepNumber: 2, title: 'Name Inclusion Request', description: 'Parents submit name addition application before child reaches 1 year of age.', isOnline: true },
      { stepNumber: 3, title: 'Download Watermarked Certificate', description: 'Print digitally signed birth extract with QR code validation.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [
      { name: 'Registration within 21 days', amount: 'Free (₹0)', paymentMode: 'No charge' },
      { name: 'Delayed registration (22 to 30 days)', amount: '₹2', paymentMode: 'Counter cash' },
      { name: 'Delayed registration beyond 1 year', amount: 'Sub-Divisional Magistrate (SDM) order + ₹10', paymentMode: 'Challan' },
    ],
    expectedTimeline: '7 to 14 working days',
    importantNotes: ['Register birth within 21 days to avoid requiring Magistrate orders.'],
    locationDependency: 'municipal',
    disclaimer: 'Delayed registration rules strictly require Revenue Divisional Officer (RDO) or SDM approval.',
    status: 'active',
  },

  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'Property Encumbrance Certificate (EC)',
    slug: 'encumbrance-certificate',
    category: 'Municipal & Property',
    description:
      'Verification of registered transactions, legal mortgages, sales, and title charges against an immovable property over a specific time period.',
    department: 'Registration Department',
    authority: 'Inspector General of Registration',
    state: 'All India',
    officeType: 'Sub-Registrar Office (SRO)',
    officialUrl: 'https://services.india.gov.in/',
    officialSourceUrl: 'https://tnreginet.gov.in/',
    sourceName: 'Registration Department Portal',
    sourceType: 'state_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Any citizen or prospective buyer conducting title due diligence.'],
    requiredDocuments: [
      { name: 'Property Survey Number / Flat Number', description: 'Revenue survey number, sub-division, and village.', mandatory: true },
      { name: 'Previous Deed Document Number', description: 'Title deed registered volume/year if known.', mandatory: false },
      { name: 'Search Period Dates', description: 'Start year and end year for encumbrance check (typically 15 to 30 years).', mandatory: true },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Search Property on State Portal', description: 'Enter district, SRO, village name, and survey number.', isOnline: true },
      { stepNumber: 2, title: 'Pay Search Fee Online', description: 'Pay ₹1 per year of search fee.', isOnline: true },
      { stepNumber: 3, title: 'Download Certified EC', description: 'Download digitally signed Form 15 (with encumbrance) or Form 16 (Nil encumbrance).', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Search fee + Application fee', amount: '₹100 to ₹250', paymentMode: 'Online Payment Gateway' }],
    expectedTimeline: 'Instant view; 3 working days for signed copy',
    importantNotes: ['Verify survey number boundary descriptions with Patta / Chitta revenue records.'],
    locationDependency: 'state',
    disclaimer: 'Unregistered agreements or pending court stays may not appear on an official EC.',
    status: 'active',
  },

  // 7. Employment & Rights
  {
    id: '00000000-0000-0000-0000-000000000012',
    name: 'Right to Information (RTI) Application',
    slug: 'rti-online-application',
    category: 'Employment & Rights',
    description:
      'Statutory process for citizens to request information, inspect public works, and access government records from Central and State public authorities.',
    department: 'Department of Personnel and Training',
    authority: 'Central Information Commission (CIC)',
    state: 'All India',
    officeType: 'Public Information Officer (PIO) / First Appellate Authority',
    officialUrl: 'https://rtionline.gov.in/',
    officialSourceUrl: 'https://rtionline.gov.in/guidelines.php',
    sourceName: 'RTI Online Central Portal',
    sourceType: 'central_gov',
    lastVerifiedAt: '2026-09-01',
    verificationStatus: 'verified',
    eligibility: ['Any citizen of India.'],
    requiredDocuments: [
      { name: 'Specific Query Text', description: 'Numbered, precise questions seeking factual records (under 3,000 characters).', mandatory: true },
      { name: 'BPL Certificate (if claiming fee exemption)', description: 'Proof of Below Poverty Line status.', mandatory: false },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Select Public Authority', description: 'Choose Ministry/Department on rtionline.gov.in.', isOnline: true },
      { stepNumber: 2, title: 'Enter Specific Questions', description: 'Frame questions asking for existing files, records, or orders rather than hypothetical answers.', isOnline: true },
      { stepNumber: 3, title: 'Pay Statutory ₹10 Fee', description: 'Pay ₹10 via UPI/Card/Internet Banking.', isOnline: true },
    ],
    appointmentRequired: false,
    fees: [{ name: 'Application Fee', amount: '₹10 (Free for BPL)', paymentMode: 'Online via RTI portal' }],
    expectedTimeline: '30 calendar days (48 hours if life and liberty is involved)',
    importantNotes: [
      'If no response is received within 30 days, file First Appeal within 30 days free of charge.',
      'Information exempted under Section 8(1) (national security, cabinet papers, trade secrets) will be denied.',
    ],
    locationDependency: 'none',
    disclaimer: 'State governments operate state-specific RTI portals for state department queries.',
    status: 'active',
  },
]

export function getServiceBySlug(slug: string): CivicService | undefined {
  return SEED_SERVICES.find((s) => s.slug === slug)
}

export function searchServices(
  query: string,
  category?: string,
  state?: string,
  district?: string
): CivicService[] {
  let results = [...SEED_SERVICES]

  if (category && category !== 'All') {
    results = results.filter((s) => s.category.toLowerCase() === category.toLowerCase())
  }

  if (state && state !== 'All India') {
    results = results.filter((s) => s.state === 'All India' || s.state.toLowerCase() === state.toLowerCase())
  }

  if (district) {
    results = results.filter((s) => !s.district || s.district.toLowerCase() === district.toLowerCase())
  }

  if (query && query.trim().length > 0) {
    const q = query.trim().toLowerCase()
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.authority.toLowerCase().includes(q) ||
        s.eligibility.some((e) => e.toLowerCase().includes(q)) ||
        s.requiredDocuments.some((d) => d.name.toLowerCase().includes(q))
    )
  }

  return results
}
