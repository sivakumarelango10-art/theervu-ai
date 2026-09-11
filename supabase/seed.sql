-- ==============================================================================
-- TheervuAI Seed Data: Verified Civic Services & Source References
-- ==============================================================================

insert into public.services (id, name, slug, category, description, authority, state, official_url, status) values
  (
    '00000000-0000-0000-0000-000000000001',
    'Driving Licence Renewal',
    'driving-licence-renewal',
    'transport',
    'Application and renewal of non-transport and transport driving licences across regional transport offices (RTOs).',
    'Ministry of Road Transport and Highways (MoRTH) / Parivahan Sewa',
    'All India',
    'https://parivahan.gov.in/parivahan/',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Fresh Passport Application',
    'fresh-passport-application',
    'passport',
    'Standard and tatkaal application process for Indian citizens applying for an ordinary international passport.',
    'Consular, Passport and Visa Division, Ministry of External Affairs (MEA)',
    'All India',
    'https://www.passportindia.gov.in/',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Aadhaar Address Update',
    'aadhaar-address-update',
    'identity',
    'Online and offline verification procedure to update the residential address in your Aadhaar card with valid proof of address.',
    'Unique Identification Authority of India (UIDAI)',
    'All India',
    'https://myaadhaar.uidai.gov.in/',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Ration Card Family Member Addition',
    'ration-card-member-addition',
    'civil-supplies',
    'Adding a newborn child or new family member to the state family ration card / Smart Card database.',
    'Department of Food and Civil Supplies / National Food Security Portal',
    'All India',
    'https://nfsa.gov.in/',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Ayushman Bharat Health Card (PM-JAY)',
    'ayushman-bharat-health-card',
    'healthcare',
    'Verification and generation of the Golden / Ayushman Card for eligible families providing cashless secondary and tertiary hospitalization.',
    'National Health Authority (NHA)',
    'All India',
    'https://beneficiary.nha.gov.in/',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Birth Certificate Issuance & Correction',
    'birth-certificate-issuance',
    'municipal',
    'Registration, extract issuance, and name inclusion for birth records through municipal corporations and town panchayats.',
    'Office of the Registrar General & Census Commissioner, India (Civil Registration System)',
    'All India',
    'https://crsorgi.gov.in/',
    'active'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  authority = excluded.authority,
  official_url = excluded.official_url,
  status = excluded.status;

insert into public.source_references (title, url, authority, category, verification_status) values
  ('Parivahan Sewa Portal', 'https://parivahan.gov.in/parivahan/', 'MoRTH', 'transport', 'verified'),
  ('Passport Seva Kendra Portal', 'https://www.passportindia.gov.in/', 'MEA', 'passport', 'verified'),
  ('UIDAI Official Portal', 'https://myaadhaar.uidai.gov.in/', 'UIDAI', 'identity', 'verified'),
  ('National Food Security Portal', 'https://nfsa.gov.in/', 'DoFPD', 'civil-supplies', 'verified'),
  ('Ayushman Bharat Beneficiary Portal', 'https://beneficiary.nha.gov.in/', 'NHA', 'healthcare', 'verified')
on conflict do nothing;
