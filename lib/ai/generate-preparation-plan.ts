import { env } from '@/lib/config/env'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { BEFORE_YOU_GO_PLAN_PROMPT, buildLanguageInstruction } from '@/lib/ai/prompts'
import {
  generateFallbackPlan,
  type FallbackPreparationPlan,
} from '@/lib/ai/fallback'
import { evaluateSafety } from '@/lib/ai/safety'
import { geminiPreparationPlanSchema } from '@/lib/ai/schemas'

export async function generateGeminiPreparationPlan(
  task: string,
  location?: string,
  preferredLanguage: string = 'en'
): Promise<FallbackPreparationPlan> {
  const safety = evaluateSafety(task)
  const gemini = getGeminiClient()

  // If Gemini is not configured or task violates safety, use verified fallback
  if (!gemini || !safety.isSafe) {
    return generateFallbackPlan(task, location)
  }

  try {
    const languageInstruction = buildLanguageInstruction(preferredLanguage)
    const prompt = `Task: ${task}\nLocation: ${location || 'All India'}\nLanguage: ${preferredLanguage}\n\nPlease generate a comprehensive Preparation Plan conforming strictly to the requested JSON schema.`

    const response = await gemini.models.generateContent({
      model: env.ai.geminiModel,
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
        const validated = geminiPreparationPlanSchema.safeParse(parsedJson)
        if (validated.success) {
          return validated.data
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
