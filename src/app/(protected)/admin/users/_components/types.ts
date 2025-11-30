export interface User {
  id: string;
  name: string;
  nik: string;
  email: string;
  roles: string[]; // Role IDs
  companyAccess: string[]; // Company IDs
  buildingAccess: string[]; // Building IDs
  status: "active" | "inactive";
  lastLogin?: string;
  avatarUrl?: string;
}
