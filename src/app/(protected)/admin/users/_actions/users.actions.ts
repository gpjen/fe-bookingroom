"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMasterData } from "@/app/_actions/master-data.actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// ========================================
// HELPER: Get Current Username
// ========================================

async function getCurrentUsername(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) return null;
    
    return session.user.username; // Return username directly
  } catch {
    return null;
  }
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Get all data required for Users Page (Users + Master Data)
 * Reduces client-server roundtrips to 1
 */
export async function getDataForUsersPage() {
  try {
    const [usersResult, masterData] = await Promise.all([
      getUsers(),
      getMasterData({
        roles: true,
        companies: true,
        buildings: true,
      }),
    ]);

    if (!usersResult.success) {
      return {
        success: false,
        error: usersResult.error,
      };
    }

    return {
      success: true,
      data: {
        users: usersResult.data,
        roles: masterData.roles,
        companies: masterData.companies,
        buildings: masterData.buildings,
      },
    };
  } catch (error) {
    console.error("[GET_DATA_FOR_USERS_PAGE_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data halaman pengguna",
    };
  }
}


const userSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username (NIK) minimal 3 karakter" })
    .max(50, { message: "Username (NIK) maksimal 50 karakter" })
    .regex(/^[A-Z0-9]+$/i, {
      message: "Username hanya boleh huruf dan angka",
    }),
  displayName: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  avatarUrl: z.string().url().optional().nullable(),
  status: z.boolean(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assignRolesSchema = z.object({
  userId: z.string(),
  roles: z.array(
    z.object({
      roleId: z.string(),
      companyId: z.string().optional().nullable(),
    })
  ),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assignCompaniesSchema = z.object({
  userId: z.string(),
  companyIds: z.array(z.string()),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assignBuildingsSchema = z.object({
  userId: z.string(),
  buildingIds: z.array(z.string()),
});

export type UserInput = z.infer<typeof userSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type AssignCompaniesInput = z.infer<typeof assignCompaniesSchema>;
export type AssignBuildingsInput = z.infer<typeof assignBuildingsSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

type ActionResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

type User = {
  id: string;
  username: string; // NIK is stored here
  usernameKey: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  status: boolean;
  lastLogin: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
  userRoles: {
    id: string;
    userId: string;
    roleId: string;
    companyId: string | null;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
    company: {
      id: string;
      code: string;
      name: string;
    } | null;
  }[];
  userCompanies: {
    id: string;
    userId: string;
    companyId: string;
    company: {
      id: string;
      code: string;
      name: string;
    };
  }[];
  userBuildings: {
    id: string;
    userId: string;
    buildingId: string;
    building: {
      id: string;
      code: string;
      name: string;
    };
  }[];
};

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all active users (exclude soft deleted)
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null, // ⭐ FILTER SOFT DELETE
      },
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        userCompanies: {
          include: {
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        userBuildings: {
          include: {
            building: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("[GET_USERS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data pengguna",
    };
  }
}

/**
 * Get single user by ID (exclude soft deleted)
 */
export async function getUserById(id: string): Promise<ActionResponse<User>> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null, // ⭐ FILTER SOFT DELETE
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        userCompanies: {
          include: {
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        userBuildings: {
          include: {
            building: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("[GET_USER_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data pengguna",
    };
  }
}

/**
 * Toggle user status (activate/deactivate)
 */
export async function toggleUserStatus(
  id: string
): Promise<ActionResponse<User>> {
  try {
    const currentUsername = await getCurrentUsername();
    
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: !user.status,
        updatedBy: currentUsername, // ⭐ TRACK WHO UPDATED
      },
      include: {
        userRoles: {
          include: {
            role: true,
            company: true,
          },
        },
        userCompanies: {
          include: {
            company: true,
          },
        },
        userBuildings: {
          include: {
            building: true,
          },
        },
      },
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("[TOGGLE_USER_STATUS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengubah status pengguna",
    };
  }
}

/**
 * Create new user with all relations (Roles, Companies, Buildings)
 * Single Transaction
 */
export async function createCompleteUser(
  input: UserInput & {
    roleIds: string[];
    companyIds: string[];
    buildingIds: string[];
  }
): Promise<ActionResponse<User>> {
  try {
    const currentUsername = await getCurrentUsername();
    
    // Validate input
    const validation = userSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check unique fields (exclude soft deleted)
    const existingUser = await prisma.user.findFirst({
      where: {
        deletedAt: null, // ⭐ FILTER SOFT DELETE
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username)
        return { success: false, error: "Username (NIK) sudah digunakan" };
      if (existingUser.email === data.email)
        return { success: false, error: "Email sudah digunakan" };
    }

    // Transaction: Create User -> Assign Relations
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          usernameKey: data.username.toLowerCase(),
          displayName: data.displayName,
          email: data.email,
          avatarUrl: data.avatarUrl || null,
          status: data.status,
          createdBy: currentUsername, // ⭐ TRACK WHO CREATED
          userRoles: {
            create: input.roleIds.map((roleId) => ({
              roleId,
              companyId: null,
            })),
          },
          userCompanies: {
            create: input.companyIds.map((companyId) => ({
              companyId,
            })),
          },
          userBuildings: {
            create: input.buildingIds.map((buildingId) => ({
              buildingId,
            })),
          },
        },
        include: {
          userRoles: { include: { role: true, company: true } },
          userCompanies: { include: { company: true } },
          userBuildings: { include: { building: true } },
        },
      });

      return newUser;
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("[CREATE_COMPLETE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat pengguna",
    };
  }
}

/**
 * Update user with all relations (Roles, Companies, Buildings)
 * Single Transaction
 */
export async function updateCompleteUser(
  id: string,
  input: UserInput & {
    roleIds: string[];
    companyIds: string[];
    buildingIds: string[];
  }
): Promise<ActionResponse<User>> {
  try {
    const currentUsername = await getCurrentUsername();
    
    // Validate input
    const validation = userSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check unique fields (excluding current user & soft deleted)
    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        deletedAt: null, // ⭐ FILTER SOFT DELETE
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username)
        return { success: false, error: "Username (NIK) sudah digunakan" };
      if (existingUser.email === data.email)
        return { success: false, error: "Email sudah digunakan" };
    }

    // Transaction: Update User -> Reset & Assign Relations
    const user = await prisma.$transaction(async (tx) => {
      // 1. Update Basic Info
      await tx.user.update({
        where: { id },
        data: {
          username: data.username,
          usernameKey: data.username.toLowerCase(),
          displayName: data.displayName,
          email: data.email,
          avatarUrl: data.avatarUrl || null,
          status: data.status,
          updatedBy: currentUsername, // ⭐ TRACK WHO UPDATED
        },
      });

      // 2. Update Roles (Delete All -> Create New)
      await tx.userRole.deleteMany({ where: { userId: id } });
      if (input.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: input.roleIds.map((roleId) => ({
            userId: id,
            roleId,
            companyId: null,
          })),
        });
      }

      // 3. Update Companies (Delete All -> Create New)
      await tx.userCompany.deleteMany({ where: { userId: id } });
      if (input.companyIds.length > 0) {
        await tx.userCompany.createMany({
          data: input.companyIds.map((companyId) => ({
            userId: id,
            companyId,
          })),
        });
      }

      // 4. Update Buildings (Delete All -> Create New)
      await tx.userBuilding.deleteMany({ where: { userId: id } });
      if (input.buildingIds.length > 0) {
        await tx.userBuilding.createMany({
          data: input.buildingIds.map((buildingId) => ({
            userId: id,
            buildingId,
          })),
        });
      }

      // Return fresh data
      return await tx.user.findUniqueOrThrow({
        where: { id },
        include: {
          userRoles: { include: { role: true, company: true } },
          userCompanies: { include: { company: true } },
          userBuildings: { include: { building: true } },
        },
      });
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("[UPDATE_COMPLETE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui pengguna",
    };
  }
}

/**
 * Soft delete user
 * Sets deletedAt timestamp and deletedBy user ID
 */
export async function deleteUser(id: string): Promise<ActionResponse<User>> {
  try {
    const currentUsername = await getCurrentUsername();
    
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(), // ⭐ SOFT DELETE
        deletedBy: currentUsername, // ⭐ TRACK WHO DELETED
        status: false, // Also deactivate
      },
      include: {
        userRoles: { include: { role: true, company: true } },
        userCompanies: { include: { company: true } },
        userBuildings: { include: { building: true } },
      },
    });

    return { success: true, data: deletedUser };
  } catch (error) {
    console.error("[DELETE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus pengguna",
    };
  }
}

