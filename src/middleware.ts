import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Log the URL path for debugging purposes
  console.log(`Middleware handling request: ${req.nextUrl.pathname}`);
  
  // Explicitly skip auth-related routes
  if (req.nextUrl.pathname.startsWith('/auth/') || req.nextUrl.pathname === '/protected/reset-password') {
    console.log(`Skipping middleware for auth route: ${req.nextUrl.pathname}`);
    return NextResponse.next();
  }
  
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    // Refresh session if expired - required for Server Components
    const { data } = await supabase.auth.getSession();
    const { session } = data;

    // Protected routes
    if (req.nextUrl.pathname.startsWith("/dashboard") && !session) {
      console.log("Redirecting from protected dashboard route to sign-in (no session)");
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Role-based access control
    if (session?.user && req.nextUrl.pathname.startsWith("/dashboard")) {
      // Cache user role to avoid multiple DB calls
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      // Handle role-specific access restrictions
      if (userData?.role === "seller") {
        // Prevent sellers from accessing admin/staff routes
        if (
          req.nextUrl.pathname.match(
            /^\/dashboard\/(admin|staff|inventory|pos|sales|reports)/,
          )
        ) {
          return NextResponse.redirect(new URL("/dashboard/seller", req.url));
        }
      } else if (userData?.role === "staff") {
        // Prevent staff from accessing admin routes
        if (req.nextUrl.pathname.match(/^\/dashboard\/admin/)) {
          return NextResponse.redirect(new URL("/dashboard/staff", req.url));
        }
      }

      // Handle the generic /dashboard route - redirect to role-specific dashboard
      if (req.nextUrl.pathname === "/dashboard") {
        if (userData?.role === "seller") {
          return NextResponse.redirect(new URL("/dashboard/seller", req.url));
        } else if (userData?.role === "staff") {
          return NextResponse.redirect(new URL("/dashboard/staff", req.url));
        } else if (userData?.role === "admin") {
          return NextResponse.redirect(new URL("/dashboard/admin", req.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error("Error in middleware:", error);
    return res;
  }
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth/callback (authentication callback)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api|auth/callback).*)",
  ],
};
