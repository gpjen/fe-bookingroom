"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMasterData } from "@/app/_actions/master-data.actions";

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
    .min(3, { message: "Username minimal 3 karakter" })
    .max(50, { message: "Username maksimal 50 karakter" })
    .regex(/^[A-Z0-9]+$/i, {
      message: "Username hanya boleh huruf dan angka",
    }),
  displayName: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  nik: z.string().max(50, { message: "NIK maksimal 50 karakter" }).optional().nullable(),
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

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// TYPE DEFINITIONS
// ========================================

export type User = {
  id: string;
  username: string;
  usernameKey: string;
  displayName: string;
  email: string;
  nik: string | null;
  avatarUrl: string | null;
  status: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userRoles: {
    id: string;
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
    companyId: string;
    company: {
      id: string;
      code: string;
      name: string;
    };
  }[];
  userBuildings: {
    id: string;
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
 * Get all users with their roles and access
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
  try {
    const users = await prisma.user.findMany({
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
 * Get single user by ID
 */
export async function getUserById(id: string): Promise<ActionResponse<User>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
 * Create new user
 */
export async function createUser(
  input: UserInput
): Promise<ActionResponse<User>> {
  try {
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

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return {
        success: false,
        error: `Username "${data.username}" sudah digunakan`,
      };
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return {
        success: false,
        error: `Email "${data.email}" sudah digunakan`,
      };
    }

    // Check if NIK exists (if provided)
    if (data.nik) {
      const existingNik = await prisma.user.findUnique({
        where: { nik: data.nik },
      });

      if (existingNik) {
        return {
          success: false,
          error: `NIK "${data.nik}" sudah digunakan`,
        };
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        usernameKey: data.username.toLowerCase(),
        displayName: data.displayName,
        email: data.email,
        nik: data.nik || null,
        avatarUrl: data.avatarUrl || null,
        status: data.status,
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

    return { success: true, data: user };
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat pengguna baru",
    };
  }
}

/**
 * Update existing user
 */
export async function updateUser(
  id: string,
  input: UserInput
): Promise<ActionResponse<User>> {
  try {
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Pengguna tidak ditemukan",
      };
    }

    // Check if username already exists (excluding current user)
    if (data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameExists) {
        return {
          success: false,
          error: `Username "${data.username}" sudah digunakan`,
        };
      }
    }

    // Check if email already exists (excluding current user)
    if (data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return {
          success: false,
          error: `Email "${data.email}" sudah digunakan`,
        };
      }
    }

    // Check if NIK already exists (excluding current user)
    if (data.nik && data.nik !== existingUser.nik) {
      const nikExists = await prisma.user.findUnique({
        where: { nik: data.nik },
      });

      if (nikExists) {
        return {
          success: false,
          error: `NIK "${data.nik}" sudah digunakan`,
        };
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        usernameKey: data.username.toLowerCase(),
        displayName: data.displayName,
        email: data.email,
        nik: data.nik || null,
        avatarUrl: data.avatarUrl || null,
        status: data.status,
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

    return { success: true, data: user };
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui pengguna",
    };
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<ActionResponse<void>> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        error: "Pengguna tidak ditemukan",
      };
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_USER_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus pengguna",
    };
  }
}

/**
 * Assign roles to user
 */
export async function assignRoles(
  input: AssignRolesInput
): Promise<ActionResponse<void>> {
  try {
    const { userId, roles } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Create new role assignments
    for (const roleAssignment of roles) {
      await prisma.userRole.create({
        data: {
          userId,
          roleId: roleAssignment.roleId,
          companyId: roleAssignment.companyId,
        },
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[ASSIGN_ROLES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengatur role pengguna",
    };
  }
}

/**
 * Assign companies to user
 */
export async function assignCompanies(
  input: AssignCompaniesInput
): Promise<ActionResponse<void>> {
  try {
    const { userId, companyIds } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    // Delete existing company access
    await prisma.userCompany.deleteMany({
      where: { userId },
    });

    // Create new company assignments
    for (const companyId of companyIds) {
      await prisma.userCompany.create({
        data: {
          userId,
          companyId,
        },
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[ASSIGN_COMPANIES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengatur akses perusahaan",
    };
  }
}

/**
 * Assign buildings to user
 */
export async function assignBuildings(
  input: AssignBuildingsInput
): Promise<ActionResponse<void>> {
  try {
    const { userId, buildingIds } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    // Delete existing building access
    await prisma.userBuilding.deleteMany({
      where: { userId },
    });

    // Create new building assignments
    for (const buildingId of buildingIds) {
      await prisma.userBuilding.create({
        data: {
          userId,
          buildingId,
        },
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[ASSIGN_BUILDINGS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengatur akses gedung",
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
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: !user.status },
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

    // Check unique fields
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          { nik: data.nik || undefined },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username)
        return { success: false, error: "Username sudah digunakan" };
      if (existingUser.email === data.email)
        return { success: false, error: "Email sudah digunakan" };
      if (data.nik && existingUser.nik === data.nik)
        return { success: false, error: "NIK sudah digunakan" };
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
          nik: data.nik || null,
          avatarUrl: data.avatarUrl || null,
          status: data.status,
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

    // Check unique fields (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [
          { username: data.username },
          { email: data.email },
          { nik: data.nik || undefined },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username)
        return { success: false, error: "Username sudah digunakan" };
      if (existingUser.email === data.email)
        return { success: false, error: "Email sudah digunakan" };
      if (data.nik && existingUser.nik === data.nik)
        return { success: false, error: "NIK sudah digunakan" };
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
          nik: data.nik || null,
          avatarUrl: data.avatarUrl || null,
          status: data.status,
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
