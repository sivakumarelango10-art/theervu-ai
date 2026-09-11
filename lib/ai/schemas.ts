import { z } from 'zod'

/**
 * Schema for validating structured Gemini chat response
 */
export const geminiChatResponseSchema = z.object({
  answer: z.string(),
  summary: z.string().default('Guidance tailored to your situation.'),
  steps: z.array(z.string()).default([]),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        authority: z.string(),
      })
    )
    .default([]),
  disclaimer: z.string().optional(),
  isEmergency: z.boolean().default(false),
})

export type GeminiChatResponse = z.infer<typeof geminiChatResponseSchema>

/**
 * Schema for checklist item in a preparation plan (legacy UI sections)
 */
export const preparationChecklistItemSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
  priority: z.number().default(1),
  sourceUrl: z.string().optional(),
})

export type PreparationChecklistItem = z.infer<typeof preparationChecklistItemSchema>

/**
 * Schema for section in a preparation plan
 */
export const preparationSectionSchema = z.object({
  title: z.string(),
  items: z.array(preparationChecklistItemSchema),
})

export type PreparationSection = z.infer<typeof preparationSectionSchema>

/**
 * Schema for structured Gemini Before You Go preparation plan (Section format)
 */
export const geminiPreparationPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  location: z.string().default('All India'),
  service: z.string().default('Civic Preparation'),
  sections: z.array(preparationSectionSchema),
  warnings: z.array(z.string()).default([]),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        authority: z.string(),
      })
    )
    .default([]),
})

export type GeminiPreparationPlan = z.infer<typeof geminiPreparationPlanSchema>

// ==============================================================================
// Section 6: Specific Validated Structured Before You Go Schema
// ==============================================================================

export const checklistStepSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  required: z.boolean().default(true),
})

export const documentRequirementSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  mandatory: z.union([z.boolean(), z.literal('unknown'), z.string()]).default(true),
})

export const feeItemSchema = z.object({
  name: z.string(),
  amount: z.string().default('Not specified - verify with official counter'),
  notes: z.string().default(''),
})

export const timingEstimateSchema = z.object({
  estimatedDuration: z.string().default('Not specified'),
  bestTimeToVisit: z.string().default('Morning hours on working days'),
})

export const structuredBeforeYouGoSchema = z.object({
  title: z.string(),
  summary: z.string(),
  steps: z.array(checklistStepSchema).default([]),
  documents: z.array(documentRequirementSchema).default([]),
  fees: z.array(feeItemSchema).default([]),
  timing: timingEstimateSchema.default({
    estimatedDuration: 'Not specified',
    bestTimeToVisit: 'Morning hours on working days',
  }),
  warnings: z.array(z.string()).default([]),
  sourceNotes: z.array(z.string()).default([]),
})

export type StructuredBeforeYouGo = z.infer<typeof structuredBeforeYouGoSchema>

/**
 * Bidirectional adapter: converts Section 6 structured output into UI sections
 */
export function convertStructuredPlanToSections(plan: StructuredBeforeYouGo): PreparationSection[] {
  const sections: PreparationSection[] = []

  // 1. Required Documents
  if (plan.documents.length > 0) {
    sections.push({
      title: 'Required Documents & Identification',
      items: plan.documents.map((d, index) => ({
        title: d.name,
        description: d.description || (d.mandatory === true ? 'Mandatory official document' : 'Supporting document if applicable'),
        required: d.mandatory === true || d.mandatory === 'unknown',
        completed: false,
        priority: index + 1,
      })),
    })
  }

  // 2. Action Steps
  if (plan.steps.length > 0) {
    sections.push({
      title: 'Action Steps & Procedure',
      items: plan.steps.map((s, index) => ({
        title: s.title,
        description: s.description,
        required: s.required,
        completed: false,
        priority: index + 1,
      })),
    })
  }

  // 3. Fees and Payments
  if (plan.fees.length > 0) {
    sections.push({
      title: 'Applicable Fees & Payment Methods',
      items: plan.fees.map((f, index) => ({
        title: `${f.name}: ${f.amount}`,
        description: f.notes ? `${f.notes} (Please confirm at the counter)` : 'Official fee subject to counter verification',
        required: false,
        completed: false,
        priority: index + 1,
      })),
    })
  }

  // 4. Office Timing & Best Time
  if (plan.timing) {
    sections.push({
      title: 'Timing & Queue Preparation',
      items: [
        {
          title: `Estimated Processing Duration: ${plan.timing.estimatedDuration}`,
          description: `Recommended arrival time: ${plan.timing.bestTimeToVisit}`,
          required: false,
          completed: false,
          priority: 1,
        },
      ],
    })
  }

  return sections
}

/**
 * Schema for structured Gemini document explanation
 */
export const geminiDocumentExplainSchema = z.object({
  documentType: z.string().default('Official Document'),
  plainLanguageSummary: z.string(),
  keyDetails: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .default([]),
  actionItems: z.array(z.string()).default([]),
  questionsToAsk: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  disclaimer: z.string().optional(),
})

export type GeminiDocumentExplain = z.infer<typeof geminiDocumentExplainSchema>

// ==============================================================================
// Step 4: Advanced Document Extraction Schema
// ==============================================================================

export const keyInformationItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']).default('unknown'),
})

export type KeyInformationItem = z.infer<typeof keyInformationItemSchema>

export const importantDateItemSchema = z.object({
  label: z.string(),
  date: z.string(),
  notes: z.string().default(''),
})

export type ImportantDateItem = z.infer<typeof importantDateItemSchema>

export const requiredActionItemSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
})

export type RequiredActionItem = z.infer<typeof requiredActionItemSchema>

export const advancedDocumentExtractionSchema = z.object({
  documentType: z.string().default('Official Document'),
  summary: z.string(),
  keyInformation: z.array(keyInformationItemSchema).default([]),
  importantDates: z.array(importantDateItemSchema).default([]),
  requiredActions: z.array(requiredActionItemSchema).default([]),
  missingInformation: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  verificationNotes: z.array(z.string()).default([]),
})

export type AdvancedDocumentExtraction = z.infer<typeof advancedDocumentExtractionSchema>

export type DocumentWorkflowAction =
  | 'explain'
  | 'summarize'
  | 'extract_info'
  | 'required_actions'
  | 'missing_info'
  | 'important_dates'
  | 'qa'
  | 'difficult_terms'
  | 'next_steps'

