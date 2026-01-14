import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: membership } = await supabase
          .from('home_members')
          .select('home_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        // If no home, redirect to onboarding
        if (!membership) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Auth code error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
