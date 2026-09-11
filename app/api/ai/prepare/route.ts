import { NextResponse } from 'next/server'
import { prepareRequestSchema } from '@/lib/validation/schemas'
import { generatePreparationPlan } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`prepare_${ip}`, 15, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Plan generation request limit reached. Please wait a minute before generating another plan.' },
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
    const result = prepareRequestSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const {
      task,
      location,
      preferredLanguage,
      serviceSlug,
      appointmentStatus,
      visitorType,
      deadline,
      state,
      district,
    } = result.data

    // Run AI plan generation and Supabase auth resolution in parallel to reduce latency
    const planOptions = { appointmentStatus, visitorType, deadline, state, district }

    type AuthResult = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | null

    const getAuthResult = async (): Promise<AuthResult> => {
      if (!env.supabase.isConfigured) return null
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      if (!data.user) return null
      return { supabase, userId: data.user.id }
    }

    const [plan, authResult] = await Promise.all([
      generatePreparationPlan(task, location, preferredLanguage, planOptions),
      getAuthResult(),
    ])

    let savedPlanId: string | null = null

    if (authResult) {
      const { supabase: db, userId } = authResult
      try {
        // Resolve service_id by slug if provided
        let serviceId: string | null = null
        if (serviceSlug) {
          const { data: svc } = await db
            .from('services')
            .select('id')
            .eq('slug', serviceSlug)
            .single()
          if (svc) serviceId = svc.id
        }

        const { data: insertedPlan } = await db
          .from('preparation_plans')
          .insert({
            user_id: userId,
            service_id: serviceId,
            title: plan.title,
            purpose: task,
            location: plan.location,
            summary: plan.summary,
            status: 'active',
          })
          .select('id')
          .single()

        if (insertedPlan) {
          savedPlanId = insertedPlan.id

          // Batch all checklist items into a single insert
          const allItems = plan.sections.flatMap((sec) =>
            sec.items.map((item) => ({
              preparation_plan_id: insertedPlan.id,
              item_type: 'document',
              title: item.title,
              description: item.description,
              is_required: item.required,
              is_completed: item.completed || false,
              priority: item.priority || 1,
            }))
          )

          if (allItems.length > 0) {
            await db.from('preparation_items').insert(allItems)
          }
        }
      } catch (dbError: unknown) {
        logger.warn('Could not persist preparation plan to DB', {
          endpoint: '/api/ai/prepare',
          metadata: {
            error: dbError instanceof Error ? dbError.message : 'unknown',
          },
        })
      }
    }



    return NextResponse.json({
      ...plan,
      id: savedPlanId,
    })
  } catch (error: unknown) {
    logger.error('Prepare API Error', {
      endpoint: '/api/ai/prepare',
      statusCode: 500,
      metadata: {
        error: error instanceof Error ? error.message : 'unknown',
      },
    })
    return NextResponse.json(
      {
        error: 'We could not generate the preparation plan. Please try again.',
      },
      { status: 500 }
    )
  }
}
