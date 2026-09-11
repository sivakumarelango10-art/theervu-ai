# AI Intent Architecture — TheervuAI

## Overview

The TheervuAI intent classification system converts raw user queries into structured routing decisions. This ensures that queries are handled by the most appropriate workflow rather than passing all queries to a single generic AI handler.

## Supported Intents

| Intent | Description | Routing Target |
|---|---|---|
| `general_civic_info` | General government/civic questions | `chat_assistant` |
| `scheme_discovery` | Finding welfare schemes and yojanas | `service_directory` |
| `document_lookup` | What documents are required | `before_you_go` |
| `eligibility_check` | Eligibility for a service/scheme | `chat_assistant` |
| `application_procedure` | How to apply step-by-step | `before_you_go` |
| `application_status` | Tracking an existing application | `application_tracker` |
| `service_comparison` | Comparing multiple services | `service_directory` |
| `complaint_guidance` | Filing grievances | `complaint_drafter` |
| `emergency_civic` | Urgent safety/emergency queries | `emergency_handler` |
| `location_service_discovery` | Finding nearby offices | `service_directory` |
| `document_analysis` | Explaining uploaded documents | `document_analyzer` |
| `translation` | Language translation requests | `translator` |
| `voice_query` | Voice input (detected by client) | `chat_assistant` |
| `followup_question` | Follow-up in ongoing conversation | `chat_assistant` |
| `action_planning` | Creating preparation plans | `action_planner` |
| `unsupported` | Off-topic or blocked queries | `unsupported_handler` |

## Classification Pipeline

```
User Query
    ↓
[1] Unsupported content check (regex patterns: crypto, adult, hack)
    ↓ (if not blocked)
[2] Follow-up detection (short query in ongoing conversation)
    ↓ (if not follow-up)
[3] Intent signal scoring (keyword matching × weight)
    ↓
[4] Entity detection (state, service type, language, ref numbers)
    ↓
[5] Missing info calculation (required - detected entities)
    ↓
ClassifiedIntent {
  intent, confidence, routingTarget,
  requiredEntities, missingInfo,
  detectedEntities, flags
}
```

## Entity Detection

The classifier extracts:
- **State**: All 28 states + 8 UTs (case-insensitive)
- **Service type**: 16 common civic service keywords
- **Target language**: 11 Indian languages
- **Reference numbers**: Pattern matching for alphanumeric reference codes

## Confidence Scoring

`confidence = min(0.98, best_score / total_score + 0.1)`

Confidence reflects how clearly the best intent dominates alternatives. Values below 0.5 suggest the query is ambiguous and the assistant should ask a clarifying question.

## Usage

```typescript
import { classifyIntent } from '@/lib/ai/intent'

const result = classifyIntent('How do I apply for a passport in Tamil Nadu?')
// {
//   intent: 'application_procedure',
//   confidence: 0.82,
//   routingTarget: 'before_you_go',
//   detectedEntities: { state: 'Tamil Nadu', service_type: 'passport' },
//   missingInfo: [],
//   flags: { isDocumentRelated: true, needsLocation: false, ... }
// }
```
