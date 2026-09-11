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
  appointmentStatus: z.enum(['booked', 'walk_in', 'not_required', 'unknown']).optional(),
  visitorType: z.enum(['first_time', 'renewal', 'correction', 'dependent', 'general']).optional(),
  deadline: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredLanguage: z.string().default('en'),
})

export type PrepareRequest = z.infer<typeof prepareRequestSchema>

export const updateChecklistItemSchema = z.object({
  is_completed: z.boolean(),
})

export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>

export const feedbackSchema = z.object({
  category: z
    .enum(['general', 'plan_accuracy', 'usability', 'bug', 'missing_service'])
    .default('general'),
  feedback_type: z
    .enum([
      'helpful',
      'not_helpful',
      'incorrect_info',
      'outdated_info',
      'technical_issue',
      'missing_service',
      'improvement',
    ])
    .optional(),
  feature: z.string().max(100).optional(),
  related_record_id: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5).default(5),
  message: z.string().min(3, { message: 'Message must be at least 3 characters.' }).max(2000),
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
