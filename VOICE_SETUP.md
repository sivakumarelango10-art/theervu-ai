# TheervuAI Voice Architecture: Speech-to-Text & Text-to-Speech

This document describes the voice dictation, playback controls, browser compatibility, and privacy protocols implemented in **TheervuAI** during Phase 4.

---

## 1. Voice Input (Speech-to-Text)

### Client Hook: `hooks/useVoiceInput.ts`
- Leverages the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- State Machine: `idle` → `requesting` → `recording` → `transcribing` → `error`.
- **Supported Controls**:
  - `startListening(langCode)`: Requests microphone permission and starts recognition in the selected Indian language BCP-47 locale (e.g. `ta-IN`, `hi-IN`, `en-IN`).
  - `stopListening()`: Gracefully finalizes audio capture and sets transcript.
  - `cancelListening()`: Aborts recording immediately without modifying input.
  - `resetTranscript()`: Clears buffer.

### Fallback Server Endpoint: `/api/voice/transcribe`
- Accepts multipart audio payloads.
- If `SARVAM_API_KEY` is configured, transcribes via Sarvam Saaras model.
- If unavailable, gracefully guides user to browser speech dictation without application crash.

---

## 2. Voice Output (Text-to-Speech)

### Client Hook: `hooks/useVoiceOutput.ts`
- Uses `window.speechSynthesis` and `SpeechSynthesisUtterance`.
- **Controls**:
  - `speak(text, langCode)`: Speaks plain-language civic advice in the selected language.
  - `pause()`: Pauses playback.
  - `resume()`: Resumes playback from pause.
  - `stop()`: Halts playback immediately.
- **Strict Non-Intrusiveness**: Voice reading is **100% user-initiated**. The application never autoplays audio. Sensitive document extracts are never read aloud by default.

---

## 3. Browser Compatibility Matrix

| Browser | Voice Input (Dictation) | Voice Output (Playback) | Notes |
|---|---|---|---|
| **Google Chrome (Desktop & Mobile)** | Supported | Supported | Best fidelity with multi-language Indic voice packs |
| **Microsoft Edge** | Supported | Supported | Full support with natural neural voices |
| **Apple Safari (iOS & macOS)** | Supported | Supported | `webkitSpeechRecognition` and system TTS active |
| **Mozilla Firefox** | Fallback Notice | Supported | Speech recognition requires browser flag; falls back cleanly |

---

## 4. Privacy & Audio Safety

- **No Background Recording**: Microphone hardware is accessed only upon explicit user button click and shuts down immediately when speech ends.
- **Zero Audio Archival**: Recorded audio streams are never stored on disk or server databases.
- **Zero Logging of Audio Data**: Voice content is never written to server access logs or terminal stdout.
