# Password Reset Flow with Supabase PKCE Implementation

This document outlines the password reset flow implementation using Supabase's authentication system with PKCE (Proof Key for Code Exchange) for server-side authentication.

## Architecture Overview

The password reset flow follows these steps:

1. **User Requests Password Reset**: 
   - User navigates to the forgot password page
   - Enters their email address
   - Submits the form to request a password reset link

2. **Server Sends Reset Email**:
   - System validates the email exists in the database
   - Sends a password reset email with a secure token hash
   - Email template includes a direct link to the token exchange endpoint

3. **Token Exchange**:
   - User clicks the reset link in their email
   - The `/auth/confirm` route verifies the token_hash with Supabase
   - Upon successful verification, a session is established
   - User is redirected to the password update page

4. **Password Update**:
   - User enters and confirms their new password
   - System validates the password meets requirements
   - Password is updated in the Supabase auth system
   - User is redirected to the sign-in page with a success message

## Implementation Components

### 1. Email Template (`supabase/templates/reset-password.html`)
- Custom HTML email template for password reset
- Includes token_hash in the URL parameters
- Links directly to the confirm endpoint for token exchange

### 2. Forgot Password Form (`/src/app/(auth)/forgot-password/page.tsx`)
- Form for users to enter their email address
- Calls the `forgotPasswordAction` server action to initiate the flow

### 3. Server Action (`/src/app/actions.ts`)
- `forgotPasswordAction` function that triggers the reset email with Supabase
- Configures the redirect URL to the token exchange endpoint

### 4. Token Exchange Endpoint (`/src/app/auth/confirm/route.ts`)
- Handles the token verification with Supabase's `verifyOtp` method
- Uses the token_hash from the URL parameters
- Redirects to the password update page or error page

### 5. Password Update Page (`/src/app/account/update-password/page.tsx`)
- Protected page that requires a valid session
- Includes form for entering and confirming new password

### 6. Password Update Form (`/src/app/account/update-password/update-password-form.tsx`)
- Client-side form with password validation
- Uses Supabase client to update the user's password
- Provides feedback and redirects upon success

### 7. Error Handling Page (`/src/app/auth/auth-code-error/page.tsx`)
- Displays error message when token is invalid or expired
- Provides options to request a new reset link or return to sign-in

## Testing the Flow

1. Navigate to `/forgot-password`
2. Enter a valid email address that exists in your Supabase auth user table
3. Check the email inbox for the reset password link
4. Click the link in the email
5. You should be redirected to the password update form
6. Enter a new password and submit the form
7. You should be redirected to the sign-in page with a success message

## Error Handling

- Invalid/expired tokens redirect to the auth-code-error page
- Password validation errors display inline on the update password form
- Network errors during password update display error messages

## Security Considerations

- Uses Supabase's secure PKCE flow for server-side authentication
- Token hash is validated server-side before establishing a session
- Password update page requires a valid session
- Password reset links expire after 24 hours
- Password validation ensures minimum security requirements