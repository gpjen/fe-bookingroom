import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username') || undefined
  const items = await prisma.userRole.findMany({ where: { username }, include: { role: true, company: true } })
  return Response.json(items)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  
  const body = await req.json();
  
  const item = await prisma.userRole.create({
    data: {
      username: body.username,
      usernameKey: body.username.toLowerCase(),
      displayName: body.displayName || body.username,
      email: body.email || "",
      roleId: body.roleId,
      companyId: body.companyId,
    },
  });
  
  return Response.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const body = await req.json()
  await prisma.userRole.delete({ where: { id: body.id } })
  return new Response(null, { status: 204 })
}

