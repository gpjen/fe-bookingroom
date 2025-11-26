import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const issuer = process.env.KEYCLOAK_ISSUER!;
  const clientId = process.env.KEYCLOAK_CLIENT_ID!;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;
  const refreshToken = (session as any)?.refreshToken as string | undefined;

  if (refreshToken) {
    try {
      await fetch(`${issuer}/protocol/openid-connect/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      });
    } catch {}
  }
  return new NextResponse(null, { status: 204 });
}
