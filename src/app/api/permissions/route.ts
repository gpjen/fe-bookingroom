import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/permissions
 * Returns user's roles, permissions, companies, and buildings
 * Uses case-insensitive username lookup (usernameKey)
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

    // Fetch user roles with related data
    const userRoles = await prisma.userRole.findMany({
      where: { usernameKey }, // Use lowercase key
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
    });

    // Fetch user buildings
    const userBuildings = await prisma.userBuilding.findMany({
      where: { usernameKey }, // Use lowercase key
      include: {
        building: {
          include: {
            area: true,
          },
        },
      },
    });

    // If no roles found, return empty permissions
    if (userRoles.length === 0) {
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

    // Process roles and permissions
    userRoles.forEach((ur) => {
      // Add role name (unique)
      if (!roles.includes(ur.role.name)) {
        roles.push(ur.role.name);
      }

      // Add permissions from role
      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.key);
      });

      // Add company access (unique)
      if (ur.company && !companies.includes(ur.company.code.toLowerCase())) {
        companies.push(ur.company.code.toLowerCase());
      }
    });

    // Process building access
    userBuildings.forEach((ub) => {
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
