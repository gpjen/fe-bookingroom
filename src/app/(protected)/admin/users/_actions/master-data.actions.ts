"use server";

import { prisma } from "@/lib/db";

/**
 * Get all roles for dropdown
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
    return { success: true, data: roles };
  } catch (error) {
    console.error("[GET_ROLES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data roles", data: [] };
  }
}

/**
 * Get all companies for dropdown
 */
export async function getCompaniesForUser() {
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
    return { success: true, data: companies };
  } catch (error) {
    console.error("[GET_COMPANIES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data perusahaan",
      data: [],
    };
  }
}

/**
 * Get all buildings for dropdown
 */
export async function getBuildingsForUser() {
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
    return { success: true, data: buildings };
  } catch (error) {
    console.error("[GET_BUILDINGS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data gedung", data: [] };
  }
}

/**
 * Get all master data at once
 */
export async function getMasterDataForUsers() {
  try {
    const [rolesResult, companiesResult, buildingsResult] = await Promise.all([
      getRoles(),
      getCompaniesForUser(),
      getBuildingsForUser(),
    ]);

    return {
      roles: rolesResult.data,
      companies: companiesResult.data,
      buildings: buildingsResult.data,
    };
  } catch (error) {
    console.error("[GET_MASTER_DATA_ERROR]", error);
    return {
      roles: [],
      companies: [],
      buildings: [],
    };
  }
}
