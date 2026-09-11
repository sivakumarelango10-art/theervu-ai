import { describe, it, expect } from 'vitest'
import {
  structuredBeforeYouGoSchema,
  convertStructuredPlanToSections,
} from '@/lib/ai/schemas'

describe('Section 6 Before You Go Structured Output Schema', () => {
  it('successfully validates a complete structured preparation plan', () => {
    const samplePlan = {
      title: 'Passport Renewal at Regional Passport Office',
      summary: 'Essential preparation steps, verified documents, and counter guidance for Indian Passport re-issue.',
      steps: [
        {
          title: 'Book an appointment slot on Passport Seva portal',
          description: 'Login to passportindia.gov.in, fill Form 1, pay fee online, and schedule an appointment.',
          required: true,
        },
        {
          title: 'Arrive 15 minutes prior to appointment slot',
          description: 'Show appointment SMS or printout at the entry gate.',
          required: true,
        },
      ],
      documents: [
        {
          name: 'Original Old Passport',
          description: 'First two and last two pages self-attested photocopy.',
          mandatory: true,
        },
        {
          name: 'Proof of Address (Aadhaar / Utility Bill)',
          description: 'Address proof matching current residence.',
          mandatory: true,
        },
        {
          name: 'Non-ECR Supporting Certificate',
          description: '10th standard pass certificate if applicable.',
          mandatory: 'unknown',
        },
      ],
      fees: [
        {
          name: 'Normal Application Fee (36 pages)',
          amount: 'Rs. 1,500',
          notes: 'Payable online via Passport Seva portal during appointment booking.',
        },
        {
          name: 'Tatkaal Scheme Additional Fee',
          amount: 'Rs. 2,000',
          notes: 'Payable if urgent dispatch is required.',
        },
      ],
      timing: {
        estimatedDuration: '2 to 3 hours at the Kendra',
        bestTimeToVisit: 'Morning slots (9:00 AM - 11:30 AM) to avoid midday rush',
      },
      warnings: [
        'Do not bring electronic gadgets or bulky bags inside the Passport Seva Kendra.',
        'Official fees and Tatkaal quotas are subject to Ministry of External Affairs updates.',
      ],
      sourceNotes: [
        'Passport Seva Portal: https://passportindia.gov.in',
        'MEA Consular, Passport and Visa Division',
      ],
    }

    const result = structuredBeforeYouGoSchema.safeParse(samplePlan)
    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBe(samplePlan.title)
      expect(result.data.steps).toHaveLength(2)
      expect(result.data.documents).toHaveLength(3)
      expect(result.data.fees).toHaveLength(2)
      expect(result.data.timing.estimatedDuration).toContain('2 to 3 hours')
    }
  })

  it('handles unknown details with uncertainty fallbacks', () => {
    const minimalPlan = {
      title: 'Local Village Administrative Office Visit',
      summary: 'Guidance for obtaining a community certificate.',
      steps: [
        {
          title: 'Visit during public grievance hours',
          description: 'Check VAO availability on Monday mornings.',
          required: true,
        },
      ],
      documents: [
        {
          name: 'Ration card copy',
          description: 'Family card copy',
          mandatory: 'unknown',
        },
      ],
      fees: [],
      timing: {
        estimatedDuration: 'Not specified - varies by taluk office workload',
        bestTimeToVisit: 'Please verify with the official office',
      },
    }

    const result = structuredBeforeYouGoSchema.safeParse(minimalPlan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fees).toEqual([])
      expect(result.data.timing.bestTimeToVisit).toBe('Please verify with the official office')
    }
  })

  it('converts Section 6 structured plan to UI sections seamlessly', () => {
    const structured = {
      title: 'Driving Licence Renewal',
      summary: 'Procedure at RTO.',
      steps: [
        { title: 'Submit Form 9 online', description: 'On Parivahan portal', required: true },
      ],
      documents: [
        { name: 'Original DL', description: 'Expired licence card', mandatory: true },
      ],
      fees: [
        { name: 'Renewal fee', amount: 'Rs. 200', notes: 'Plus smart card fee' },
      ],
      timing: {
        estimatedDuration: '1 hour',
        bestTimeToVisit: '10:00 AM',
      },
      warnings: ['Grace period is 1 year from expiry.'],
      sourceNotes: ['https://parivahan.gov.in'],
    }

    const sections = convertStructuredPlanToSections(structured)
    expect(sections.length).toBe(4)
    expect(sections[0].title).toBe('Required Documents & Identification')
    expect(sections[1].title).toBe('Action Steps & Procedure')
    expect(sections[2].title).toBe('Applicable Fees & Payment Methods')
    expect(sections[3].title).toBe('Timing & Queue Preparation')
  })
})
