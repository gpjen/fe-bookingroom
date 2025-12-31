"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPermissions } from "@/app/_actions/master-data.actions";

// ========================================
// VALIDATION SCHEMAS
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


const roleSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, { message: "Minimal pilih 1 permission" }),
});

export type RoleInput = z.infer<typeof roleSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

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
            permission: {
              select: {
                id: true,
                key: true,
                description: true,
                category: true,
              },
            },
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
 * Create new role with permissions
 */
export async function createRole(
  input: RoleInput
): Promise<ActionResponse<RoleWithPermissions>> {
  try {
    // Validate input
    const validation = roleSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return { success: false, error: errors.join(", ") };
    }

    const data = validation.data;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      return {
        success: false,
        error: `Role "${data.name}" sudah ada`,
      };
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        isSystemRole: false,
        rolePermissions: {
          create: data.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
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

    return { success: true, data: role };
  } catch (error) {
    console.error("[CREATE_ROLE_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat role baru",
    };
  }
}

/**
 * Update existing role
 */
export async function updateRole(
  id: string,
  input: RoleInput
): Promise<ActionResponse<RoleWithPermissions>> {
  try {
    // Validate input
    const validation = roleSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return { success: false, error: errors.join(", ") };
    }

    const data = validation.data;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return { success: false, error: "Role tidak ditemukan" };
    }

    // Check if system role
    if (existingRole.isSystemRole) {
      return {
        success: false,
        error: "System role tidak dapat diubah",
      };
    }

    // Check if name already exists (excluding current role)
    if (data.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        return {
          success: false,
          error: `Role "${data.name}" sudah ada`,
        };
      }
    }

    // Update role and permissions
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        rolePermissions: {
          // Delete all existing permissions
          deleteMany: {},
          // Create new permissions
          create: data.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
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

    return { success: true, data: role };
  } catch (error) {
    console.error("[UPDATE_ROLE_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui role",
    };
  }
}

/**
 * Delete role
 */
export async function deleteRole(id: string): Promise<ActionResponse<void>> {
  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!role) {
      return { success: false, error: "Role tidak ditemukan" };
    }

    // Check if system role
    if (role.isSystemRole) {
      return {
        success: false,
        error: "System role tidak dapat dihapus",
      };
    }

    // Check if role is assigned to users
    if (role.userRoles.length > 0) {
      return {
        success: false,
        error: `Role masih digunakan oleh ${role.userRoles.length} user`,
      };
    }

    // Delete role (cascade will handle rolePermissions)
    await prisma.role.delete({
      where: { id },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_ROLE_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus role",
    };
  }
}
