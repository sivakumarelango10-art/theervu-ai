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
 * Schema for checklist item in a preparation plan
 */
export const preparationChecklistItemSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
  priority: z.number().default(1),
  sourceUrl: z.string().optional(),
})

/**
 * Schema for section in a preparation plan
 */
export const preparationSectionSchema = z.object({
  title: z.string(),
  items: z.array(preparationChecklistItemSchema),
})

/**
 * Schema for structured Gemini Before You Go preparation plan
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
