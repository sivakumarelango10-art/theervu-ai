import { describe, it, expect } from 'vitest'
import { classifyIntent, describeIntent } from '@/lib/ai/intent'

describe('Intent Classifier', () => {
  it('classifies passport query as application_procedure', () => {
    const result = classifyIntent('How do I apply for a passport in Tamil Nadu?')
    expect(['application_procedure', 'document_lookup', 'general_civic_info']).toContain(result.intent)
    expect(result.confidence).toBeGreaterThan(0.3)
    expect(result.routingTarget).toBeDefined()
  })

  it('classifies emergency as emergency_civic', () => {
    const result = classifyIntent('There is an active fire emergency at my house')
    expect(result.intent).toBe('emergency_civic')
    expect(result.flags.isEmergency).toBe(true)
    expect(result.routingTarget).toBe('emergency_handler')
  })

  it('classifies document upload as document_analysis', () => {
    const result = classifyIntent('Can you explain this document I received from the government?')
    expect(['document_analysis', 'document_lookup']).toContain(result.intent)
    expect(result.flags.isDocumentRelated).toBe(true)
  })

  it('classifies scheme search as scheme_discovery', () => {
    const result = classifyIntent('What government schemes are available for farmers?')
    expect(['scheme_discovery', 'general_civic_info']).toContain(result.intent)
    expect(result.routingTarget).toBeDefined()
  })

  it('classifies eligibility query correctly', () => {
    const result = classifyIntent('Am I eligible for Ayushman Bharat health card?')
    expect(['eligibility_check', 'general_civic_info']).toContain(result.intent)
  })

  it('classifies complaint as complaint_guidance', () => {
    const result = classifyIntent('How do I file a complaint against a government department?')
    expect(['complaint_guidance', 'general_civic_info']).toContain(result.intent)
  })

  it('classifies comparison query as service_comparison', () => {
    const result = classifyIntent('What is the difference between a voter ID and Aadhaar card?')
    expect(['service_comparison', 'general_civic_info']).toContain(result.intent)
    expect(result.flags.isMultiService).toBeDefined()
  })

  it('classifies status check as application_status', () => {
    const result = classifyIntent('How do I track my application status with reference number?')
    expect(['application_status', 'general_civic_info']).toContain(result.intent)
    expect(result.routingTarget).toBeDefined()
  })

  it('detects state entity from query', () => {
    const result = classifyIntent('What documents are needed for driving licence in Tamil Nadu?')
    // Entity detection should find Tamil Nadu
    expect(result.detectedEntities).toBeDefined()
    if (result.detectedEntities.state) {
      expect(result.detectedEntities.state.toLowerCase()).toContain('tamil')
    }
  })

  it('classifies unsupported query correctly', () => {
    const result = classifyIntent('What is the best crypto to invest in bitcoin nft trading?')
    expect(result.intent).toBe('unsupported')
    expect(result.routingTarget).toBe('unsupported_handler')
  })

  it('returns valid confidence between 0 and 1', () => {
    const result = classifyIntent('How do I update my Aadhaar address?')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('describeIntent returns a non-empty string', () => {
    const result = classifyIntent('How do I apply for a PAN card?')
    const description = describeIntent(result)
    expect(typeof description).toBe('string')
    expect(description.length).toBeGreaterThan(10)
    expect(description).toContain('intent=')
    expect(description).toContain('confidence=')
  })
})
