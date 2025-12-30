import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Check if user has required permission for API route
 * @param requiredPermission - Permission key to check (e.g., "admin:read")
 * @returns { success: true } or { error: NextResponse }
 */
export async function checkApiPermission(requiredPermission: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.username) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const username = session.user.username;
  const usernameKey = username.toLowerCase();

  // Fetch user roles from database
  const userRoles = await prisma.userRole.findMany({
    where: { usernameKey },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (userRoles.length === 0) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  // Collect all permissions
  const permissions = new Set<string>();
  userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      permissions.add(rp.permission.key);
    });
  });

  // Super admin check
  if (permissions.has("*")) {
    return { success: true };
  }

  // Check required permission
  if (!permissions.has(requiredPermission)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Missing Permission" },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}
