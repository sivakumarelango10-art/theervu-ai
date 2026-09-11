import { describe, it, expect } from 'vitest'
import {
  buildChecklistPlan,
  buildComplaintDraft,
  buildOfficeVisitQuestions,
  buildActionPlan,
  buildPortalNavigationGuide,
} from '@/lib/ai/actions'

describe('Safe Action Workflows', () => {
  describe('buildChecklistPlan', () => {
    it('generates a checklist plan without requiring confirmation', () => {
      const result = buildChecklistPlan('Passport Renewal', 'Tamil Nadu')
      expect(result.type).toBe('checklist_plan')
      expect(result.requiresConfirmation).toBe(false)
      expect(result.content).toContain('Checklist')
      expect(result.disclaimer).toBeDefined()
    })

    it('includes audit event with no PII', () => {
      const result = buildChecklistPlan('Driving Licence', 'Karnataka')
      expect(result.auditEvent.action).toBe('checklist_plan')
      expect(result.auditEvent.timestamp).toBeDefined()
      expect(result.auditEvent.userQuery.length).toBeLessThanOrEqual(80)
    })
  })

  describe('buildComplaintDraft', () => {
    it('requires user confirmation before acting', () => {
      const result = buildComplaintDraft('RTO Department', 'My driving licence was rejected unfairly')
      expect(result.type).toBe('complaint_draft')
      expect(result.requiresConfirmation).toBe(true)
      expect(result.confirmationPrompt).toBeDefined()
    })

    it('includes CPGRAMS official link', () => {
      const result = buildComplaintDraft('Municipal Corporation', 'Water supply issue')
      expect(result.officialLinks).toBeDefined()
      expect(result.officialLinks!.some((l) => l.url.includes('pgportal.gov.in'))).toBe(true)
    })

    it('includes AI-authored disclaimer', () => {
      const result = buildComplaintDraft('Income Tax Department', 'Wrong tax calculation')
      expect(result.content).toContain('AI-drafted template')
      expect(result.disclaimer).toContain('TheervuAI')
    })
  })

  describe('buildOfficeVisitQuestions', () => {
    it('generates relevant questions without confirmation', () => {
      const result = buildOfficeVisitQuestions('Passport Seva Kendra')
      expect(result.requiresConfirmation).toBe(false)
      expect(result.content).toContain('Documents')
      expect(result.content).toContain('Fees')
    })
  })

  describe('buildActionPlan', () => {
    it('marks high urgency in content', () => {
      const result = buildActionPlan('Aadhaar Update', 'Delhi', 'high')
      expect(result.content).toContain('urgent')
    })

    it('does not require confirmation for planning', () => {
      const result = buildActionPlan('PAN Card Application', 'Mumbai', 'low')
      expect(result.requiresConfirmation).toBe(false)
    })
  })

  describe('buildPortalNavigationGuide', () => {
    it('includes the portal URL in the guide', () => {
      const result = buildPortalNavigationGuide(
        'Passport Application',
        'https://passportindia.gov.in/',
        'Passport Seva Portal'
      )
      expect(result.content).toContain('passportindia.gov.in')
      expect(result.officialLinks).toBeDefined()
      expect(result.officialLinks![0].url).toContain('passportindia.gov.in')
    })
  })
})
