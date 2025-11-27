"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeContent from "@/components/home/home-content";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to dashboard if truly authenticated and session is not expired
    if (
      status === "authenticated" &&
      session?.expires &&
      new Date(session.expires) > new Date()
    ) {
      router.push("/dashboard");
    }
  }, [status, session?.expires, router]);

  // Show spinner only if session is loading
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // If status is unauthenticated, or authenticated but session is expired, show the login page.
  // The AppShell will handle the redirect for expired sessions on protected routes.
  // This page should only show login if not authenticated or if the session is expired.
  if (
    status === "unauthenticated" ||
    (session?.expires && new Date(session.expires) <= new Date())
  ) {
    return <HomeContent />;
  }

  // Fallback for authenticated users whose session is not expired (should be redirected by useEffect)
  // or if status is authenticated but session is not yet loaded (handled by AppShell)
  return null;
}
