import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/permissions
 * Returns user's roles, permissions, companies, and buildings
 * Uses case-insensitive username lookup (usernameKey)
 * Supports soft delete and user-specific permissions
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get username from Keycloak (preferred_username)
    const username = session.user.username;
    const usernameKey = username.toLowerCase(); // Case-insensitive search

    // Fetch user with all relations
    const user = await prisma.user.findFirst({
      where: {
        usernameKey,
        deletedAt: null, // ⭐ FILTER SOFT DELETED USERS
        status: true, // ⭐ ONLY ACTIVE USERS
      },
      include: {
        userRoles: {
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
            company: true,
          },
        },
        // ⭐ NEW: User-specific permission grants
        userPermissions: {
          include: {
            permission: true,
          },
          where: {
            OR: [
              { expiresAt: null }, // No expiration
              { expiresAt: { gt: new Date() } }, // Not expired yet
            ],
          },
        },
        // ⭐ NEW: Fetch companies from UserCompany table
        userCompanies: {
          include: {
            company: true,
          },
        },
        userBuildings: {
          include: {
            building: {
              include: {
                area: true,
              },
            },
          },
        },
      },
    });

    // If user not found or inactive/deleted, return empty permissions
    if (!user) {
      return NextResponse.json(
        {
          roles: [],
          permissions: [],
          companies: [],
          buildings: [],
        },
        { status: 401 }
      );
    }

    // No roles assigned
    if (user.userRoles.length === 0) {
      return NextResponse.json({
        roles: [],
        permissions: [],
        companies: [],
        buildings: [],
      });
    }

    // Resolve permissions
    const permissions = new Set<string>();
    const roles: string[] = [];
    const companies: string[] = [];
    const buildings: { id: string; code: string; name: string; area: string }[] =
      [];

    // 1. Process roles and role-based permissions
    user.userRoles.forEach((ur) => {
      // Add role name (unique)
      if (!roles.includes(ur.role.name)) {
        roles.push(ur.role.name);
      }

      // Add permissions from role
      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.key);
      });

      // Add company access from UserRole (role-scoped company)
      if (ur.company && !companies.includes(ur.company.code.toLowerCase())) {
        companies.push(ur.company.code.toLowerCase());
      }
    });

    // ⭐ 2. Add user-specific permissions (overrides/additions)
    user.userPermissions?.forEach((up) => {
      permissions.add(up.permission.key);
    });

    // ⭐ 3. Merge companies from UserCompany table (data access permissions)
    user.userCompanies?.forEach((uc) => {
      if (!companies.includes(uc.company.code.toLowerCase())) {
        companies.push(uc.company.code.toLowerCase());
      }
    });

    // 4. Process building access
    user.userBuildings.forEach((ub) => {
      const buildingExists = buildings.some((b) => b.id === ub.building.id);
      if (!buildingExists) {
        buildings.push({
          id: ub.building.id,
          code: ub.building.code,
          name: ub.building.name,
          area: ub.building.area.name,
        });
      }
    });

    return NextResponse.json({
      roles,
      permissions: Array.from(permissions),
      companies,
      buildings,
    });
  } catch (error) {
    console.error("[GET_PERMISSIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
