export type Permission = string

export type Role = {
  name: string
  permissions: Permission[]
}

export type Company = {
  id: string
  name: string
}

export type UserAccess = {
  userId: string
  roles: string[]
  explicitPermissions?: Permission[]
  companies: string[]
}

