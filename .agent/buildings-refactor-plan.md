# Buildings CRUD Refactoring Plan

## Current State Analysis:

- ❌ Using mock data (MOCK_AREAS, MOCK_BUILDING_TYPES, initialData)
- ❌ Client-side state management only
- ❌ No server actions
- ❌ Page reloads on CRUD causing filter/pagination reset

## Target State:

- ✅ Server-side data from database
- ✅ Server actions for CRUD
- ✅ Optimistic updates (no page reload)
- ✅ Preserve filter & pagination state

## Implementation Steps:

### 1. Create Server Actions (\_actions/buildings.actions.ts)

Functions needed:

- `getBuildings()` - Fetch all buildings with relations
- `getBuildingById(id)` - Fetch single building
- `createBuilding(data)` - Create new building
- `updateBuilding(id, data)` - Update existing
- `deleteBuilding(id)` - Soft delete building
- `getDataForBuildingsPage()` - Get buildings + master data (areas, types) in one call

### 2. Update Buildings Page

- Remove all MOCK data
- Implement fetchData(showLoading) pattern like users page
- Use useEffect for initial load
- Update CRUD handlers to use fetchData(false)
- Preserve table state on refresh

### 3. Update Form Component

- Remove mock data props
- Receive master data (areas, types) from parent
- Keep validation logic

### 4. Database Check

Verify schema has:

- Building model
- Relations to Area, BuildingType
- Soft delete support (deletedAt, deletedBy)

## Files to Create/Modify:

- CREATE: src/app/(protected)/properties/buildings/\_actions/buildings.actions.ts
- MODIFY: src/app/(protected)/properties/buildings/page.tsx
- MODIFY: src/app/(protected)/properties/buildings/\_components/form-buildings.tsx

## Success Criteria:

✅ No mock data
✅ Data loaded from database
✅ CRUD operations via server actions
✅ Filter & pagination preserved after CRUD
✅ No full page reload
✅ Loading states handled properly
