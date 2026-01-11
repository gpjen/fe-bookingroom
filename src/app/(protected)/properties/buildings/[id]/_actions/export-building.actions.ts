"use server";

import { prisma } from "@/lib/db";
import { ActionResponse } from "./building-detail.schema";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Exports detailed building data to Excel
 * Returns a base64 string of the Excel file
 */
export async function exportBuildingData(
  buildingId: string
): Promise<ActionResponse<{ base64: string; filename: string }>> {
  try {
    // 1. Fetch Deep Data
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        area: true,
        rooms: {
          where: { deletedAt: null },
          orderBy: [{ floorNumber: "asc" }, { code: "asc" }],
          include: {
            roomType: true,
            beds: {
              where: { deletedAt: null },
              orderBy: { position: "asc" },
              include: {
                occupancies: {
                  where: {
                    status: { in: ["CHECKED_IN", "RESERVED"] },
                  },
                  include: {
                    occupant: true,
                  },
                },
                // Optional: Include pending requests if needed
                requestItems: {
                  where: {
                    booking: { status: "PENDING" },
                    checkOutDate: { gte: new Date() },
                  },
                  include: {
                    booking: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!building) {
      return { success: false, error: "Gedung tidak ditemukan" };
    }

    // 2. Setup Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Booking Room System";
    workbook.lastModifiedBy = "System";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Available Rooms", {
      views: [{ state: "frozen", ySplit: 5 }],
    });

    // 3. Header Information (Rows 1-4)
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = `LAPORAN STATUS GEDUNG: ${building.name.toUpperCase()}`;
    sheet.getCell("A1").font = { size: 16, bold: true };
    
    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = `Kode: ${building.code} | Area: ${building.area.name}`;
    
    sheet.mergeCells("A3:E3");
    const timestamp = format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale });
    sheet.getCell("A3").value = `Dicetak pada: ${timestamp}`;

    // 4. Table Columns (Row 5)
    // Columns Structure:
    // Floor | Room | Type | Bed | Status | Occupant Name | Type | Company | Check In | Check Out | Notes
    const headers = [
      "Lantai",
      "Ruangan",
      "Tipe Kamar",
      "Kode Bed",
      "Status",
      "Nama Penghuni",
      "Tipe Penghuni",
      "Instansi / Dept",
      "Check In",
      "Check Out",
      "Keterangan",
    ];

    sheet.getRow(5).values = headers;
    sheet.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(5).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2B3442" }, // Dark Slate
    };
    sheet.getRow(5).alignment = { horizontal: "center", vertical: "middle" };

    // Set Column Widths
    sheet.columns = [
      { width: 10 }, // Floor
      { width: 25 }, // Room
      { width: 20 }, // Type
      { width: 15 }, // Bed
      { width: 15 }, // Status
      { width: 30 }, // Occupant Name
      { width: 15 }, // Type
      { width: 25 }, // Company
      { width: 15 }, // Check In
      { width: 15 }, // Check Out
      { width: 30 }, // Notes
    ];

    // 5. Populate Data
    let currentRow = 6;
    let totalBeds = 0;
    let totalOccupied = 0;

    building.rooms.forEach((room) => {
      // Room Info
      const floor = `Lantai ${room.floorNumber}`;
      const roomLabel = `${room.code} - ${room.name}`;
      const roomType = room.roomType.name + (room.genderPolicy !== "MIX" && room.genderPolicy !== "FLEXIBLE" ? ` (${room.genderPolicy === "MALE_ONLY" ? "Pria" : "Wanita"})` : "");

      if (room.beds.length === 0) {
        // Room without beds
        const row = sheet.getRow(currentRow);
        row.values = [floor, roomLabel, roomType, "-", "No Beds", "-", "-", "-", "-", "-", "Room Kosong"];
        currentRow++;
      } else {
        // Loop Beds
        room.beds.forEach((bed) => {
          totalBeds++;
          
          let statusStr = "Available";
          if (room.status === "MAINTENANCE") statusStr = "Maintenance";

          const activeOccupancy = bed.occupancies[0]; // Priority 1: Occupied
          const pendingRequest = bed.requestItems[0]; // Priority 2: Pending Request

          let occupantName = "-";
          let occupantType = "-";
          let company = "-";
          let checkInStr = "-";
          let checkOutStr = "-";
          let notes = bed.notes || "";

          // Styling for status
          let statusColor = "FF22C55E"; // Green (Available)

          if (activeOccupancy) {
            totalOccupied++;
            statusStr = activeOccupancy.status === "CHECKED_IN" ? "Occupied" : "Reserved";
            statusColor = "FF3B82F6"; // Blue (Occupied)
            if (activeOccupancy.status === "RESERVED") statusColor = "FFF59E0B"; // Orange

            occupantName = activeOccupancy.occupant.name;
            occupantType = activeOccupancy.occupant.type === "EMPLOYEE" ? "Karyawan" : "Tamu";
            
            const compName = activeOccupancy.occupant.company || "";
            const deptName = activeOccupancy.occupant.department || "";
            
            if (compName && deptName) {
              company = `${compName} - ${deptName}`;
            } else {
              company = compName || deptName || "-";
            }
            
            checkInStr = format(activeOccupancy.checkInDate, "dd/MM/yyyy");
            checkOutStr = activeOccupancy.checkOutDate 
              ? format(activeOccupancy.checkOutDate, "dd/MM/yyyy")
              : "Ongoing";
            
          } else if (pendingRequest) {
             // Show info that there is a pending request, but status remains 'Available' or maybe 'Requested'
             notes = `[REQ] ${pendingRequest.name} (${format(pendingRequest.checkInDate, "dd/MM")})`;
          }

          const row = sheet.getRow(currentRow);
          row.values = [
            floor,
            roomLabel,
            roomType,
            bed.code,
            statusStr,
            occupantName,
            occupantType,
            company,
            checkInStr,
            checkOutStr,
            notes
          ];

          // Center alignment for some columns
          ["A", "C", "D", "E", "G", "I", "J"].forEach(col => {
             sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: "center" };
          });
          
          // Color text for status
          sheet.getCell(`E${currentRow}`).font = { color: { argb: statusColor }, bold: true };

          currentRow++;
        });
      }
    });

    // Add Summary at the bottom
    currentRow += 2;
    sheet.getCell(`B${currentRow}`).value = "RINGKASAN";
    sheet.getCell(`B${currentRow}`).font = { bold: true };
    
    currentRow++;
    sheet.getCell(`B${currentRow}`).value = "Total Kamar";
    sheet.getCell(`C${currentRow}`).value = building.rooms.length;
    
    currentRow++;
    sheet.getCell(`B${currentRow}`).value = "Total Bed";
    sheet.getCell(`C${currentRow}`).value = totalBeds;
    
    currentRow++;
    sheet.getCell(`B${currentRow}`).value = "Bed Terisi / Reserved";
    sheet.getCell(`C${currentRow}`).value = totalOccupied;
    
    currentRow++;
    sheet.getCell(`B${currentRow}`).value = "Occupancy Rate";
    const rate = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : "0";
    sheet.getCell(`C${currentRow}`).value = `${rate}%`;


    // 6. Border Styling
    // Apply borders to the main table
    const tableEndRow = currentRow - 6; // Back to last data row
    for(let r = 5; r <= tableEndRow; r++) {
       for(let c = 1; c <= headers.length; c++) {
          const char = String.fromCharCode(64 + c); // A, B, C... (works for < 27 cols)
          sheet.getCell(`${char}${r}`).border = {
             top: { style: 'thin' },
             left: { style: 'thin' },
             bottom: { style: 'thin' },
             right: { style: 'thin' }
          };
       }
    }

    // 7. Write to Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Laporan_Gedung_${building.code}_${format(new Date(), "yyyyMMdd")}.xlsx`;

    return {
      success: true,
      data: {
        base64,
        filename,
      },
    };
  } catch (error) {
    console.error("[EXPORT_BUILDING_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengekspor data gedung",
    };
  }
}
