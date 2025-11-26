import type { NextAuthOptions } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { getAccessForUsername } from "@/lib/auth/rbac";

function decodeJwtPayload(jwt?: string): any {
  if (!jwt) return undefined;
  const parts = jwt.split(".");
  if (parts.length < 2) return undefined;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: { params: { prompt: "login" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).refreshToken = account.refresh_token;
        (token as any).expiresAt = account.expires_at;
        (token as any).idToken = account.id_token;
        const claims = decodeJwtPayload(
          account.id_token || account.access_token
        );
        if (claims) {
          (token as any).preferred_username = claims.preferred_username;
          (token as any).given_name = claims.given_name;
          (token as any).email = claims.email;
          (token as any).realm_roles = claims.realm_access?.roles || [];
          (token as any).resource_access = claims.resource_access || {};
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).idToken = (token as any).idToken;
      (session as any).refreshToken = (token as any).refreshToken;
      session.user = { ...(session.user || {}) } as any;
      (session.user as any).username = (token as any).preferred_username;
      (session.user as any).given_name = (token as any).given_name;
      (session.user as any).email =
        (token as any).email || (session.user as any).email;
      const access = getAccessForUsername((token as any).preferred_username);
      (session.user as any).appRoles = access.roles;
      (session.user as any).permissions = access.permissions;
      (session.user as any).companies = access.companies;
      return session;
    },
  },
};
