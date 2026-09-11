import { describe, it, expect } from 'vitest'
import {
  generateFallbackPlan,
  generateFallbackChatResponse,
} from '@/lib/ai/fallback'

describe('AI Fallback & Plan Generation Engine', () => {
  it('generates a detailed driving licence renewal plan', () => {
    const plan = generateFallbackPlan('Driving licence renewal', 'Tamil Nadu')
    expect(plan.title).toContain('Driving Licence')
    expect(plan.sections.length).toBeGreaterThan(1)
    expect(plan.sources.length).toBeGreaterThan(0)

    const allItems = plan.sections.flatMap((s) => s.items)
    expect(allItems.some((item) => item.required)).toBe(true)
    expect(allItems.some((item) => item.title.includes('Form 1A') || item.title.includes('Original Existing Driving Licence'))).toBe(true)
  })

  it('generates a passport preparation plan with PSK instructions', () => {
    const plan = generateFallbackPlan('Passport fresh application', 'Delhi')
    expect(plan.title).toContain('Passport')
    expect(plan.sources[0].url).toContain('passportindia.gov.in')
  })

  it('generates a fallback chat response with actionable steps', () => {
    const response = generateFallbackChatResponse('What should I bring to hospital appointment?')
    expect(response.steps.length).toBeGreaterThan(0)
    expect(response.sources.length).toBeGreaterThan(0)
  })
})
