# TheervuAI Known Limitations & Architectural Boundaries

This document provides a transparent, honest inventory of the platform's current technical boundaries, third-party constraints, and browser dependencies.

---

## 1. Voice Interaction & Browser Support

- **Web Speech API Availability**:
  - Voice dictation (`useVoiceInput`) relies on standard browser speech recognition (`window.SpeechRecognition` / `window.webkitSpeechRecognition`).
  - Supported natively in Google Chrome, Microsoft Edge, and Safari (iOS / macOS).
  - Mozilla Firefox does not enable speech recognition by default without experimental `media.webspeech.recognition.enable` flags. In unsupported environments, the UI gracefully falls back to keyboard input.
- **Speech Synthesis Voice Packs**:
  - Text-to-speech audio pronunciation relies on installed OS/browser voice packages. If an Indian regional voice (e.g. `ta-IN` or `hi-IN`) is not installed on the user's operating system, the browser will fall back to its default system voice.

---

## 2. Reminders & Notification Delivery Scope

- **In-App Calendar Tracking**:
  - Reminders track appointment dates, fee deadlines, and document renewals within the user's dashboard (`/saved`).
- **Browser Notification Scope**:
  - TheervuAI supports browser-based alerts on desktop and mobile browsers when the user grants notification permissions (`Notification.requestPermission()`).
- **SMS & Email Scope**:
  - The platform does not send automated SMS text messages or email alerts. Users are advised to rely on in-app schedules and browser notifications.

---

## 3. Multimodal Document Intelligence & OCR Boundaries

- **File Size & Page Constraints**:
  - Maximum upload size is strictly 10MB per document.
  - Documents with more than 15 pages should be cropped to relevant notice/summary sections for optimal token efficiency.
- **Handwritten & Low-DPI Documents**:
  - Modern printed government orders, digitally signed certificates, and hospital discharge summaries achieve high extraction accuracy.
  - Heavily faded carbon copies, stamp ink bleed-through, or cursive regional handwriting may be flagged with `Needs official verification` or low confidence scores.

---

## 4. Government Counter & Local Variations

- **Taluk & Municipal Discretion**:
  - Official rules compiled from `.gov.in` and `.nic.in` gazettes reflect standard national and state policies. However, individual local counters (RTO, Sub-Registrar, Taluk offices) occasionally mandate local counter affidavits or specific photo background colors.
  - TheervuAI displays explicit uncertainty badges ("Location-dependent" / "Needs official verification") on items subject to local municipal variation.

---

## 5. Government Application Tracking Boundaries (Phase 6)

- **No Public Live Government APIs**:
  - Indian government departments (Passport Seva, Parivahan, UIDAI, e-District, Income Tax) do not provide open, public third-party REST APIs for real-time automated application status polling.
  - TheervuAI strictly rejects making false claims of automated status polling.
  - **Manual Recordkeeping**: Tracking is entirely user-managed to help citizens securely store their Application Reference Numbers (ARN), document submission dates, and track next action deadlines.
  - Reference numbers and personal notes are private to the user account and never exposed or queried against unauthorized external endpoints.

---

## 6. Location-Aware Guidance Boundaries (Phase 6)

- **User-Controlled Filtering**:
  - TheervuAI deliberately avoids using HTML5 Geolocation API (`navigator.geolocation`) or IP-based geolocation lookups to protect citizen privacy.
  - Location filtering is driven 100% by user selection in the `LocationSelector` component.
  - If no location is selected, the platform defaults to `All India` national guidance.

---

## 7. Offline & Unconfigured Fallback Mode

- **Graceful Local Fallback**:
  - When external API keys (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`) are not yet configured in local development, TheervuAI operates in verified fallback mode.
  - In this mode, pre-compiled verified procedures and deterministic catalogs (`SEED_SERVICES`) allow complete UI/UX navigation without unhandled network exceptions.
