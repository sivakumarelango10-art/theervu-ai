import { describe, it, expect } from 'vitest'
import {
  advancedDocumentExtractionSchema,
  type DocumentWorkflowAction,
} from '@/lib/ai/schemas'
import {
  SUPPORTED_DOCUMENT_MIME_TYPES,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  WORKFLOW_PROMPTS,
} from '@/lib/ai/multimodal'

describe('Phase 4 Document Intelligence & Extraction', () => {
  it('supports the required MIME types and extensions', () => {
    expect(SUPPORTED_DOCUMENT_MIME_TYPES).toContain('application/pdf')
    expect(SUPPORTED_DOCUMENT_MIME_TYPES).toContain('image/png')
    expect(SUPPORTED_DOCUMENT_MIME_TYPES).toContain('image/jpeg')
    expect(SUPPORTED_DOCUMENT_MIME_TYPES).toContain('image/webp')

    expect(SUPPORTED_DOCUMENT_EXTENSIONS).toContain('pdf')
    expect(SUPPORTED_DOCUMENT_EXTENSIONS).toContain('jpg')
    expect(SUPPORTED_DOCUMENT_EXTENSIONS).toContain('png')
    expect(SUPPORTED_DOCUMENT_EXTENSIONS).toContain('webp')
  })

  it('contains prompt definitions for all 9 workflow actions', () => {
    const workflows: DocumentWorkflowAction[] = [
      'explain',
      'summarize',
      'extract_info',
      'required_actions',
      'missing_info',
      'important_dates',
      'qa',
      'difficult_terms',
      'next_steps',
    ]

    workflows.forEach((wf) => {
      expect(WORKFLOW_PROMPTS[wf]).toBeDefined()
      expect(WORKFLOW_PROMPTS[wf].length).toBeGreaterThan(15)
    })
  })

  it('validates a complete Step 4 structured extraction output', () => {
    const sample = {
      documentType: 'Property Tax Assessment Notice',
      summary:
        'Official municipal tax demand notice issued by Greater Chennai Corporation for the current fiscal year.',
      keyInformation: [
        { label: 'Assessment Number', value: '09-112-04561', confidence: 'high' },
        { label: 'Assessee Name', value: 'K. Ramaswamy', confidence: 'high' },
        { label: 'Demand Amount', value: 'Rs. 4,250', confidence: 'high' },
        { label: 'Rebate Available', value: '5% if paid before due date', confidence: 'medium' },
      ],
      importantDates: [
        {
          label: 'Notice Issue Date',
          date: '01-Aug-2026',
          notes: 'Dispatched by zonal office',
        },
        {
          label: 'Payment Due Date',
          date: '30-Sep-2026',
          notes: 'Pay before this date to avoid 1% monthly interest penalty',
        },
      ],
      requiredActions: [
        {
          title: 'Pay property tax online or at e-Seva center',
          description: 'Visit chennaicorporation.gov.in or counter with assessment number.',
          priority: 'high',
        },
        {
          title: 'Download and preserve payment receipt',
          description: 'Keep digitally signed receipt for future property title verification.',
          priority: 'medium',
        },
      ],
      missingInformation: ['Previous year arrears receipt not attached'],
      warnings: [
        'Failure to pay by the due date incurs a statutory interest charge.',
      ],
      verificationNotes: [
        'Confirm online at chennaicorporation.gov.in before visiting zonal counter.',
      ],
    }

    const validated = advancedDocumentExtractionSchema.safeParse(sample)
    expect(validated.success).toBe(true)

    if (validated.success) {
      expect(validated.data.documentType).toBe('Property Tax Assessment Notice')
      expect(validated.data.keyInformation.length).toBe(4)
      expect(validated.data.importantDates.length).toBe(2)
      expect(validated.data.requiredActions[0].priority).toBe('high')
    }
  })

  it('handles missing fields gracefully with safe defaults', () => {
    const minimal = {
      summary: 'Handwritten discharge receipt from primary clinic.',
      keyInformation: [],
      importantDates: [],
      requiredActions: [],
      missingInformation: ['Doctor registration number not visible'],
      warnings: [],
      verificationNotes: [],
    }

    const validated = advancedDocumentExtractionSchema.safeParse(minimal)
    expect(validated.success).toBe(true)
    if (validated.success) {
      expect(validated.data.documentType).toBe('Official Document')
      expect(validated.data.keyInformation).toEqual([])
      expect(validated.data.missingInformation.length).toBe(1)
    }
  })
})
