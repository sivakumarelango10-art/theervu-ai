# TheervuAI Regional Language Architecture & Sarvam AI Integration

This document outlines the Indian regional language support, language detection algorithms, translation workflows, and Sarvam AI integration implemented in **TheervuAI** during Phase 4.

---

## 1. Supported Indian Languages

TheervuAI supports 11 Indian languages with native scripts, BCP-47 identifiers, and speech synthesis tags defined in [`lib/i18n/languages.ts`](lib/i18n/languages.ts):

| Language | ISO Code | Native Script | BCP-47 Tag | Voice Synthesis |
|---|---|---|---|---|
| **English** | `en` | English | `en-IN` | Yes |
| **Tamil** | `ta` | தமிழ் | `ta-IN` | Yes |
| **Hindi** | `hi` | हिन्दी | `hi-IN` | Yes |
| **Telugu** | `te` | తెలుగు | `te-IN` | Yes |
| **Kannada** | `kn` | ಕನ್ನಡ | `kn-IN` | Yes |
| **Malayalam** | `ml` | മലയാളം | `ml-IN` | Yes |
| **Bengali** | `bn` | বাংলা | `bn-IN` | Yes |
| **Marathi** | `mr` | मराठी | `mr-IN` | Yes |
| **Gujarati** | `gu` | ગુજરાતી | `gu-IN` | Yes |
| **Punjabi** | `pa` | ਪੰਜਾਬੀ | `pa-IN` | Yes |
| **Odia** | `or` | ଓଡ଼ିଆ | `or-IN` | Yes |

---

## 2. Deterministic Script Detection

Implemented in [`lib/i18n/language-detection.ts`](lib/i18n/language-detection.ts):
- Scans Unicode character ranges without network latency:
  - Tamil: `\u0B80-\u0BFF`
  - Devanagari (Hindi, Marathi): `\u0900-\u097F`
  - Telugu: `\u0C00-\u0C7F`
  - Kannada: `\u0C80-\u0CFF`
  - Malayalam: `\u0D00-\u0D7F`
  - Bengali: `\u0980-\u09FF`
  - Gujarati: `\u0A80-\u0AFF`
  - Gurmukhi: `\u0A00-\u0A7F`
  - Odia: `\u0B00-\u0B7F`
- Returns detected language code, script name, and confidence score.

---

## 3. Sarvam AI Integration

- **Environment Variable**: `SARVAM_API_KEY` (server-side only; never exposed to browser).
- **Service Module**: [`lib/ai/sarvam.ts`](lib/ai/sarvam.ts).
- **Endpoints Utilized**:
  - `POST https://api.sarvam.ai/translate` (Mayura model for Indic translations)
  - `POST https://api.sarvam.ai/speech-to-text` (Saaras model for Indic audio transcription)
  - `POST https://api.sarvam.ai/text-to-speech` (Bulbul model for Indic voice synthesis)
- **Graceful Fallback**: If `SARVAM_API_KEY` is not present or an API call fails, the system seamlessly routes translation to Google Gemini 3.8 Flash and voice to the browser Web Speech API.

---

## 4. Entity Preservation Safeguards

The translation engine [`lib/i18n/translation.ts`](lib/i18n/translation.ts) enforces strict non-corruption rules:
- **Dates and Numbers**: Kept in standard numerical format (`DD-MM-YYYY`, `₹XXX`).
- **Application Identifiers**: ARN receipts, Aadhaar references, PAN numbers, and case numbers are preserved unaltered.
- **Official Domains & URLs**: Hyperlinks (e.g. `parivahan.gov.in`, `passportindia.gov.in`) are preserved intact.
- **Department Titles**: Well-known department names (e.g. RTO, VAO, PSK, GCC) remain identifiable in local and English scripts.
