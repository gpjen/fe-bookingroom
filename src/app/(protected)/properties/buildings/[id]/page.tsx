import { notFound } from "next/navigation";
import { getAllBuildingPageData } from "./_actions/building-detail.actions";
import { getRoomTypes } from "./_actions/room.actions";
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

  const result = await getAllBuildingPageData(id);

  if (!result.success) {
    return {
      title: "Gedung Tidak Ditemukan",
    };
  }

  return {
    title: `${result.data.detail.name} (${result.data.detail.code}) - Building Detail`,
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

  // Fetch all page data and room types in parallel
  const [buildingResult, roomTypesResult] = await Promise.all([
    getAllBuildingPageData(id),
    getRoomTypes(),
  ]);

  // If not found, show 404 page
  if (!buildingResult.success) {
    notFound();
  }

  const { detail, stats, floors, images } = buildingResult.data;
  const roomTypes = roomTypesResult.success ? roomTypesResult.data : [];

  // Pass all data to client component (no client-side fetching needed!)
  return (
    <BuildingDetailClient
      id={detail.id}
      code={detail.code}
      initialDetail={detail}
      initialStats={stats}
      initialFloors={floors}
      initialImages={images}
      roomTypes={roomTypes}
    />
  );
}
