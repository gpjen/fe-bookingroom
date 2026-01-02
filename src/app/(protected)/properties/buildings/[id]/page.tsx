import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BuildingDetailClient } from "./_components/building-detail-client";

// ========================================
// METADATA
// ========================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const building = await prisma.building.findUnique({
    where: { id },
    select: { name: true, code: true },
  });

  if (!building) {
    return {
      title: "Gedung Tidak Ditemukan",
    };
  }

  return {
    title: `${building.name} (${building.code}) - Building Detail`,
  };
}

// ========================================
// SERVER COMPONENT - DATA FETCHING
// ========================================

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if building exists
  const building = await prisma.building.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  // If not found, show 404 page
  if (!building) {
    notFound();
  }

  // Pass building info to client component for breadcrumb context
  return <BuildingDetailClient id={building.id} code={building.code} />;
}
