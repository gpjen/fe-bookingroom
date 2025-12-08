import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      status: session ? "authenticated" : "unauthenticated",
      session,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
        ISSUER: process.env.KEYCLOAK_ISSUER,
      },
      headers: {
        host: process.env.HOSTNAME || "unknown",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
