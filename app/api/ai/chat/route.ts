import { NextResponse } from 'next/server'
import { chatRequestSchema } from '@/lib/validation/schemas'
import { generateChatResponse, createChatEventStream } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`chat_${ip}`, 25, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const result = chatRequestSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { question, conversationId, preferredLanguage } = result.data

    // Check if client requested streaming (via query param, header, or body)
    const url = new URL(request.url)
    const wantsStream =
      url.searchParams.get('stream') === 'true' ||
      (typeof json === 'object' && json !== null && (json as Record<string, unknown>).stream === true) ||
      request.headers.get('accept')?.includes('text/event-stream')

    if (wantsStream) {
      const stream = createChatEventStream(
        question,
        [],
        preferredLanguage,
        async (fullText, meta) => {
          // Asynchronously persist conversation if Supabase is configured
          if (!env.supabase.isConfigured) return
          try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let activeId = conversationId
            if (!activeId) {
              const title = question.slice(0, 45) + (question.length > 45 ? '...' : '')
              const { data: conv } = await supabase
                .from('conversations')
                .insert({
                  user_id: user.id,
                  title,
                  category: meta.isEmergency ? 'emergency' : 'general',
                })
                .select('id')
                .single()
              if (conv) activeId = conv.id
            }

            if (activeId) {
              await supabase.from('messages').insert([
                {
                  conversation_id: activeId,
                  role: 'user',
                  content: question,
                },
                {
                  conversation_id: activeId,
                  role: 'assistant',
                  content: fullText,
                  metadata: {
                    summary: meta.summary,
                    sources: meta.sources,
                    disclaimer: meta.disclaimer,
                  },
                },
              ])
            }
          } catch (dbErr) {
            logger.warn('Could not persist streamed conversation:', {
              endpoint: '/api/ai/chat',
              metadata: { error: dbErr instanceof Error ? dbErr.message : 'unknown' },
            })
          }
        }
      )

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // Generate standard JSON response
    const aiResponse = await generateChatResponse(
      question,
      [],
      preferredLanguage
    )

    // If Supabase is configured and user is logged in, persist conversation
    let activeConversationId = conversationId

    if (env.supabase.isConfigured) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          if (!activeConversationId) {
            const title = question.slice(0, 45) + (question.length > 45 ? '...' : '')
            const { data: conv } = await supabase
              .from('conversations')
              .insert({
                user_id: user.id,
                title,
                category: aiResponse.isEmergency ? 'emergency' : 'general',
              })
              .select('id')
              .single()

            if (conv) {
              activeConversationId = conv.id
            }
          }

          if (activeConversationId) {
            // Batch both messages into a single DB round-trip
            await supabase.from('messages').insert([
              {
                conversation_id: activeConversationId,
                role: 'user',
                content: question,
              },
              {
                conversation_id: activeConversationId,
                role: 'assistant',
                content: aiResponse.answer,
                metadata: {
                  summary: aiResponse.summary,
                  sources: aiResponse.sources,
                  disclaimer: aiResponse.disclaimer,
                },
              },
            ])
          }
        }
      } catch (dbError: unknown) {
        logger.warn('Could not persist conversation to database', {
          endpoint: '/api/ai/chat',
          metadata: {
            error: dbError instanceof Error ? dbError.message : 'unknown',
          },
        })
      }
    }

    return NextResponse.json({
      ...aiResponse,
      conversationId: activeConversationId,
    })
  } catch (error: unknown) {
    logger.error('Chat API Error', {
      endpoint: '/api/ai/chat',
      statusCode: 500,
      metadata: {
        error: error instanceof Error ? error.message : 'unknown',
      },
    })
    return NextResponse.json(
      {
        error: 'We could not process that request. Please try again.',
      },
      { status: 500 }
    )
  }
}

