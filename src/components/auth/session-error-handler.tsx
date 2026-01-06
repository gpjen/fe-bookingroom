"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * SessionErrorHandler
 *
 * This component monitors the session state and automatically
 * signs out the user when an authentication error occurs.
 *
 * Common scenarios:
 * - Access token expired and refresh failed
 * - User logged out from Keycloak (SSO)
 * - Session invalidated by admin
 *
 * This prevents the confusing state where the user appears
 * logged in but gets redirected on page refresh.
 */
export function SessionErrorHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only handle when session is loaded and has an error
    if (status !== "authenticated") return;

    // Check for session error (set by NextAuth in JWT callback)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionError = (session as any)?.error;

    if (sessionError === "RefreshAccessTokenError") {
      console.log("[SessionErrorHandler] Session expired, signing out...");

      // Sign out and redirect to home page
      // This will clear the stale client session
      signOut({
        callbackUrl: "/",
        redirect: true,
      });
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
