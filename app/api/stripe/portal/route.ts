import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export async function POST() {
  // Check if Stripe is enabled
  if (process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 503 }
    )
  }

  // Only import Stripe when needed
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get user profile with Stripe customer ID
    const { data: profileData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const profile = profileData as Pick<Tables<'users'>, 'stripe_customer_id'> | null

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No se encontró información de facturación' },
        { status: 400 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Error al acceder al portal' },
      { status: 500 }
    )
  }
}
