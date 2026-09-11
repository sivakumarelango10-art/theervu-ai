# Verified Sources & Provenance Policy

TheervuAI maintains strict standards for sourcing, verifying, and classifying government and civic information. This document outlines our domain hierarchy, verification protocol, and disclaimer rules.

---

## 1. Domain Hierarchy & Trust Classification

All external reference URLs presented to citizens are classified into explicit trust tiers in `lib/sources/verifier.ts`:

| Tier | Category | Domain Examples | Badge Label |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Central Government | `*.gov.in`, `*.nic.in`, `parivahan.gov.in`, `passportindia.gov.in`, `uidai.gov.in`, `pmjay.gov.in`, `digilocker.gov.in` | `Central Government Portal` |
| **Tier 1** | State Government | `tn.gov.in`, `karnataka.gov.in`, `maharashtra.gov.in`, `kerala.gov.in`, `delhi.gov.in`, `up.gov.in` | `State Government Portal` |
| **Tier 1** | Municipal / Local Body | `chennaicorporation.gov.in`, `bbmp.gov.in`, `mcgm.gov.in`, `ghmc.gov.in` | `Municipal / Local Body` |
| **Tier 2** | Institutional / Statutory | `rbi.org.in`, `sbi.co.in`, `aiims.edu`, `indiapost.gov.in`, `onlineservices.nsdl.com` | `Official Institution` |
| **Tier 3** | Secondary Reference | Non-governmental news portals, legal blogs, civic guides | `Secondary Reference` |

---

## 2. HTTPS & Security Enforcement

- Every official portal link must strictly use the secure `https://` protocol.
- HTTP links and unverified redirects are categorized as `unknown` and barred from automatic verified badging.

---

## 3. Freshness Calculation

Each verified service record retains a `lastVerifiedAt` timestamp:
- **`fresh`**: Verified within the last 30 days.
- **`recent`**: Verified between 31 and 90 days.
- **`stale`**: Exceeds 90 days since last human or automated verification audit.

---

## 4. Mandatory Disclaimer Policy

Whenever an official source or civic guidance is displayed, the system presents the mandatory statutory disclaimer:

> **Official Source Disclaimer**:  
> *"Requirements, fees, timings, and procedures may change. Always verify details with the official department before visiting."*

---

## 5. Zero-Fabrication AI Grounding

When the Universal AI Assistant or Before-You-Go wizard receives a civic inquiry:
1. `lib/ai/hybrid.ts` matches the intent to a verified record in `SEED_SERVICES`.
2. The exact verified documents, fees, and office types are injected into Gemini's system prompt.
3. The prompt explicitly instructs the AI:
   *"Do NOT invent or speculate different fees, extra required documents, or office procedures. If information is not provided in this verified context, state clearly: 'Information not available in the current verified database. Please check the official source.'"*
