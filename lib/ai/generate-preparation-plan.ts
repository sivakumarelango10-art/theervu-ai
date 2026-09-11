import { geminiConfig } from '@/lib/ai/config'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { BEFORE_YOU_GO_PLAN_PROMPT, buildLanguageInstruction } from '@/lib/ai/prompts'
import {
  generateFallbackPlan,
  type FallbackPreparationPlan,
} from '@/lib/ai/fallback'
import { evaluateSafety } from '@/lib/ai/safety'
import { getHybridRetrievalContext } from '@/lib/ai/hybrid'
import {
  geminiPreparationPlanSchema,
  structuredBeforeYouGoSchema,
  convertStructuredPlanToSections,
} from '@/lib/ai/schemas'

export interface PreparationPlanOptions {
  appointmentStatus?: string
  visitorType?: string
  deadline?: string
  state?: string
  district?: string
}

/**
 * Generates a structured Before You Go preparation plan using Google Gemini.
 * Employs Section 6 validation with fallback to high-fidelity local procedures.
 */
export async function generateGeminiPreparationPlan(
  task: string,
  location?: string,
  preferredLanguage: string = 'en',
  options?: PreparationPlanOptions
): Promise<FallbackPreparationPlan> {
  const safety = evaluateSafety(task)
  const gemini = getGeminiClient()

  // If Gemini is not configured or task violates safety, use verified fallback
  if (!gemini || !safety.isSafe) {
    return generateFallbackPlan(task, location)
  }

  try {
    const languageInstruction = buildLanguageInstruction(preferredLanguage)
    const hybrid = getHybridRetrievalContext(task, location || options?.state)

    const contextDetails = [
      `Task: ${task}`,
      `Location: ${location || options?.state || 'All India'}`,
      options?.district ? `District: ${options.district}` : null,
      options?.appointmentStatus ? `Appointment Status: ${options.appointmentStatus}` : null,
      options?.visitorType ? `Visitor Category: ${options.visitorType}` : null,
      options?.deadline ? `Deadline: ${options.deadline}` : null,
      `Language: ${preferredLanguage}`,
    ]
      .filter(Boolean)
      .join('\n')

    const hybridContextBlock = hybrid.hybridSystemContext ? `\n\n${hybrid.hybridSystemContext}` : ''

    const prompt = `${contextDetails}${hybridContextBlock}

Please generate a comprehensive Preparation Plan conforming strictly to the requested JSON schema.
UNCERTAINTY RULES:
- Use explicit uncertainty designations where information is variable or unconfirmed.
- If any fee, counter timing, or required document varies by district or cannot be verified, state "Needs official verification" or "Location-dependent".
- Never fabricate official fees or office hours.`

    const response = await gemini.models.generateContent({
      model: geminiConfig.model,
      contents: prompt,
      config: {
        systemInstruction: `${BEFORE_YOU_GO_PLAN_PROMPT}\n\n${languageInstruction}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const raw = response.text
    if (raw) {
      try {
        const parsedJson = JSON.parse(raw)

        // 1. Check if model returned standard sections schema
        const sectionValidated = geminiPreparationPlanSchema.safeParse(parsedJson)
        if (sectionValidated.success) {
          return sectionValidated.data
        }

        // 2. Check if model returned Section 6 structured format
        const structuredValidated = structuredBeforeYouGoSchema.safeParse(parsedJson)
        if (structuredValidated.success) {
          const plan = structuredValidated.data
          return {
            title: plan.title,
            summary: plan.summary,
            location: location || 'All India',
            service: 'Civic Preparation',
            sections: convertStructuredPlanToSections(plan),
            warnings: plan.warnings,
            sources: [
              {
                title: 'National Government Services Portal',
                url: 'https://services.india.gov.in/',
                authority: 'Government of India',
              },
            ],
          }
        }
      } catch (jsonErr) {
        console.warn('Could not parse Gemini plan JSON output, falling back:', jsonErr)
      }
    }

    return generateFallbackPlan(task, location)
  } catch (error) {
    const norm = normalizeGeminiError(error)
    console.error(`Gemini Plan Generation Error [${norm.code}], falling back to local procedures:`, norm.userMessage)
    return generateFallbackPlan(task, location)
  }
}
