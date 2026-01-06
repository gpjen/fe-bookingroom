"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  ActionResponse,
  EmployeeSearchResult,
  IAMPortalResponse,
} from "./types";

// ========================================
// CONSTANTS
// ========================================

const IAM_API_URL = process.env.IAM_PORTAL_API_URL;
const IAM_TIMEOUT = parseInt(process.env.IAM_API_TIMEOUT || "5000", 10);

// ========================================
// HELPER: Search from IAM Portal API
// ========================================

async function searchFromIAM(
  nik: string,
  accessToken: string
): Promise<EmployeeSearchResult | null> {
  if (!IAM_API_URL) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IAM_TIMEOUT);

    const iamResponse = await fetch(
      `${IAM_API_URL}/iam/search-users/${encodeURIComponent(nik)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (iamResponse.ok) {
      const iamData: IAMPortalResponse = await iamResponse.json();

      if (iamData.status === "success" && iamData.data?.length > 0) {
        const employee = iamData.data[0];
        return {
          found: true,
          source: "iam",
          data: {
            nik: employee.username.toUpperCase(),
            name: employee.name,
            email: employee.email || null,
            phone: employee.phone_number || null,
            company: employee.company || null,
            department:
              employee.organization_name || employee.section || null,
            gender: null, // IAM doesn't return gender
            type: "EMPLOYEE", // From IAM = always employee
          },
        };
      }
    }
  } catch (error) {
    console.warn("[IAM Search] Failed:", error);
  }

  return null;
}

// ========================================
// HELPER: Search from Local Occupant DB
// ========================================

async function searchFromLocal(
  nik: string,
  occupantType?: "EMPLOYEE" | "GUEST"
): Promise<EmployeeSearchResult | null> {
  try {
    const localOccupant = await prisma.occupant.findFirst({
      where: {
        nik: { equals: nik, mode: "insensitive" }, // Case insensitive
        deletedAt: null,
        // Filter by type if specified
        ...(occupantType && { type: occupantType }),
      },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        department: true,
        gender: true,
        type: true,
      },
    });

    if (localOccupant) {
      return {
        found: true,
        source: "local",
        data: {
          nik: localOccupant.nik || nik.toUpperCase(),
          name: localOccupant.name,
          email: localOccupant.email || null,
          phone: localOccupant.phone || null,
          company: localOccupant.company || null,
          department: localOccupant.department || null,
          gender: localOccupant.gender as "MALE" | "FEMALE" | null,
          type: localOccupant.type as "EMPLOYEE" | "GUEST" | null,
        },
      };
    }
  } catch (error) {
    console.error("[Local Search] Database error:", error);
  }

  return null;
}

// ========================================
// SEARCH EMPLOYEE BY NIK
// ========================================

/**
 * Search employee/guest by NIK/username.
 * 
 * Search behavior based on occupantType:
 * - EMPLOYEE: Search IAM first, fallback to local
 * - GUEST: Search local first, fallback to IAM
 * 
 * @param nik - NIK or username to search (case insensitive)
 * @param occupantType - Type of occupant (EMPLOYEE or GUEST)
 * @returns EmployeeSearchResult with source indication
 */
export async function searchEmployeeByNIK(
  nik: string,
  occupantType: "EMPLOYEE" | "GUEST" = "EMPLOYEE"
): Promise<ActionResponse<EmployeeSearchResult>> {
  // Validate input
  if (!nik || nik.trim().length < 5) {
    return { success: false, error: "NIK minimal 5 karakter" };
  }

  const normalizedNik = nik.trim();

  // Get session & token
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  let result: EmployeeSearchResult | null = null;

  if (occupantType === "EMPLOYEE") {
    // =====================================
    // EMPLOYEE: Search IAM first, then local
    // =====================================
    
    // Step 1: Search from IAM
    result = await searchFromIAM(normalizedNik, session.accessToken as string);
    
    // Step 2: If not found in IAM, search local
    if (!result) {
      result = await searchFromLocal(normalizedNik, "EMPLOYEE");
    }
  } else {
    // =====================================
    // GUEST: Search local first, then IAM (for edge cases)
    // =====================================
    
    // Step 1: Search from local (as GUEST)
    result = await searchFromLocal(normalizedNik, "GUEST");
    
    // Step 2: If not found, try local without type filter
    if (!result) {
      result = await searchFromLocal(normalizedNik);
    }
  }

  // Return result or not found
  if (result) {
    return { success: true, data: result };
  }

  return {
    success: true,
    data: {
      found: false,
      source: null,
      data: null,
    },
  };
}
