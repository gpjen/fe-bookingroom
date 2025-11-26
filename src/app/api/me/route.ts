import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken;
  return Response.json({
    user: session.user,
    hasAccessToken: Boolean(accessToken),
  });
}
