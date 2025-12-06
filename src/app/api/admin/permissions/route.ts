import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";
import { checkApiPermission } from "@/lib/auth/api-guard";

export async function GET() {
  const permCheck = await checkApiPermission("admin-roles:read");
  if (permCheck.error) return permCheck.error;

  const items = await prisma.permission.findMany({ orderBy: { key: "asc" } });
  return Response.json(items);
}

export async function POST(req: Request) {
  const permCheck = await checkApiPermission("admin-roles:write");
  if (permCheck.error) return permCheck.error;

  const body = await req.json();
  const item = await prisma.permission.create({
    data: { key: body.key, description: body.description },
  });
  return Response.json(item, { status: 201 });
}
