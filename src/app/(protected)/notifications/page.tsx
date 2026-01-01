import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getUserNotifications } from "./_actions/notifications.actions";
import { NotificationsView } from "./_components/notifications-view";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const username = (session?.user as any)?.username;

  if (!username) {
    // If no session or username, redirect to login
    redirect("/");
  }

  // Resolve DB user based on username from session
  // Logic: Try exact match first, then case-insensitive key
  let user = await prisma.user.findUnique({
    where: { username: username },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { usernameKey: username.toLowerCase() },
    });
  }

  if (!user) {
    // User authenticated in IDP but not found in local DB
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h3 className="font-semibold text-lg">User Profile Not Found</h3>
        <p>
          Akun Anda tidak ditemukan di database sistem. Silakan hubungi
          administrator.
        </p>
      </div>
    );
  }

  const result = await getUserNotifications(user.id);
  const notifications = result.success && result.data ? result.data : [];

  return <NotificationsView initialData={notifications} userId={user.id} />;
}
