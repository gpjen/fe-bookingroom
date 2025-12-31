"use server";

import { prisma } from "@/lib/db";

// ========================================
// SHARED MASTER DATA ACTIONS
// For use across all pages
// ========================================

/**
 * Get all active roles
 */
export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    return roles;
  } catch (error) {
    console.error("[GET_ROLES_ERROR]", error);
    return [];
  }
}

/**
 * Get all active companies
 */
export async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
    return companies;
  } catch (error) {
    console.error("[GET_COMPANIES_ERROR]", error);
    return [];
  }
}

/**
 * Get all active buildings
 */
export async function getBuildings() {
  try {
    const buildings = await prisma.building.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        areaId: true,
      },
    });
    return buildings;
  } catch (error) {
    console.error("[GET_BUILDINGS_ERROR]", error);
    return [];
  }
}

/**
 * Get all active building types
 */
export async function getBuildingTypes() {
  try {
    const buildingTypes = await prisma.buildingType.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
    return buildingTypes;
  } catch (error) {
    console.error("[GET_BUILDING_TYPES_ERROR]", error);
    return [];
  }
}

/**
 * Get all active room types
 */
export async function getRoomTypes() {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
    return roomTypes;
  } catch (error) {
    console.error("[GET_ROOM_TYPES_ERROR]", error);
    return [];
  }
}

/**
 * Get all active areas
 */
export async function getAreas() {
  try {
    const areas = await prisma.area.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
      },
    });
    return areas;
  } catch (error) {
    console.error("[GET_AREAS_ERROR]", error);
    return [];
  }
}

/**
 * Get all permissions
 */
export async function getPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
      select: {
        id: true,
        key: true,
        description: true,
        category: true,
      },
    });
    return permissions;
  } catch (error) {
    console.error("[GET_PERMISSIONS_ERROR]", error);
    return [];
  }
}

// ========================================
// FLEXIBLE BATCH FETCH
// ========================================

export type MasterDataOptions = {
  roles?: boolean;
  companies?: boolean;
  buildings?: boolean;
  buildingTypes?: boolean;
  roomTypes?: boolean;
  areas?: boolean;
  permissions?: boolean;
};

export type MasterDataResult = {
  roles: Awaited<ReturnType<typeof getRoles>>;
  companies: Awaited<ReturnType<typeof getCompanies>>;
  buildings: Awaited<ReturnType<typeof getBuildings>>;
  buildingTypes: Awaited<ReturnType<typeof getBuildingTypes>>;
  roomTypes: Awaited<ReturnType<typeof getRoomTypes>>;
  areas: Awaited<ReturnType<typeof getAreas>>;
  permissions: Awaited<ReturnType<typeof getPermissions>>;
};

/**
 * Get multiple master data at once (FLEXIBLE & EFFICIENT)
 * Only fetches what you request
 */
export async function getMasterData(
  options: MasterDataOptions = {}
): Promise<MasterDataResult> {
  const promises: Promise<unknown>[] = [];
  const keys: (keyof MasterDataOptions)[] = [];

  // Build promises array based on options
  if (options.roles) {
    promises.push(getRoles());
    keys.push("roles");
  }
  if (options.companies) {
    promises.push(getCompanies());
    keys.push("companies");
  }
  if (options.buildings) {
    promises.push(getBuildings());
    keys.push("buildings");
  }
  if (options.buildingTypes) {
    promises.push(getBuildingTypes());
    keys.push("buildingTypes");
  }
  if (options.roomTypes) {
    promises.push(getRoomTypes());
    keys.push("roomTypes");
  }
  if (options.areas) {
    promises.push(getAreas());
    keys.push("areas");
  }
  if (options.permissions) {
    promises.push(getPermissions());
    keys.push("permissions");
  }

  // Fetch all requested data in parallel
  const results = await Promise.all(promises);

  // Map results back to their keys
  const data: Partial<MasterDataResult> = {};
  keys.forEach((key, index) => {
    data[key] = results[index] as never;
  });

  // Return with empty arrays for non-requested items
  return {
    roles: data.roles || [],
    companies: data.companies || [],
    buildings: data.buildings || [],
    buildingTypes: data.buildingTypes || [],
    roomTypes: data.roomTypes || [],
    areas: data.areas || [],
    permissions: data.permissions || [],
  };
}

/**
 * @deprecated Use getMasterData() instead for better performance
 */
export async function getAllMasterData() {
  return getMasterData({
    roles: true,
    companies: true,
    buildings: true,
    buildingTypes: true,
    roomTypes: true,
    areas: true,
  });
}
