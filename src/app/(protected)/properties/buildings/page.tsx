import {
  getBuildings,
  getAreasForSelect,
  getBuildingTypesForSelect,
} from "./_actions/buildings.actions";
import { BuildingsPageClient } from "./_components/buildings-page-client";

// ========================================
// SERVER COMPONENT - DATA FETCHING
// ========================================

export default async function BuildingsPage() {
  // Fetch all data on server - no client-side fetching needed!
  const [buildingsResult, areasResult, buildingTypesResult] = await Promise.all(
    [getBuildings(), getAreasForSelect(), getBuildingTypesForSelect()]
  );

  return (
    <BuildingsPageClient
      initialBuildings={buildingsResult.success ? buildingsResult.data : []}
      initialAreas={areasResult.success ? areasResult.data : []}
      initialBuildingTypes={
        buildingTypesResult.success ? buildingTypesResult.data : []
      }
      initialError={!buildingsResult.success ? buildingsResult.error : null}
    />
  );
}
