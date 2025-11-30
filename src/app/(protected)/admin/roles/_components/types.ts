export interface Permission {
  id: string;
  name: string; // e.g., "admin:read"
  group: string; // e.g., "Administration"
  guard_name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // List of permission IDs
  userCount: number;
  isSystem?: boolean;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}
