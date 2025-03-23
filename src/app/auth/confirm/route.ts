import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
// Import the server-side Supabase client creation method
import { createClient } from '../../../../supabase/server'

/**
 * Handles the token exchange for password reset flow
 * This route verifies the OTP token and redirects to the password update page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  
  // Validate the next URL parameter to prevent open redirect vulnerabilities
  // Only allow relative paths that start with a slash and don't contain protocol-related characters
  if (!next.startsWith('/') || next.includes('://') || next.includes('\\')) {
    const errorRedirect = request.nextUrl.clone()
    errorRedirect.pathname = '/auth/auth-code-error'
    errorRedirect.search = '?reason=invalid_redirect'
    return NextResponse.redirect(errorRedirect)
  }
  
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Successfully verified the token, redirect to the next page (update password form)
      return NextResponse.redirect(redirectTo)
    }
    console.error('Error verifying OTP:', error)
  }

  // Redirect to an error page with instructions if the token is invalid or expired
  redirectTo.pathname = '/auth/auth-code-error'
  return NextResponse.redirect(redirectTo)
} 