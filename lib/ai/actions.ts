/**
 * Safe Civic Action Workflow Engine for TheervuAI
 *
 * Provides structured, preview-first action helpers so the AI can help
 * users prepare applications, draft complaints, and organize documents —
 * without ever submitting anything automatically.
 *
 * SAFETY CONTRACT:
 * - Every action returns requiresConfirmation = true if it could have
 *   real-world consequences.
 * - No action submits to government portals, sends emails, or makes
 *   API calls without explicit user action.
 * - All drafts are clearly labeled as AI-assisted starting points.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionType =
  | 'checklist_plan'
  | 'complaint_draft'
  | 'official_request_draft'
  | 'office_visit_questions'
  | 'document_organizer'
  | 'application_steps'
  | 'action_plan'
  | 'portal_navigation'

export interface ActionResult {
  type: ActionType
  title: string
  preview: string // What the user will see before acting
  content: string // The actual draft / plan / checklist
  requiresConfirmation: boolean
  confirmationPrompt?: string
  disclaimer: string
  auditEvent: {
    action: ActionType
    timestamp: string
    userQuery: string // truncated, no PII
  }
  warnings?: string[]
  officialLinks?: Array<{ title: string; url: string; authority: string }>
}

// ─── Common Disclaimer ────────────────────────────────────────────────────────

const AI_DRAFT_DISCLAIMER =
  'This is an AI-assisted draft created by TheervuAI. It is a starting point only. ' +
  'Review all details carefully before submitting. TheervuAI is not a legal or government service. ' +
  'Always verify requirements with the official department or portal.'

// ─── Action Generators ───────────────────────────────────────────────────────

/**
 * Generates a structured preparation checklist for a civic visit or task.
 * Safe — read-only, no submission.
 */
