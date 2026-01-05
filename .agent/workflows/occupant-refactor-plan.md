# Implementation Plan: Occupant Master Data Refactoring

## Overview

Refactoring dari embedded occupant fields di Occupancy ke master Occupant table.

## Schema Changes (DONE ✅)

- Created `Occupant` model (master data for people)
- Updated `Occupancy` to reference `occupantId` instead of embedded fields
- Added `occupant` relation to `User` model

## Files to Update

### Priority 1: Core Actions (Backend)

#### 1. `occupancy.actions.ts` - CRITICAL

Functions to update:

- [ ] `getBedsWithOccupancy` - Join Occupant ✅ (partial)
- [ ] `getActiveOccupancy` - Return occupant data via join
- [ ] `assignOccupant` - Create/find Occupant first, then create Occupancy
- [ ] `checkInOccupant` - No major changes needed
- [ ] `checkOutOccupant` - No major changes needed
- [ ] `transferOccupant` - Update bedId only (no new Occupancy record)
- [ ] `cancelOccupancy` - No major changes needed
- [ ] `getAvailableBedsForTransfer` - Join Occupant for gender check
- [ ] `getRoomHistory` - Join Occupant for log display

#### 2. `occupants.actions.ts`

- [ ] `buildWhereClause` - Search in Occupant table
- [ ] `buildOrderBy` - Order by Occupant fields
- [ ] `getOccupants` - Join Occupant data
- [ ] `getOccupantById` - Join Occupant data
- [ ] `getOccupantLogs` - Join Occupant data

#### 3. `transfer.actions.ts`

- [ ] `getBedsWithReservations` - Join Occupant for display
- [ ] `validateTransferDates` - No changes needed

### Priority 2: Types

#### 1. `occupancy.types.ts` ✅ DONE

- Updated OccupancyData to use occupant reference
- Updated ActiveOccupancyInfo to use occupant object
- Updated AssignOccupantInput schema
- Updated OccupancyLogData to use occupant

#### 2. `occupants.types.ts`

- [ ] Update OccupantListItem to use Occupant fields
- [ ] Update OccupantDetail to use Occupant fields

### Priority 3: UI Components

#### 1. `room-detail-sheet.tsx`

- [ ] Update bed card display to use occupancy.occupant.name
- [ ] Update assign form to search/select existing Occupant
- [ ] Update occupancy info display

#### 2. `occupants-client.tsx`

- [ ] Update table columns to use occupant.name, etc
- [ ] Update filters

#### 3. `occupant-detail-sheet.tsx`

- [ ] Update detail display to use Occupant fields

#### 4. `building-floors.tsx`

- [ ] Update room card to use occupant.name

### Priority 4: Seeds

#### 1. `seed-occupancy.ts`

- [ ] Create Occupant records first
- [ ] Reference occupantId when creating Occupancy

## Key Logic Changes

### assignOccupant Flow (NEW)

```
1. Input: bedId, occupantId? OR occupantNik + occupantName + ...
2. If occupantId provided:
   - Find existing Occupant
3. Else if occupantNik provided:
   - Try to find existing Occupant by NIK
   - If not found, create new Occupant
4. Validate: Occupant cannot have active stay in SAME area
5. Create Occupancy with occupantId
```

### transferOccupant Flow (NEW)

```
1. Find existing Occupancy
2. Update bedId to new bed (no new Occupancy!)
3. Update transfer fields
4. Create TRANSFERRED log
```

## Validation Rules-

1. Occupant.nik is UNIQUE
2. Occupant can have multiple active stays in DIFFERENT areas
3. Occupant CANNOT have 2+ active stays in SAME area
4. Gender policy still applies per Room
