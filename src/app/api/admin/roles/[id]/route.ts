import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const item = await prisma.role.findUnique({ where: { id: params.id } });
  if (!item) return new Response("Not Found", { status: 404 });
  return Response.json(item);
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const item = await prisma.role.update({
    where: { id: params.id },
    data: { name: body.name, description: body.description },
  });
  return Response.json(item);
}

export async function DELETE(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  await prisma.role.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
