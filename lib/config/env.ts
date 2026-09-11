/**
 * Environment configuration and runtime validation for TheervuAI
 */

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    isConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').includes('placeholder')
    ),
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    isGeminiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      !process.env.GEMINI_API_KEY.includes('placeholder') &&
      process.env.GEMINI_API_KEY.trim().length > 10
    ),
    sarvamApiKey: process.env.SARVAM_API_KEY || '',
    isSarvamConfigured: Boolean(
      process.env.SARVAM_API_KEY &&
      !process.env.SARVAM_API_KEY.includes('placeholder')
    ),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    isProduction: process.env.NODE_ENV === 'production',
  },
}

export interface EnvironmentStatus {
  isSupabaseConfigured: boolean
  isGeminiConfigured: boolean
  isSarvamConfigured: boolean
  isProduction: boolean
  appUrl: string
  warnings: string[]
}

export function validateEnvironment(): EnvironmentStatus {
  const warnings: string[] = []

  if (!env.supabase.isConfigured) {
    warnings.push('Supabase is running in local fallback mode. Connect real Supabase credentials for cloud persistence.')
  }
  if (!env.ai.isGeminiConfigured) {
    warnings.push('Google Gemini API key is not configured. Running in verified offline procedural guidance mode.')
  }
  if (!env.ai.isSarvamConfigured) {
    warnings.push('Sarvam AI key is not configured. Indic translations will be served via Gemini engine.')
  }

  return {
    isSupabaseConfigured: env.supabase.isConfigured,
    isGeminiConfigured: env.ai.isGeminiConfigured,
    isSarvamConfigured: env.ai.isSarvamConfigured,
    isProduction: env.app.isProduction,
    appUrl: env.app.url,
    warnings,
  }
}
