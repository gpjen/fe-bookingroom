import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

export type Permission = string;

export type Role = {
  name: string;
  permissions: Permission[];
};

export type Company = {
  id: string;
  name: string;
};

export type UserAccess = {
  userId: string;
  roles: string[];
  explicitPermissions?: Permission[];
  companies: string[];
};

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    error?: "RefreshAccessTokenError";
    user: {
      username?: string;
      given_name?: string;
      appRoles?: string[];
      permissions?: Permission[];
      companies?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
    preferred_username?: string;
    given_name?: string;
  }
}