/**
 * Restore soft deleted user
 */
export async function restoreUser(id: string): Promise<ActionResponse<User>> {
  try {
    const currentUsername = await getCurrentUsername();
    
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan di trash" };
    }

    const restoredUser = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null, // ⭐ RESTORE
        deletedBy: null,
        updatedBy: currentUsername, // ⭐ TRACK WHO RESTORED
      },
      include: {
        userRoles: { include: { role: true, company: true } },
        userCompanies: { include: { company: true } },
        userBuildings: { include: { building: true } },
      },
    });

    return { success: true, data: restoredUser };
  } catch (error) {
    console.error("[RESTORE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengembalikan pengguna",
    };
  }
}

// ========================================
// USER PERMISSION MANAGEMENT (User-Specific Grants)
// ========================================

/**
 * Grant user-specific permission (outside of roles)
 * Supports expiration date for temporary access
 */
export async function grantUserPermission(input: {
  userId: string;
  permissionKey: string;
  reason?: string;
  expiresAt?: Date;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const currentUsername = await getCurrentUsername();

    // Find permission by key
    const permission = await prisma.permission.findUnique({
      where: { key: input.permissionKey },
    });

    if (!permission) {
      return {
        success: false,
        error: `Permission "${input.permissionKey}" tidak ditemukan`,
      };
    }

    // Check if user exists and not deleted
    const user = await prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    // Check if permission already granted
    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: input.userId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Permission sudah diberikan ke user ini",
      };
    }

    // Grant permission
    const userPermission = await prisma.userPermission.create({
      data: {
        userId: input.userId,
        permissionId: permission.id,
        grantedBy: currentUsername,
        reason: input.reason || null,
        expiresAt: input.expiresAt || null,
      },
    });

    return { success: true, data: { id: userPermission.id } };
  } catch (error) {
    console.error("[GRANT_USER_PERMISSION_ERROR]", error);
    return {
      success: false,
      error: "Gagal memberikan permission ke user",
    };
  }
}

