import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const issuerUrl = process.env.KEYCLOAK_ISSUER!;
    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const postLogoutRedirectUri = process.env.NEXTAUTH_URL!;

    const logoutUrl = new URL(`${issuerUrl}/protocol/openid-connect/logout`);

    const url = new URL(request.url);
    const lang = url.searchParams.get("lang");

    // Add all common parameters for robustness
    logoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      postLogoutRedirectUri
    );
    logoutUrl.searchParams.set("client_id", clientId);

    // Map lang to Keycloak locale
    if (lang === "zh") {
      logoutUrl.searchParams.set("kc_locale", "zh-CN");
    } else if (lang === "id") {
      logoutUrl.searchParams.set("kc_locale", "id");
    }

    // Re-add id_token_hint as it's often required by Keycloak for proper session invalidation
    if (session?.idToken) {
      logoutUrl.searchParams.set("id_token_hint", session.idToken);
    } else {
      // If idToken is somehow missing, log an error (shouldn't happen with correct auth.ts)
      console.error(
        "idToken missing from session for logout request. This might cause Keycloak to reject the logout."
      );
    }

    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error("Error during logout:", error);
  }

  // Fallback redirect
  const fallbackUrl = new URL("/", process.env.NEXTAUTH_URL);
  return NextResponse.redirect(fallbackUrl);
}
