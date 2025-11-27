"use client";

import HomeContent from "@/components/home/home-content";

export default function Page() {
  // The global AppShell now handles the main loading state.
  // This page component can now be simpler.
  // The HomeContent component will be shown once the session is resolved
  // and the user is determined to be unauthenticated by the proxy.
  return <HomeContent />;
}