/**
 * Revoke user-specific permission
 */
export async function revokeUserPermission(
  userId: string,
  permissionKey: string
): Promise<ActionResponse<void>> {
  try {
    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey },
    });

    if (!permission) {
      return {
        success: false,
        error: `Permission "${permissionKey}" tidak ditemukan`,
      };
    }

    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: permission.id,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[REVOKE_USER_PERMISSION_ERROR]", error);
    return {
      success: false,
      error: "Gagal mencabut permission dari user",
    };
  }
}

/**
 * Get all user-specific permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<
  ActionResponse<
    {
      id: string;
      permissionKey: string;
      permissionDescription: string | null;
      grantedBy: string | null;
      reason: string | null;
      expiresAt: Date | null;
      grantedAt: Date;
      isExpired: boolean;
    }[]
  >
> {
  try {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: {
          select: {
            key: true,
            description: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    });

    const now = new Date();
    const data = userPermissions.map((up) => ({
      id: up.id,
      permissionKey: up.permission.key,
      permissionDescription: up.permission.description,
      grantedBy: up.grantedBy,
      reason: up.reason,
      expiresAt: up.expiresAt,
      grantedAt: up.grantedAt,
      isExpired: up.expiresAt ? up.expiresAt < now : false,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("[GET_USER_PERMISSIONS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil user permissions",
    };
  }
}

/**
 * Cleanup expired user permissions (for cron job)
 */
export async function revokeExpiredUserPermissions(): Promise<
  ActionResponse<{ count: number }>
> {
  try {
    const result = await prisma.userPermission.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("[REVOKE_EXPIRED_PERMISSIONS_ERROR]", error);
    return {
      success: false,
      error: "Gagal membersihkan expired permissions",
    };
  }
}
