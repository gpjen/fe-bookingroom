import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow requests for API, Next.js internals, and static assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // Assumes static files have extensions
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If user is not logged in (token is null) OR token has an error, and is not on the home page, redirect to home
  if ((!token || token.error) && pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is logged in (token exists and has no error) and tries to access home page, redirect to /home
  if (token && !token.error && pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}
