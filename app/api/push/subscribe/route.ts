import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    // Upsert subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('push_subscriptions') as any)
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      }, {
        onConflict: 'endpoint',
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { error: 'Error al guardar suscripción' },
      { status: 500 }
    )
  }
}
