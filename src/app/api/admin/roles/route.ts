import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const items = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return Response.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const item = await prisma.role.create({
    data: { name: body.name, description: body.description },
  });
  return Response.json(item, { status: 201 });
}
