/**
 * Voice capabilities detection for client and server environments
 */

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}
