-- CreateEnum
CREATE TYPE "OccupantType" AS ENUM ('EMPLOYEE', 'GUEST');

-- CreateEnum
CREATE TYPE "AllowedOccupantType" AS ENUM ('EMPLOYEE_ONLY', 'ALL');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "GenderPolicy" AS ENUM ('MALE_ONLY', 'FEMALE_ONLY', 'MIX', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('PENDING', 'RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "OccupancyLogAction" AS ENUM ('CREATED', 'CHECKED_IN', 'DATE_CHANGED', 'TRANSFERRED', 'EARLY_CHECKOUT', 'CHECKED_OUT', 'CANCELLED', 'STATUS_CHANGED');

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "address" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "building_images" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL DEFAULT 1,
    "floorName" TEXT,
    "description" TEXT,
    "allowedOccupantType" "AllowedOccupantType" NOT NULL DEFAULT 'ALL',
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "genderPolicy" "GenderPolicy" NOT NULL DEFAULT 'MIX',
    "currentGender" TEXT,
    "pricePerBed" DECIMAL(12,2),
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_images" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "bedType" TEXT,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterNik" TEXT,
    "requesterEmail" TEXT,
    "requesterPhone" TEXT,
    "requesterCompany" TEXT,
    "requesterDepartment" TEXT,
    "requesterPosition" TEXT,
    "companionUserId" TEXT,
    "companionName" TEXT,
    "companionNik" TEXT,
    "companionEmail" TEXT,
    "companionPhone" TEXT,
    "companionCompany" TEXT,
    "companionDepartment" TEXT,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "purpose" TEXT,
    "projectCode" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_attachments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancies" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "bedId" TEXT NOT NULL,
    "occupantType" "OccupantType" NOT NULL,
    "occupantUserId" TEXT,
    "occupantName" TEXT NOT NULL,
    "occupantNik" TEXT,
    "occupantGender" "Gender" NOT NULL,
    "occupantPhone" TEXT,
    "occupantEmail" TEXT,
    "occupantCompany" TEXT,
    "occupantDepartment" TEXT,
    "occupantPosition" TEXT,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "originalCheckOutDate" DATE,
    "actualCheckIn" TIMESTAMP(3),
    "actualCheckOut" TIMESTAMP(3),
    "status" "OccupancyStatus" NOT NULL DEFAULT 'PENDING',
    "qrCode" TEXT,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "transferredFromBedId" TEXT,
    "transferReason" TEXT,
    "transferredAt" TIMESTAMP(3),
    "transferredBy" TEXT,
    "transferredByName" TEXT,
    "checkoutReason" TEXT,
    "checkoutBy" TEXT,
    "checkoutByName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancy_logs" (
    "id" TEXT NOT NULL,
    "occupancyId" TEXT NOT NULL,
    "action" "OccupancyLogAction" NOT NULL,
    "fromBedId" TEXT,
    "toBedId" TEXT,
    "previousCheckInDate" DATE,
    "newCheckInDate" DATE,
    "previousCheckOutDate" DATE,
    "newCheckOutDate" DATE,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "occupancy_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "building_images_buildingId_idx" ON "building_images"("buildingId");

-- CreateIndex
CREATE INDEX "building_images_isPrimary_idx" ON "building_images"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_buildingId_idx" ON "rooms"("buildingId");

-- CreateIndex
CREATE INDEX "rooms_buildingId_floorNumber_idx" ON "rooms"("buildingId", "floorNumber");

-- CreateIndex
CREATE INDEX "rooms_roomTypeId_idx" ON "rooms"("roomTypeId");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_allowedOccupantType_idx" ON "rooms"("allowedOccupantType");

-- CreateIndex
CREATE INDEX "rooms_isBookable_idx" ON "rooms"("isBookable");

-- CreateIndex
CREATE INDEX "room_images_roomId_idx" ON "room_images"("roomId");

-- CreateIndex
CREATE INDEX "room_images_isPrimary_idx" ON "room_images"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "beds_code_key" ON "beds"("code");

-- CreateIndex
CREATE INDEX "beds_roomId_idx" ON "beds"("roomId");

-- CreateIndex
CREATE INDEX "beds_status_idx" ON "beds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_code_idx" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_requesterUserId_idx" ON "bookings"("requesterUserId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_checkInDate_idx" ON "bookings"("checkInDate");

-- CreateIndex
CREATE INDEX "bookings_checkOutDate_idx" ON "bookings"("checkOutDate");

-- CreateIndex
CREATE INDEX "booking_attachments_bookingId_idx" ON "booking_attachments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "occupancies_qrCode_key" ON "occupancies"("qrCode");

-- CreateIndex
CREATE INDEX "occupancies_bookingId_idx" ON "occupancies"("bookingId");

-- CreateIndex
CREATE INDEX "occupancies_bedId_idx" ON "occupancies"("bedId");

-- CreateIndex
CREATE INDEX "occupancies_occupantType_idx" ON "occupancies"("occupantType");

-- CreateIndex
CREATE INDEX "occupancies_occupantUserId_idx" ON "occupancies"("occupantUserId");

-- CreateIndex
CREATE INDEX "occupancies_occupantNik_idx" ON "occupancies"("occupantNik");

-- CreateIndex
CREATE INDEX "occupancies_status_idx" ON "occupancies"("status");

-- CreateIndex
CREATE INDEX "occupancies_checkInDate_idx" ON "occupancies"("checkInDate");

-- CreateIndex
CREATE INDEX "occupancies_checkOutDate_idx" ON "occupancies"("checkOutDate");

-- CreateIndex
CREATE INDEX "occupancy_logs_occupancyId_idx" ON "occupancy_logs"("occupancyId");

-- CreateIndex
CREATE INDEX "occupancy_logs_action_idx" ON "occupancy_logs"("action");

-- CreateIndex
CREATE INDEX "occupancy_logs_performedAt_idx" ON "occupancy_logs"("performedAt");

-- AddForeignKey
ALTER TABLE "building_images" ADD CONSTRAINT "building_images_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_attachments" ADD CONSTRAINT "booking_attachments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancies" ADD CONSTRAINT "occupancies_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancies" ADD CONSTRAINT "occupancies_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "beds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_logs" ADD CONSTRAINT "occupancy_logs_occupancyId_fkey" FOREIGN KEY ("occupancyId") REFERENCES "occupancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