export function buildChecklistPlan(
  serviceType: string,
  location: string,
  additionalContext: string = '',
): ActionResult {
  const truncatedContext = additionalContext.slice(0, 200)

  const content = `# Preparation Checklist: ${serviceType}

## Before You Go
- [ ] Check the official portal for current appointment availability
- [ ] Confirm office working hours and location for your district
- [ ] Verify all document requirements are current (rules may have changed)

## Documents (verify exact requirements on official portal)
- [ ] Primary identity proof (original + 2 self-attested photocopies)
- [ ] Address proof (original + 2 self-attested photocopies)
- [ ] Passport-size photographs (standard: 3.5cm × 3.5cm, white background)
- [ ] Any service-specific forms (download from official portal before visit)

## At the Office
- [ ] Arrive 30 minutes before your appointment or opening time
- [ ] Carry a pen and blank paper for any on-site forms
- [ ] Note down the reference number / acknowledgment you receive

## After Submission
- [ ] Save your acknowledgment receipt
- [ ] Note the expected processing time
- [ ] Add a follow-up reminder for the expected completion date
${additionalContext ? `\n## Your Specific Context\n${truncatedContext}` : ''}

---
*This checklist is a general guide. Always verify current requirements on the official portal.*`

  return {
    type: 'checklist_plan',
    title: `Preparation Checklist — ${serviceType}`,
    preview: `A personalized preparation checklist for ${serviceType}${location ? ` in ${location}` : ''}.`,
    content,
    requiresConfirmation: false,
    disclaimer: AI_DRAFT_DISCLAIMER,
    auditEvent: {
      action: 'checklist_plan',
      timestamp: new Date().toISOString(),
      userQuery: serviceType.slice(0, 80),
    },
    warnings: [
      'Document requirements and fees may vary by district and state office.',
      'Always download the latest forms from the official portal.',
    ],
  }
}

/**
 * Drafts a complaint outline for a government department.
 * Requires user confirmation — clearly labeled AI draft.
 */
export function buildComplaintDraft(
  department: string,
  issueDescription: string,
  userName: string = '[Your Name]',
): ActionResult {
  const safeDescription = issueDescription.slice(0, 500)
  const safeDept = department.slice(0, 100)
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const content = `To,
The Grievance Officer,
${safeDept},
[Office Address — verify on official portal]

Date: ${date}

Subject: Complaint Regarding — [Describe issue in one line]

Respected Sir/Madam,

I, ${userName}, am writing to bring to your attention the following concern:

${safeDescription}

I request that the above matter be looked into and appropriate action taken at the earliest. I am available for any further clarification required.

Enclosed / Attached:
- [List supporting documents you have]
- [Reference numbers, if any]

Thanking you,

Yours faithfully,
${userName}
[Contact Number]
[Email Address]
[Date]

---
[IMPORTANT: This is an AI-drafted template. Review and edit all details before submitting. 
TheervuAI does not submit complaints on your behalf.]`

  return {
    type: 'complaint_draft',
    title: `Complaint Draft — ${safeDept}`,
    preview: `A complaint letter template addressed to ${safeDept}. You will need to review and complete it before submitting.`,
    content,
    requiresConfirmation: true,
    confirmationPrompt:
      'I understand this is an AI-drafted template that I must review, edit, and submit myself. TheervuAI cannot submit complaints on my behalf.',
    disclaimer: AI_DRAFT_DISCLAIMER,
    auditEvent: {
      action: 'complaint_draft',
      timestamp: new Date().toISOString(),
      userQuery: safeDept.slice(0, 80),
    },
    warnings: [
      'This is a template only. Do not submit without reviewing all details.',
      'Include your correct contact information and any supporting documents.',
      'For online complaints, use CPGRAMS: https://pgportal.gov.in/',
    ],
    officialLinks: [
      { title: 'CPGRAMS Grievance Portal', url: 'https://pgportal.gov.in/', authority: 'Government of India' },
    ],
  }
}

/**
 * Generates a list of recommended questions to ask at a government office.
 * Safe — no submission.
 */
export function buildOfficeVisitQuestions(
  serviceType: string,
  specificConcerns: string = '',
): ActionResult {
  const content = `# Questions to Ask at the ${serviceType} Office

## About the Process
1. What is the complete list of documents required for my case?
2. Is there any online pre-registration or appointment I need?
3. How long does the application typically take to process?
4. What happens if my application is incomplete?

## About Documents
5. Do I need originals, photocopies, or both?
6. Are my documents (list them) sufficient for this application?
7. Do I need any documents attested or notarized?

## About Fees
8. What is the exact fee for this service?
9. What payment modes are accepted here (cash, card, UPI, DD)?

## About Status & Follow-up
10. How will I receive updates on my application?
11. What is the reference/tracking number for my application?
12. Where do I check the status online?
13. Whom should I contact if there is a delay?

## Your Specific Questions
${specificConcerns ? specificConcerns.slice(0, 300) : '- [Add your specific questions here]'}

---
*Print or save this list before your visit.*`

  return {
    type: 'office_visit_questions',
    title: `Office Visit Questions — ${serviceType}`,
    preview: `A curated list of important questions to ask when visiting the ${serviceType} office.`,
    content,
    requiresConfirmation: false,
    disclaimer: AI_DRAFT_DISCLAIMER,
    auditEvent: {
      action: 'office_visit_questions',
      timestamp: new Date().toISOString(),
      userQuery: serviceType.slice(0, 80),
    },
  }
}

/**
 * Builds a step-by-step action plan for a civic task.
 * Safe — planning only, no submission.
 */
export function buildActionPlan(
  task: string,
  location: string = '',
  urgency: 'low' | 'medium' | 'high' = 'medium',
): ActionResult {
  const content = `# Action Plan: ${task}
${urgency === 'high' ? '\n⚠️ **Marked as urgent.** Prioritize completing time-sensitive steps first.\n' : ''}
## Step 1: Gather Information
- Visit the official portal for ${task} to confirm current requirements
- Check if an online application is available (preferred over in-person)
- Confirm applicable fees and accepted payment methods

## Step 2: Prepare Documents
- Collect all required original documents
- Make 2–3 self-attested photocopies of each
- Organize in a folder with originals separate from copies

## Step 3: Book Appointment (if required)
- Visit the official portal to check appointment availability
- Select your preferred date and time slot
- Download and save the appointment confirmation

## Step 4: Submit Application
- Arrive 15–30 minutes before your appointment
- Submit all documents at the designated counter
- Collect and save your acknowledgment receipt

## Step 5: Track & Follow Up
- Note your reference/tracking number
- Check status on the official portal
- Set a follow-up reminder for the expected processing date
${location ? `\n## Your Location: ${location}\nVerify that the above process applies to offices in your state/district.` : ''}

---
*This plan is a structured guide. Always verify current procedures on the official portal.*`

  return {
    type: 'action_plan',
    title: `Action Plan — ${task}`,
    preview: `A structured step-by-step plan to complete: ${task}.`,
    content,
    requiresConfirmation: false,
    disclaimer: AI_DRAFT_DISCLAIMER,
    auditEvent: {
      action: 'action_plan',
      timestamp: new Date().toISOString(),
      userQuery: task.slice(0, 80),
    },
    warnings: [
      urgency === 'high' ? 'This is marked as urgent. Begin with time-sensitive steps immediately.' : '',
      'Verify the official portal for any recent updates to the process.',
    ].filter(Boolean),
  }
}

/**
 * Provides official portal navigation guidance.
 * Safe — informational only.
 */
export function buildPortalNavigationGuide(
  serviceType: string,
  portalUrl: string,
  portalName: string,
): ActionResult {
  const content = `# How to Navigate ${portalName}

## Getting Started
1. Open: ${portalUrl}
2. Look for the "New User Registration" or "Login" button
3. Register with your mobile number (linked to Aadhaar is preferred for some services)

## Finding Your Service
1. Use the search bar or browse the service categories
2. Look for: "${serviceType}"
3. Read the complete service description and eligibility before proceeding

## Submitting an Application
1. Fill in all mandatory fields (marked with *)
2. Upload required documents in the specified format (usually PDF or JPEG)
3. Double-check all information before final submission
4. Pay fees online using net banking, UPI, or debit card (if applicable)
5. Download and save the acknowledgment/receipt

## Getting Help
- Look for "Help" or "FAQ" on the portal
- Check for a helpline number on the contact page
- For technical issues: contact the portal's helpdesk

---
*Portal navigation may change. Always refer to the official portal's own user guide.*`

  return {
    type: 'portal_navigation',
    title: `Portal Navigation Guide — ${portalName}`,
    preview: `Step-by-step guidance for using ${portalName} (${portalUrl}).`,
    content,
    requiresConfirmation: false,
    disclaimer: AI_DRAFT_DISCLAIMER,
    auditEvent: {
      action: 'portal_navigation',
      timestamp: new Date().toISOString(),
      userQuery: serviceType.slice(0, 80),
    },
    officialLinks: [
      { title: portalName, url: portalUrl, authority: 'Official Portal' },
    ],
  }
}
