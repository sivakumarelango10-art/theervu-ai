import { NextResponse } from 'next/server'
import { chatRequestSchema } from '@/lib/validation/schemas'
import { generateChatResponse } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`chat_${ip}`, 25, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  let json: any
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

    // Generate Gemini or Fallback response
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
            // Save user message
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: question,
            })

            // Save assistant message
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'assistant',
              content: aiResponse.answer,
              metadata: {
                summary: aiResponse.summary,
                sources: aiResponse.sources,
                disclaimer: aiResponse.disclaimer,
              },
            })
          }
        }
      } catch (dbError) {
        console.warn('Could not persist conversation to database:', dbError)
      }
    }

    return NextResponse.json({
      ...aiResponse,
      conversationId: activeConversationId,
    })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'We could not process that request. Please try again.',
      },
      { status: 500 }
    )
  }
}
