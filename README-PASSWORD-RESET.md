# Password Reset Flow Implementation

This document provides an overview of the password reset flow implementation for the Pink House application.

## Components of the Password Reset Flow

1. **Forgot Password Page**
   - Server-side rendered page where users enter their email address
   - Located at `/forgot-password`
   - Sends a password reset email through Supabase

2. **Reset Password Email**
   - Customized email template with clear instructions
   - Contains a secure link to the reset password page
   - Link includes authentication tokens managed by Supabase

3. **Reset Password Page**
   - Client-side rendered page that handles Supabase's password reset tokens
   - Located at `/protected/reset-password`
   - Allows users to enter and confirm a new password

4. **Auth Callback Handler**
   - Processes authentication callbacks from Supabase
   - Handles redirects based on the type of auth operation

## Technical Implementation 

### Key Files

- `src/app/(auth)/forgot-password/page.tsx` - Forgot password form
- `src/app/protected/reset-password/page.tsx` - Reset password form  
- `src/app/auth/callback/route.ts` - Auth callback handler
- `src/app/actions.ts` - Server actions for auth operations
- `supabase/templates/reset-password.html` - Email template

### How It Works

1. User enters email on forgot password page
2. Server sends reset email with secure link via Supabase
3. User clicks link in email and is redirected to our app
4. Auth callback processes token and redirects to reset password page
5. Client-side reset password page captures token from URL hash (via Supabase SDK)
6. User sets new password, which updates their account via Supabase auth API

## Testing the Flow

To test the password reset flow:

1. Navigate to `/forgot-password`
2. Enter a valid email address that exists in your Supabase auth user table
3. Check the email inbox for the reset password email
4. Click the reset password link
5. You should be redirected to the reset password page
6. Enter a new password and confirm it
7. After successful submission, you should be redirected to the sign-in page
8. Try signing in with your new password

## Troubleshooting

- **Link Expired Error**: Password reset links expire after 24 hours. Request a new one.
- **Email Not Received**: Check spam folder or verify the email exists in your system.
- **Invalid Token**: Ensure the full URL with hash fragment is preserved when redirecting.

## Security Considerations

- Password reset tokens are one-time use and expire after 24 hours
- Reset password page is only accessible with a valid token
- Token validation is handled by Supabase's secure auth system
- Password strength requirements enforce minimum security standards 