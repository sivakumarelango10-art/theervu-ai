import * as z from 'zod'

export const chatRequestSchema = z.object({
  question: z
    .string()
    .min(3, { message: 'Please describe your situation (at least 3 characters).' })
    .max(1500, { message: 'Question cannot exceed 1500 characters.' }),
  conversationId: z.string().uuid().optional(),
  preferredLanguage: z.string().default('en'),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

export const prepareRequestSchema = z.object({
  task: z
    .string()
    .min(3, { message: 'Task description is required.' })
    .max(500, { message: 'Task description is too long.' }),
  location: z.string().optional(),
  serviceSlug: z.string().optional(),
  purpose: z.string().optional(),
  preferredLanguage: z.string().default('en'),
})

export type PrepareRequest = z.infer<typeof prepareRequestSchema>

export const updateChecklistItemSchema = z.object({
  is_completed: z.boolean(),
})

export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>

export const feedbackSchema = z.object({
  category: z.enum(['general', 'plan_accuracy', 'usability', 'bug', 'missing_service']),
  rating: z.number().int().min(1).max(5),
  message: z.string().min(5, { message: 'Message must be at least 5 characters.' }).max(2000),
  page_context: z.string().optional(),
})

export type FeedbackRequest = z.infer<typeof feedbackSchema>

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  preferred_language: z.string().default('en'),
})

export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>

export const documentExplainSchema = z.object({
  documentId: z.string().uuid().optional(),
  extractedText: z.string().min(10, { message: 'Document content is required.' }),
  documentType: z.string().optional(),
  preferredLanguage: z.string().default('en'),
})

export type DocumentExplainRequest = z.infer<typeof documentExplainSchema>
