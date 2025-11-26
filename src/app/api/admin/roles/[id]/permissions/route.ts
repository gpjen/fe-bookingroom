import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const keys: string[] = Array.isArray(body.keys) ? body.keys : [];
  const perms = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true },
  });
  const data = perms.map(({ id }: { id: string }) => ({
    roleId: params.id,
    permissionId: id,
  }));
  if (data.length === 0) {
    await prisma.rolePermission.deleteMany({ where: { roleId: params.id } });
    return new Response(null, { status: 204 });
  }
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: params.id } }),
    prisma.rolePermission.createMany({ data, skipDuplicates: true }),
  ]);
  return new Response(null, { status: 204 });
}
