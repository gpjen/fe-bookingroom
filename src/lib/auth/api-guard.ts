import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getUserAccess, resolvePermissions } from "./mock-db";
import { NextResponse } from "next/server";

export async function checkApiPermission(requiredPermission: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.username) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const access = getUserAccess(session.user.username);
  if (!access) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const permissions = resolvePermissions(
    access.roles,
    access.explicitPermissions
  );

  if (permissions.includes("*")) {
    return { success: true };
  }

  if (!permissions.includes(requiredPermission)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Missing Permission" },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}
