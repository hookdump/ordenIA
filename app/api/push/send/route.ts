import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export async function POST(request: Request) {
  // Check if push notifications are enabled
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { error: 'Push notifications are not configured' },
      { status: 503 }
    )
  }

  // Dynamically import web-push to avoid build-time issues
  const webpush = (await import('web-push')).default

  // Configure web-push
  webpush.setVapidDetails(
    'mailto:notifications@cleanhome.ai',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { userId, title, body, url } = await request.json()

    // Get user's push subscriptions
    const { data: subscriptionsData } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId || user.id)

    const subscriptions = (subscriptionsData || []) as Tables<'push_subscriptions'>[]

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: 'No hay suscripciones' }, { status: 404 })
    }

    const payload = JSON.stringify({
      title: title || 'CleanHome AI',
      body: body || 'Tienes tareas pendientes',
      url: url || '/dashboard',
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          // Remove invalid subscriptions
          if ((error as { statusCode?: number }).statusCode === 410) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('push_subscriptions') as any)
              .delete()
              .eq('id', sub.id)
          }
          throw error
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({ sent, total: subscriptions.length })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificación' },
      { status: 500 }
    )
  }
}
