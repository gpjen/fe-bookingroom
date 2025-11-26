import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative flex min-h-screen w-full">
        <AppSidebar
          userName={session?.user?.name || ""}
          email={session?.user?.email || ""}
        />
        <SidebarInset className="flex-1">
          <AppHeader
            isLoggedIn={true}
            userName={session?.user?.name || ""}
            email={session?.user?.email || ""}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-[1580px] px-2 py-3 md:px-8 md:py-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
