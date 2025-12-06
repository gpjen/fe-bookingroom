import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getUserAccess, resolvePermissions } from "@/lib/auth/mock-db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Lookup user by username (preferred)
  const username = session.user.username || "";
  const userAccess = getUserAccess(username);

  if (!userAccess) {
    // If authenticated but no role assigned => No permissions
    return NextResponse.json({
      roles: [],
      permissions: [],
      companies: [],
    });
  }

  const permissions = resolvePermissions(
    userAccess.roles,
    userAccess.explicitPermissions
  );

  return NextResponse.json({
    roles: userAccess.roles,
    permissions,
    companies: userAccess.companies,
  });
}
