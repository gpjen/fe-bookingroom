// ========================================
// IAM EMPLOYEE SEARCH TYPES
// ========================================

/**
 * Response from Portal IAM API
 */
export interface IAMPortalResponse {
  status: "success" | "error";
  data: IAMPortalEmployee[];
  message?: string;
}

export interface IAMPortalEmployee {
  username: string;
  email: string | null;
  phone_number: string | null;
  name: string;
  organization_name: string | null;
  section: string | null;
  unit: string | null;
  company: string | null;
}

/**
 * Unified employee data format
 */
export interface EmployeeData {
  nik: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  department: string | null;
  gender: "MALE" | "FEMALE" | null;
  type: "EMPLOYEE" | "GUEST" | null;
}

/**
 * Search result with source indication
 */
export interface EmployeeSearchResult {
  found: boolean;
  source: "iam" | "local" | null;
  data: EmployeeData | null;
}

/**
 * Generic action response
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
