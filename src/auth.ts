import type { NextAuthOptions, Account, TokenSet } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { getAccessForUsername } from "@/lib/auth/rbac";

function decodeJwtPayload(jwt?: string): any {
  if (!jwt) return undefined;
  const parts = jwt.split(".");
  if (parts.length < 2) return undefined;
  try {
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
}

async function refreshAccessToken(token: TokenSet): Promise<TokenSet> {
  try {
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
      }
    );

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in
      if (account) {
        const claims = decodeJwtPayload(account.id_token);
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          idToken: account.id_token,
          iat: claims?.iat,
          name: claims?.name,
          email: claims?.email,
          preferred_username: claims?.preferred_username,
          given_name: claims?.given_name,
        };
      }

      // If token is still valid, perform checks
      if (Date.now() < (token.expiresAt as number) * 1000) {
        // Daily re-login logic
        if (token.iat) {
          const issueDate = new Date((token.iat as number) * 1000);
          const currentDate = new Date();
          if (issueDate.toDateString() !== currentDate.toDateString()) {
            console.log(
              "JWT Callback: Daily re-login check failed. Invalidating session."
            );
            return { error: "RefreshAccessTokenError" }; // Invalidate: New day
          }
        }

        // Validate against userinfo endpoint
        if (token.accessToken) {
          const userinfoRes = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
            {
              headers: { Authorization: `Bearer ${token.accessToken}` },
            }
          );
          if (!userinfoRes.ok) {
            console.log(
              "JWT Callback: Userinfo check failed. Invalidating session."
            );
            return { error: "RefreshAccessTokenError" }; // Invalidate: User logged out from IdP
          }
        }
        console.log("JWT Callback: Token still valid and checks passed.");
        return token; // Token is valid
      }

      // Access token has expired, try to update it
      console.log("JWT Callback: Access token expired. Attempting refresh.");
      const refreshedToken = await refreshAccessToken(token as TokenSet);

      // If refresh fails, invalidate the session completely
      if (refreshedToken.error) {
        console.log(
          "JWT Callback: Token refresh failed. Invalidating session."
        );
        return { error: "RefreshAccessTokenError" };
      }

      return refreshedToken;
    },
    async session({ session, token }) {
      // If the token is empty or indicates an error, invalidate the session
      if (!token || token.error) {
        console.log(
          "Session Callback: Token is empty or has error. Invalidating session."
        );
        // Return an empty DefaultSession object to invalidate and satisfy TypeScript
        return { expires: new Date(0).toISOString() };
      }

      // Otherwise, populate the session object
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error; // Keep error if any

      session.user.name = token.name;
      session.user.email = token.email;
      session.user.username = token.preferred_username;
      session.user.given_name = token.given_name;

      const access = getAccessForUsername(token.preferred_username);
      session.user.appRoles = access.roles;
      session.user.permissions = access.permissions;
      session.user.companies = access.companies;

      console.log(
        "Session Callback: Final session object:",
        session?.user?.username,
        "-",
        session?.user?.given_name
      );
      return session;
    },
  },
};
