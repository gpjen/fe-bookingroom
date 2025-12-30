import type { NextAuthOptions, TokenSet } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

function decodeJwtPayload(jwt?: string): Record<string, unknown> | undefined {
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
    // If no refresh token, return error immediately
    if (!token.refreshToken) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

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
    
    if (!response.ok) {
      // Check if error is due to invalid/expired refresh token (user logged out)
      if (refreshedTokens.error === "invalid_grant") {
        // Silent fail - token is inactive (user logged out from Keycloak)
        return { ...token, error: "RefreshAccessTokenError" };
      }
      
      // Log other errors for debugging
      console.error("Error refreshing access token:", refreshedTokens);
      throw refreshedTokens;
    }

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
  // @ts-expect-error - trustHost is valid in runtime but missing in type definition in some versions
  trustHost: true,
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

      // If token has error, return it immediately
      if (token.error) {
        return token;
      }

      // ========================================
      // STEP 1: CHECK IF TOKEN NEEDS REFRESH
      // ========================================
      
      const tokenExpired = Date.now() >= (token.expiresAt as number) * 1000;

      if (tokenExpired) {
        // Access token has expired, try to refresh
        const refreshedToken = await refreshAccessToken(token as TokenSet);

        // If refresh fails, invalidate the session
        if (refreshedToken.error) {
          return { error: "RefreshAccessTokenError" };
        }

        // Return refreshed token (skip validation for now)
        return refreshedToken;
      }

      // ========================================
      // STEP 2: TOKEN IS VALID - PERFORM CHECKS
      // ========================================

      // Daily re-login logic (optional security measure)
      if (token.iat) {
        const issueDate = new Date((token.iat as number) * 1000);
        const currentDate = new Date();
        if (issueDate.toDateString() !== currentDate.toDateString()) {
          // New day detected - force re-login
          return { error: "RefreshAccessTokenError" };
        }
      }

      // ========================================
      // STEP 3: PERIODIC SESSION VALIDATION WITH KEYCLOAK
      // ========================================
      
      // Check every 15 minutes if session is still valid in Keycloak
      const now = Date.now();
      const lastValidation = (token.lastValidation as number) || 0;
      const validationInterval = 15 * 60 * 1000; // 15 minutes (increased from 5)

      if (now - lastValidation > validationInterval) {
        try {
          // Call Keycloak userinfo to validate session
          const response = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            // Session is invalid (admin logged out user from Keycloak)
            console.log("Session invalidated by Keycloak - forcing logout");
            return { error: "RefreshAccessTokenError" };
          }

          // Session is valid - update last validation time
          token.lastValidation = now;
        } catch (error) {
          // On validation error, don't force logout - just log it
          console.warn("Error validating session with Keycloak:", error);
          // Continue with current token
        }
      }

      // Token is valid
      return token;
    },
    async session({ session, token }) {
      // If the token is empty or indicates an error, invalidate the session
      if (!token || token.error) {
        return { expires: new Date(0).toISOString() };
      }

      // Populate the session object
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error;

      session.user.name = token.name;
      session.user.email = token.email;
      session.user.username = token.preferred_username;
      session.user.given_name = token.given_name;

      return session;
    },
  },
};
