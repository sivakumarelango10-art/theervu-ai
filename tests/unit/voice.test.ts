import { describe, it, expect } from 'vitest'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '@/lib/voice/providers'

describe('Phase 4 Voice Providers', () => {
  it('detects unsupported environment in Node SSR context gracefully without throwing', () => {
    // In Node.js environment (no window), these return false
    expect(isSpeechRecognitionSupported()).toBe(false)
    expect(isSpeechSynthesisSupported()).toBe(false)
  })
})
