import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { generateCorrelationId } from '@/lib/observability/logger'

/**
 * TheervuAI Server Proxy (Next.js 16 Convention)
 *
 * Responsibilities:
 * 1. Supabase session refresh (keeps auth tokens valid)
 * 2. Security headers on every response
 * 3. Correlation ID injection for request tracing
 * 4. Protected route enforcement (redirect unauthenticated users)
 * 5. Content Security Policy with WebSocket support for Supabase Realtime
 */
export async function proxy(request: NextRequest) {
  const correlationId = generateCorrelationId()

  // 1. Handle Supabase session and protected route enforcement
  const response = await updateSession(request)

  // 2. Security Headers
  response.headers.set('X-Correlation-Id', correlationId)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=(), usb=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )

  // Content Security Policy — strict for non-API routes
  // Includes wss://*.supabase.co for Supabase Realtime WebSockets
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  if (!isApiRoute) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.sarvam.ai",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; ')
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (images, icons, svg, fonts)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
