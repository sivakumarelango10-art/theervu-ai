# Verified Information Pipeline — TheervuAI

## Overview

TheervuAI distinguishes clearly between verified official information and AI-generated guidance. This is the core trust mechanism of the platform.

## Information Taxonomy

| Tier | Label | Source | Badge Color |
|---|---|---|---|
| `VERIFIED_OFFICIAL` | ✅ Official Source | `.gov.in`, `.nic.in` domains | Green |
| `VERIFIED_INSTITUTIONAL` | 🔵 Verified Source | UIDAI, EPFO, NSDL, Passport India | Blue |
| `SYSTEM_GUIDANCE` | 🤖 AI Guidance | Gemini-generated, not tied to a specific source | Gray |
| `USER_PROVIDED` | 👤 User-Provided | Information entered by the user | Gray |
| `REQUIRES_CONFIRMATION` | ⚠️ Verify Required | Unclassified, location-dependent, or potentially outdated | Amber |

## Domain Classification Logic

```
URL Domain → Classification

*.gov.in / *.nic.in         → VERIFIED_OFFICIAL
uidai.gov.in                → VERIFIED_INSTITUTIONAL (more specific)
epfo.gov.in                 → VERIFIED_INSTITUTIONAL
passportindia.gov.in        → VERIFIED_INSTITUTIONAL
parivahan.gov.in            → VERIFIED_INSTITUTIONAL
utiitsl.com                 → VERIFIED_INSTITUTIONAL
Everything else             → REQUIRES_CONFIRMATION
```

## Freshness Status

| Age Since Verification | Status |
|---|---|
| 0–30 days | `fresh` ✓ Verified recently |
| 31–90 days | `recently_verified` ✓ Verified within 90 days |
| 90+ days | `review_due` ⚠ May require re-verification |
| Unknown | `unknown` Verification date unknown |

## Hybrid AI Retrieval

When a user query matches a civic service in the verified catalog:

1. `findMatchingCivicService()` scores all SEED_SERVICES against the query
2. If score ≥ 4: Verified service context is injected into the Gemini system prompt
3. Gemini's MANDATORY INSTRUCTIONS enforce:
   - "STRICT ZERO-FABRICATION RULE: These are VERIFIED OFFICIAL FACTS"
   - "Do NOT invent fees, extra documents, or office procedures"
   - "If detail is absent: state 'Information not available — check official portal'"
4. Source attribution is attached to the response

## Source Attribution in Responses

Every AI response includes a `sources[]` array:
```json
[
  {
    "title": "Passport Seva Portal",
    "url": "https://passportindia.gov.in/",
    "authority": "Ministry of External Affairs"
  }
]
```

The UI renders these with tier badges so users know exactly what is verified.

## Zero-Fabrication Policy

TheervuAI NEVER:
- Invents official fee amounts
- Makes up document requirements
- Claims process steps that aren't in the verified catalog
- Presents unverified information as official

When verified data is unavailable, the AI explicitly says:
> "Information not available in the current verified database. Please check the official source at [url]."
