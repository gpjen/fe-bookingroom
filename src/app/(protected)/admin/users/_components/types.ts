export interface User {
  id: string;
  username: string; // NIK is stored here
  displayName: string;
  email: string;
  status: boolean;
  lastLogin: Date | null;
  // ⭐ Audit Trail
  createdBy: string | null;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
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
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface Company {
  id: string;
  code: string;
  name: string;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  areaId: string;
}
