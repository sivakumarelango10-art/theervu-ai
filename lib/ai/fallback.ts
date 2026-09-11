/**
 * Development Fallback Engine for TheervuAI
 * Generates verified, structured preparation plans and responses when live AI keys are pending.
 */

export interface FallbackPreparationPlan {
  title: string
  summary: string
  location: string
  service: string
  sections: Array<{
    title: string
    items: Array<{
      title: string
      description: string
      required: boolean
      completed: boolean
      priority?: number
    }>
  }>
  warnings: string[]
  sources: Array<{
    title: string
    url: string
    authority: string
  }>
}

export function generateFallbackPlan(
  task: string,
  location?: string
): FallbackPreparationPlan {
  const lower = task.toLowerCase()
  const loc = location || 'All India'

  if (lower.includes('licence') || lower.includes('license') || lower.includes('rto') || lower.includes('driving')) {
    return {
      title: 'Driving Licence Renewal Preparation Plan',
      summary: 'A complete step-by-step checklist to renew your driving licence at your Regional Transport Office (RTO) without multiple trips.',
      location: loc,
      service: 'Driving Licence Services',
      sections: [
        {
          title: 'Before You Visit the RTO',
          items: [
            {
              title: 'Check online slot availability on Parivahan',
              description: 'Visit parivahan.gov.in and book your renewal appointment if mandatory in your state.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Fill Form 2 & Form 1A (Medical Certificate)',
              description: 'Form 1A signed by a registered medical practitioner (mandatory if applicant is over 40 years old).',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Pay renewal fee online or verify counter fee',
              description: 'Standard renewal fee is ₹200 + smart card fee (~₹200). Late fee of ₹1,000/year applies if expired for over a year.',
              required: true,
              completed: false,
              priority: 2,
            },
          ],
        },
        {
          title: 'Documents to Carry (Originals + 2 Copies)',
          items: [
            {
              title: 'Original Existing Driving Licence',
              description: 'Original physical card or book to be surrendered or verified.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Valid Proof of Address (Aadhaar / Voter ID / Passport)',
              description: 'Carry original plus self-attested photocopy.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Three passport-size recent photographs',
              description: 'White background, recently taken.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Printed Application Form and Slot Booking Slip',
              description: 'Print acknowledgment slip showing your application number.',
              required: true,
              completed: false,
              priority: 1,
            },
          ],
        },
        {
          title: 'At the RTO Counter',
          items: [
            {
              title: 'Document verification at scrutiny counter',
              description: 'Submit your physical file for initial officer verification.',
              required: true,
              completed: false,
              priority: 2,
            },
            {
              title: 'Biometric capture (Photo and Signature)',
              description: 'Proceed to the biometric desk for updated photo and thumb impression.',
              required: true,
              completed: false,
              priority: 2,
            },
            {
              title: 'Collect acknowledgment receipt with tracking number',
              description: 'Keep this safe until your renewed card arrives via speed post (typically 15-30 days).',
              required: true,
              completed: false,
              priority: 2,
            },
          ],
        },
      ],
      warnings: [
        'If your licence expired more than 1 year ago, a re-test may be mandated depending on state transport rules.',
        'Beware of unauthorized touts outside the office. All bookings and fee payments can be done directly.',
      ],
      sources: [
        {
          title: 'Parivahan Sewa Portal (MoRTH)',
          url: 'https://parivahan.gov.in/parivahan/',
          authority: 'Ministry of Road Transport and Highways',
        },
      ],
    }
  }

  if (lower.includes('passport') || lower.includes('psk')) {
    return {
      title: 'Passport Application Preparation Guide',
      summary: 'Required documents and appointment instructions for your visit to the Passport Seva Kendra (PSK / POPSK).',
      location: loc,
      service: 'Passport Seva',
      sections: [
        {
          title: 'Before Your PSK Appointment',
          items: [
            {
              title: 'Print Application Receipt (ARN Sheet)',
              description: 'Contains your batch time and reporting schedule.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Arrive 15 minutes before batch time',
              description: 'Entry is regulated strictly according to appointment slot time.',
              required: true,
              completed: false,
              priority: 1,
            },
          ],
        },
        {
          title: 'Documents to Bring (Originals Only)',
          items: [
            {
              title: 'Proof of Date of Birth (Birth Certificate / Aadhaar / School Leaving Certificate)',
              description: 'Must carry original document matching application spelling.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Proof of Present Address',
              description: 'Aadhaar card, active bank passbook with photo, or registered rental agreement.',
              required: true,
              completed: false,
              priority: 1,
            },
            {
              title: 'Standard X / XII Certificate (for Non-ECR status)',
              description: 'Original marksheet/certificate to get emigration check not required stamp.',
              required: false,
              completed: false,
              priority: 2,
            },
          ],
        },
      ],
      warnings: [
        'Only the applicant is allowed inside the Passport Seva Kendra (except for minors or persons requiring assistance).',
        'Electronic gadgets, cameras, and luggage are not permitted inside.',
      ],
      sources: [
        {
          title: 'Passport Seva Official Portal',
          url: 'https://www.passportindia.gov.in/',
          authority: 'Ministry of External Affairs',
        },
      ],
    }
  }

  // Default clean institutional plan
  return {
    title: `Preparation Plan: ${task.slice(0, 50)}`,
    summary: 'A structured preparation checklist to help you complete this task with clarity and confidence.',
    location: loc,
    service: 'Institutional Assistance',
    sections: [
      {
        title: 'Before You Visit',
        items: [
          {
            title: 'Verify operating hours and appointment requirements',
            description: 'Check whether advance token or appointment booking is required before going in person.',
            required: true,
            completed: false,
            priority: 1,
          },
          {
            title: 'Verify eligible proof of identity and address',
            description: 'Ensure names and addresses match identically across all submitted IDs.',
            required: true,
            completed: false,
            priority: 1,
          },
        ],
      },
      {
        title: 'Documents to Carry',
        items: [
          {
            title: 'Government Photo ID (Aadhaar / Voter ID / Passport)',
            description: 'Original plus two self-attested photocopies.',
            required: true,
            completed: false,
            priority: 1,
          },
          {
            title: 'Any existing notice, application form, or reference letter',
            description: 'Carry the physical copy of any correspondence received.',
            required: true,
            completed: false,
            priority: 1,
          },
          {
            title: '2-4 passport-size photographs',
            description: 'Keep on hand for physical registration registers.',
            required: false,
            completed: false,
            priority: 2,
          },
        ],
      },
      {
        title: 'At the Office',
        items: [
          {
            title: 'Obtain an acknowledgment receipt or token number',
            description: 'Never leave without an official stamped acknowledgment of your submission.',
            required: true,
            completed: false,
            priority: 1,
          },
        ],
      },
    ],
    warnings: [
      'Official procedures and fees vary by institution. Always verify counter instructions directly with authorized staff.',
    ],
    sources: [
      {
        title: 'National Government Services Portal (India)',
        url: 'https://services.india.gov.in/',
        authority: 'Government of India',
      },
    ],
  }
}

