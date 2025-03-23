import { redirect } from "next/navigation";

export default function ResetPasswordRedirect() {
  // This page should never be displayed directly
  // It just redirects to the protected reset password page
  redirect("/protected/reset-password");
} 