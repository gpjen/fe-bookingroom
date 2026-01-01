import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PermissionsProvider } from "@/providers/permissions-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // The proxy should prevent this, but as a final fallback.
  if (!session?.user) {
    redirect("/");
  }

  // Resolve DB User ID for notifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const username = (session.user as any).username;
  let dbUser = null;

  if (username) {
    dbUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!dbUser) {
      dbUser = await prisma.user.findUnique({
        where: { usernameKey: username.toLowerCase() },
      });
    }
  }

  return (
    <PermissionsProvider>
      <AuthGuard>
        <SidebarProvider defaultOpen={true}>
          <div className="relative flex min-h-screen w-full">
            <AppSidebar
              userName={session.user.name || ""}
              email={session.user.email || ""}
            />
            <SidebarInset className="flex-1">
              <AppHeader
                isLoggedIn={true}
                userName={session.user.name || ""}
                email={session.user.email || ""}
                userId={dbUser?.id}
              />
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto max-[1580px] px-2 py-3 md:px-8 md:py-6">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AuthGuard>
    </PermissionsProvider>
  );
}
