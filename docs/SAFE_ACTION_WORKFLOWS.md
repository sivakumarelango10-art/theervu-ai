# Safe Action Workflows — TheervuAI

## Overview

TheervuAI includes a safe action workflow engine (`lib/ai/actions.ts`) that generates structured civic action plans without ever taking consequential actions automatically.

## Safety Contract

**TheervuAI will NEVER:**
- Submit applications to government portals
- Send complaints or emails on behalf of users
- Claim an application was submitted without real confirmation
- Access government databases without an actual integration
- Bypass OTPs, CAPTCHAs, or government authentication systems

**Every action that could have real-world consequences:**
- Returns `requiresConfirmation: true`
- Includes a `confirmationPrompt` the user must acknowledge
- Is clearly labeled as an AI-generated draft
- Includes an audit event (no PII stored)

## Available Actions

### 1. Checklist Plan (`checklist_plan`)
Generates a preparation checklist for a civic visit.
- **Confirmation required**: No (read-only)
- **Output**: Markdown checklist with document, visit, and follow-up steps

### 2. Complaint Draft (`complaint_draft`)
Drafts a complaint letter to a government department.
- **Confirmation required**: Yes — user must acknowledge this is a template
- **Output**: Formatted complaint letter with placeholders
- **Official links**: CPGRAMS grievance portal always included

### 3. Office Visit Questions (`office_visit_questions`)
Generates recommended questions for a government office visit.
- **Confirmation required**: No
- **Output**: Categorized question list (process, documents, fees, follow-up)

### 4. Action Plan (`action_plan`)
Step-by-step plan for completing a civic task.
- **Confirmation required**: No
- **Urgency support**: Low / Medium / High
- **Output**: 5-step plan (gather info → prepare → book → submit → track)

### 5. Portal Navigation Guide (`portal_navigation`)
Step-by-step guide for navigating an official government portal.
- **Confirmation required**: No
- **Output**: Registration, navigation, submission, and help guidance

## Audit Events

Every action generates an audit event containing:
- `action`: Type of action
- `timestamp`: ISO timestamp
- `userQuery`: Truncated task description (max 80 chars, no PII)

Audit events are used for observability only. No personal information is stored.

## Disclaimer

All actions include the standard disclaimer:
> "This is an AI-assisted draft created by TheervuAI. It is a starting point only. Review all details carefully before submitting. TheervuAI is not a legal or government service. Always verify requirements with the official department or portal."