export function generateFallbackChatResponse(question: string): {
  answer: string
  summary: string
  steps: string[]
  sources: Array<{ title: string; url: string; authority: string }>
} {
  const lower = question.toLowerCase()

  if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('appointment')) {
    return {
      summary: 'Preparation guide for your medical consultation or outpatient visit.',
      answer: 'Preparing thoroughly for a hospital or doctor visit helps you get the most accurate care and avoids forgotten questions. Here is a clear checklist of what to prepare and bring.',
      steps: [
        'Gather your past medical records, discharge summaries, and ongoing prescription list.',
        'Write down a timeline of your symptoms, when they started, and what makes them better or worse.',
        'Prepare 3 core questions you want answered before leaving the doctor’s room.',
        'Carry your government photo ID and health insurance / Ayushman Bharat card.',
      ],
      sources: [
        {
          title: 'National Health Portal (MoHFW)',
          url: 'https://www.nhp.gov.in/',
          authority: 'Ministry of Health and Family Welfare',
        },
      ],
    }
  }

  return {
    summary: 'Clear next steps for your inquiry.',
    answer: `Here is a clear path forward regarding: "${question}". When handling institutional or government matters, having structured documentation and knowing the correct counter makes the entire process faster.`,
    steps: [
      'Identify whether your procedure can be completed online or requires an in-person visit.',
      'Check official portal guidelines for mandatory identity and address documents.',
      'Gather original documents plus self-attested photocopies before visiting.',
      'Always secure a stamped acknowledgment or reference number before leaving the office.',
    ],
    sources: [
      {
        title: 'National Government Services Portal',
        url: 'https://services.india.gov.in/',
        authority: 'National Informatics Centre',
      },
    ],
  }
}
