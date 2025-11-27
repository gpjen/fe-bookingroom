import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const issuerUrl = process.env.KEYCLOAK_ISSUER!;
    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const postLogoutRedirectUri = process.env.NEXTAUTH_URL!;

    const logoutUrl = new URL(`${issuerUrl}/protocol/openid-connect/logout`);
    
    // Add all common parameters for robustness
    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    logoutUrl.searchParams.set("client_id", clientId);
    
    // Re-add id_token_hint as it's often required by Keycloak for proper session invalidation
    if (session?.idToken) {
      logoutUrl.searchParams.set("id_token_hint", session.idToken);
    } else {
      // If idToken is somehow missing, log an error (shouldn't happen with correct auth.ts)
      console.error("idToken missing from session for logout request. This might cause Keycloak to reject the logout.");
    }

    return NextResponse.redirect(logoutUrl);
    
  } catch (error) {
    console.error("Error during logout:", error);
  }

  // Fallback redirect
  const fallbackUrl = new URL("/", process.env.NEXTAUTH_URL);
  return NextResponse.redirect(fallbackUrl);
}
