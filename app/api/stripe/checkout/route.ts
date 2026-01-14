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

    // Get user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    const profile = profileData as Pick<Tables<'users'>, 'stripe_customer_id' | 'email'> | null

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('users') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
