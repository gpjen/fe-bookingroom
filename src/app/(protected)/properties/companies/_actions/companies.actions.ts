"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

// ========================================
// VALIDATION SCHEMAS
// ========================================

const companySchema = z.object({
  code: z
    .string()
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(10, { message: "Kode maksimal 10 karakter" })
    .regex(/^[A-Z0-9-]+$/, {
      message: "Kode hanya boleh huruf kapital, angka, dan dash",
    }),
  name: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  status: z.boolean().default(true),
});

export type CompanyInput = z.infer<typeof companySchema>;

// ========================================
// RESPONSE TYPES
// ========================================

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all companies with optional filtering
 */
export async function getCompanies(): Promise<
  ActionResponse<
    {
      id: string;
      code: string;
      name: string;
      status: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >
> {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: companies };
  } catch (error) {
    console.error("[GET_COMPANIES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data perusahaan",
    };
  }
}

/**
 * Get single company by ID
 */
export async function getCompanyById(
  id: string
): Promise<
  ActionResponse<{
    id: string;
    code: string;
    name: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return {
        success: false,
        error: "Perusahaan tidak ditemukan",
      };
    }

    return { success: true, data: company };
  } catch (error) {
    console.error("[GET_COMPANY_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data perusahaan",
    };
  }
}

/**
 * Create new company
 */
export async function createCompany(
  data: CompanyInput
): Promise<
  ActionResponse<{
    id: string;
    code: string;
    name: string;
    status: boolean;
  }>
> {
  try {
    // Validate input
    const validated = companySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    // Check if code already exists
    const existing = await prisma.company.findUnique({
      where: { code: validated.data.code },
    });

    if (existing) {
      return {
        success: false,
        error: `Kode perusahaan "${validated.data.code}" sudah digunakan`,
      };
    }

    // Create company
    const company = await prisma.company.create({
      data: validated.data,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
    });

    revalidatePath("/properties/companies");

    return { success: true, data: company };
  } catch (error) {
    console.error("[CREATE_COMPANY_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat perusahaan baru",
    };
  }
}

/**
 * Update existing company
 */
export async function updateCompany(
  id: string,
  data: CompanyInput
): Promise<
  ActionResponse<{
    id: string;
    code: string;
    name: string;
    status: boolean;
  }>
> {
  try {
    // Validate input
    const validated = companySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    // Check if company exists
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Perusahaan tidak ditemukan",
      };
    }

    // Check if code is taken by another company
    if (validated.data.code !== existing.code) {
      const codeExists = await prisma.company.findUnique({
        where: { code: validated.data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Kode perusahaan "${validated.data.code}" sudah digunakan`,
        };
      }
    }

    // Update company
    const company = await prisma.company.update({
      where: { id },
      data: validated.data,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
    });

    revalidatePath("/properties/companies");

    return { success: true, data: company };
  } catch (error) {
    console.error("[UPDATE_COMPANY_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui perusahaan",
    };
  }
}

/**
 * Delete company
 */
export async function deleteCompany(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!company) {
      return {
        success: false,
        error: "Perusahaan tidak ditemukan",
      };
    }

    // Check if company has related records
    if (company._count.userRoles > 0) {
      return {
        success: false,
        error: `Perusahaan tidak dapat dihapus karena masih memiliki ${company._count.userRoles} user terkait`,
      };
    }

    // Delete company
    await prisma.company.delete({
      where: { id },
    });

    revalidatePath("/properties/companies");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[DELETE_COMPANY_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus perusahaan",
    };
  }
}

/**
 * Toggle company status
 */
export async function toggleCompanyStatus(
  id: string
): Promise<
  ActionResponse<{
    id: string;
    status: boolean;
  }>
> {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!company) {
      return {
        success: false,
        error: "Perusahaan tidak ditemukan",
      };
    }

    const updated = await prisma.company.update({
      where: { id },
      data: { status: !company.status },
      select: {
        id: true,
        status: true,
      },
    });

    revalidatePath("/properties/companies");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[TOGGLE_COMPANY_STATUS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengubah status perusahaan",
    };
  }
}
