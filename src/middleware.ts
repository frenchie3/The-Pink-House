import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
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

  // Refresh session if expired - required for Server Components
  const {
    data: { session, user },
    error,
  } = await supabase.auth.getSession();

  // Protected routes
  if (req.nextUrl.pathname.startsWith("/dashboard") && error) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Role-based access control
  if (!error && user && req.nextUrl.pathname.startsWith("/dashboard")) {
    // Cache user role to avoid multiple DB calls
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Handle role-specific access restrictions
    if (data?.role === "seller") {
      // Prevent sellers from accessing admin/staff routes
      if (
        req.nextUrl.pathname.match(
          /^\/dashboard\/(admin|staff|inventory|pos|sales|reports)/,
        )
      ) {
        return NextResponse.redirect(new URL("/dashboard/seller", req.url));
      }
    } else if (data?.role === "staff") {
      // Prevent staff from accessing admin routes
      if (req.nextUrl.pathname.match(/^\/dashboard\/admin/)) {
        return NextResponse.redirect(new URL("/dashboard/staff", req.url));
      }
    }

    // Handle the generic /dashboard route - redirect to role-specific dashboard
    if (req.nextUrl.pathname === "/dashboard") {
      if (data?.role === "seller") {
        return NextResponse.redirect(new URL("/dashboard/seller", req.url));
      } else if (data?.role === "staff") {
        return NextResponse.redirect(new URL("/dashboard/staff", req.url));
      } else if (data?.role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      }
    }
  }

  if (error) {
    console.error("Auth session error:", error);
  }

  return res;
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
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
