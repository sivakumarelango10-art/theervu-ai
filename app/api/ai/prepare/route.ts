import { NextResponse } from 'next/server'
import { prepareRequestSchema } from '@/lib/validation/schemas'
import { generatePreparationPlan } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`prepare_${ip}`, 15, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Plan generation request limit reached. Please wait a minute before generating another plan.' },
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

    // Generate full preparation plan via Gemini or Fallback
    const plan = await generatePreparationPlan(task, location, preferredLanguage, {
      appointmentStatus,
      visitorType,
      deadline,
      state,
      district,
    })

    // Check if user is authenticated and wishes to persist the plan
    let savedPlanId: string | null = null

    if (env.supabase.isConfigured) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Resolve service_id if slug provided
          let serviceId: string | null = null
          if (serviceSlug) {
            const { data: svc } = await supabase
              .from('services')
              .select('id')
              .eq('slug', serviceSlug)
              .single()
            if (svc) serviceId = svc.id
          }

          const { data: insertedPlan } = await supabase
            .from('preparation_plans')
            .insert({
              user_id: user.id,
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

            // Insert plan checklist items
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
              await supabase.from('preparation_items').insert(allItems)
            }
          }
        }
      } catch (dbError) {
        console.warn('Could not persist preparation plan to DB:', dbError)
      }
    }

    return NextResponse.json({
      ...plan,
      id: savedPlanId,
    })
  } catch (error: any) {
    console.error('Prepare API Error:', error)
    return NextResponse.json(
      {
        error: 'We could not generate the preparation plan. Please try again.',
      },
      { status: 500 }
    )
  }
}
