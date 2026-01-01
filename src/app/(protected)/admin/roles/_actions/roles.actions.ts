"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getPermissions } from "@/app/_actions/master-data.actions";
import { roleFormSchema, RoleFormInput, ActionResponse } from "./roles.schema";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type RoleWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: {
    permissionId: string;
    permission: {
      id: string;
      key: string;
      description: string | null;
      category: string | null;
    };
  }[];
  userRoles: {
    userId: string;
  }[];
};

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all data required for Roles Page (Roles + Permissions)
 * Reduces client-server roundtrips to 1
 */
export async function getDataForRolesPage() {
  try {
    const [rolesResult, permissionsData] = await Promise.all([
      getRolesWithPermissions(),
      getPermissions(),
    ]);

    if (!rolesResult.success) {
      return {
        success: false,
        error: rolesResult.error,
      };
    }

    return {
      success: true,
      data: {
        roles: rolesResult.data,
        permissions: permissionsData,
      },
    };
  } catch (error) {
    console.error("[GET_DATA_FOR_ROLES_PAGE_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data halaman roles",
    };
  }
}

/**
 * Get all roles with permissions and user count
 */
export async function getRolesWithPermissions(): Promise<
  ActionResponse<RoleWithPermissions[]>
> {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          select: {
            userId: true,
          },
        },
      },
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error("[GET_ROLES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data roles",
    };
  }
}

/**
 * Create new role
 */
export async function createRole(
  input: RoleFormInput
): Promise<ActionResponse<RoleWithPermissions>> {
  try {
    const validation = roleFormSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const data = validation.data;

    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return {
        success: false,
        error: `Role dengan nama "${data.name}" sudah ada`,
      };
    }

    // Create role with permissions transaction
    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
          isSystemRole: false,
        },
      });

      if (data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map((permissionId) => ({
            roleId: newRole.id,
            permissionId,
          })),
        });
      }

      return newRole;
    });

    // Fetch complete data to return
    const completeRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!completeRole) {
      throw new Error("Gagal mengambil data role baru");
    }

    revalidatePath("/admin/roles");

    return { success: true, data: completeRole };
  } catch (error) {
    console.error("[CREATE_ROLE_ERROR]", error);
    return { success: false, error: "Gagal membuat role" };
  }
}

/**
 * Update existing role
 */
export async function updateRole(
  id: string,
  input: RoleFormInput
): Promise<ActionResponse<RoleWithPermissions>> {
  try {
    const validation = roleFormSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const data = validation.data;

    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return { success: false, error: "Role tidak ditemukan" };
    }

    if (existingRole.isSystemRole) {
      return { success: false, error: "System role tidak dapat diubah" };
    }

    // Check name uniqueness
    if (data.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: data.name },
      });
      if (nameExists) {
        return {
          success: false,
          error: `Role dengan nama "${data.name}" sudah ada`,
        };
      }
    }

    // Update role transaction
    await prisma.$transaction(async (tx) => {
      // Update basic info
      await tx.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
        },
      });

      // Update permissions (delete all then add new)
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    });

    // Fetch updated data
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!updatedRole) {
      throw new Error("Gagal mengambil data role yang diupdate");
    }

    revalidatePath("/admin/roles");

    return { success: true, data: updatedRole };
  } catch (error) {
    console.error("[UPDATE_ROLE_ERROR]", error);
    return { success: false, error: "Gagal mengupdate role" };
  }
}

/**
 * Delete role
 */
export async function deleteRole(id: string): Promise<ActionResponse<void>> {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { userRoles: true },
    });

    if (!role) {
      return { success: false, error: "Role tidak ditemukan" };
    }

    if (role.isSystemRole) {
      return { success: false, error: "System role tidak dapat dihapus" };
    }

    if (role.userRoles.length > 0) {
      return {
        success: false,
        error: `Role masih digunakan oleh ${role.userRoles.length} user`,
      };
    }

    await prisma.role.delete({
      where: { id },
    });

    revalidatePath("/admin/roles");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_ROLE_ERROR]", error);
    return { success: false, error: "Gagal menghapus role" };
  }
}
