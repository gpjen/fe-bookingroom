"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ActionResponse } from "./booking.types";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ExportBookingsParams {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  buildingIds?: string[];
}

export async function exportBookingRequests(
  params: ExportBookingsParams
): Promise<ActionResponse<{ base64: string; filename: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // --- 1. BUILD QUERY (Copied logic from getAllBookings) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Filter by Status
    if (params.status && params.status !== "all") {
      where.status = params.status;
    }

    // Filter by Date (Check Header CheckIn)
    // Note: Ideally filter by Item Date, but for consistency with list view we filter by Request Date Range
    // The previous logic filtered by 'checkInDate' aggregate? 
    // Let's inspect getAllBookings implementation. It queries 'booking' model.
    // If we want accurate item filtering, we should filter items?
    // But request says "export request data". Usually we export Headers + Items.
    if (params.dateFrom || params.dateTo) {
         // Because Booking doesn't have master checkInDate column in schema (it's computed), 
         // we filter by CreatedAt or we filter by finding bookings that have items in range.
         // Let's stick to Creating Date or relevant range.
         // Wait, the list view shows 'checkInDate' which is MIN of items.
         // Prisma query in getAllBookings uses:
         /*
          where.requestItems = {
             some: {
                checkInDate: { gte: ... }
             }
          }
         */
         
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const itemDateFilter: any = {};
         if (params.dateFrom) itemDateFilter.checkInDate = { gte: params.dateFrom };
         if (params.dateTo) {
             // If we already have gte, we merge
             itemDateFilter.checkInDate = { 
                 ...itemDateFilter.checkInDate, 
                 lte: params.dateTo 
             };
         }
         
         if (Object.keys(itemDateFilter).length > 0) {
             where.requestItems = {
                 some: itemDateFilter
             };
         }
    }

    // Filter by Search
    if (params.search) {
      const searchTerm = params.search.trim();
      where.OR = [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { requesterName: { contains: searchTerm, mode: "insensitive" } },
        { purpose: { contains: searchTerm, mode: "insensitive" } },
        // Search in items too?
        {
            requestItems: {
                some: {
                    name: { contains: searchTerm, mode: "insensitive" }
                }
            }
        }
      ];
    }

    // Filter by Building Permission
    if (params.buildingIds && params.buildingIds.length > 0) {
      // Show bookings that have ANY item in allowed buildings
      // OR bookings where requester is the user? (Usually admin sees all in their building)
      where.requestItems = {
        some: {
            ...((where.requestItems?.some) || {}), // Merge with date filter above
            bed: {
                room: {
                    buildingId: { in: params.buildingIds }
                }
            }
        }
      };
    }

    // --- 2. FETCH DATA ---
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        requestItems: {
          include: {
            bed: {
              include: {
                room: {
                  include: { building: true }
                }
              }
            }
          },
          orderBy: { checkInDate: 'asc' }
        },
        occupancies: {
           // Include approved occupancies info if needed
           include: {
             bed: {
                include: {
                    room: {
                        include: { building: true }
                    }
                }
             }
           }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // --- 3. EXCEL GENERATION ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Booking System";
    const sheet = workbook.addWorksheet("Booking Requests");

    // Header Info
    sheet.mergeCells("A1:G1");
    sheet.getCell("A1").value = "LAPORAN PERMINTAAN BOOKING";
    sheet.getCell("A1").font = { size: 16, bold: true };
    
    sheet.mergeCells("A2:G2");
    const dateStr = params.dateFrom 
       ? `${format(params.dateFrom, "dd MMM yyyy", { locale: idLocale })} - ${params.dateTo ? format(params.dateTo, "dd MMM yyyy", { locale: idLocale }) : "Seterusnya"}`
       : "Semua Tanggal";
    sheet.getCell("A2").value = `Periode: ${dateStr}`;

    // Table Header
    const headers = [
      "No",
      "Kode Booking",
      "Tgl Request",
      "Pemohon",
      "Instansi Pemohon",
      "Tujuan",
      "Status Booking",
      // Detail Item
      "Nama Tamu",
      "Tipe",
      "NIK/ID",
      "Lokasi (Gedung - Kamar - Bed)",
      "Check In",
      "Check Out",
      "Status Item"
    ];

    sheet.getRow(4).values = headers;
    sheet.getRow(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B3442" } };
    sheet.getRow(4).alignment = { horizontal: "center", vertical: "middle" };

    sheet.columns = [
        { width: 5 },  // No
        { width: 18 }, // Kode
        { width: 15 }, // Tgl Request
        { width: 25 }, // Pemohon
        { width: 25 }, // Instansi
        { width: 30 }, // Tujuan
        { width: 15 }, // Status Booking
        { width: 25 }, // Nama Tamu
        { width: 12 }, // Tipe
        { width: 15 }, // NIK
        { width: 35 }, // Lokasi
        { width: 15 }, // Check In
        { width: 15 }, // Check Out
        { width: 15 }, // Status Item
    ];

    let currentRow = 5;
    let no = 1;

    bookings.forEach(booking => {
        // Prepare Header Data
        const headerData = {
            code: booking.code,
            date: format(booking.createdAt, "dd/MM/yyyy HH:mm"),
            requester: booking.requesterName,
            company: booking.requesterCompany || booking.requesterDepartment || "-",
            purpose: booking.purpose || "-",
            status: booking.status
        };

        // Determine items source. 
        // Logic: RequestItems contains the master plan. Occupancies contain approved execution.
        // For 'Request Export', we should show RequestItems primarily, and maybe showing their approval status.
        
        // However, if booking is APPROVED, requestItems might represent the initial request.
        // Let's use requestItems as the base rows because the User asked for "Export Permintaan".
        
        const items = booking.requestItems;

        if (items.length === 0) {
            // Case no items (should not happen usually)
            const row = sheet.getRow(currentRow);
            row.values = [
                no++,
                headerData.code,
                headerData.date,
                headerData.requester,
                headerData.company,
                headerData.purpose,
                headerData.status,
                "-", "-", "-", "-", "-", "-", "-"
            ];
            currentRow++;
        } else {
             items.forEach((item, index) => {
                 const row = sheet.getRow(currentRow);
                 
                 // For the first item, write header info. For subsequent, leave empty (or repeat?)
                 // Reporting standard usually repeats for filtering sort capability, or merge cells.
                 // Let's repeat for Excel "Table" friendliness, but visually we can merge if desired.
                 // I will fill all for valid filtering.
                 
                 const location = item.bed 
                    ? `${item.bed.room.building.name} - ${item.bed.room.code} - ${item.bed.code}`
                    : "Belum ditentukan";

                 let itemStatus = "PENDING";
                 if (item.approvedAt) itemStatus = "APPROVED";
                 if (item.rejectedAt) itemStatus = "REJECTED";
                 
                 row.values = [
                    index === 0 ? no++ : "", // Increment No only on new booking? No, No usually for Row. Let's make No is Booking No.
                    headerData.code,
                    headerData.date,
                    headerData.requester,
                    headerData.company,
                    headerData.purpose,
                    headerData.status,
                    item.name,
                    item.type === "EMPLOYEE" ? "Karyawan" : "Tamu",
                    item.nik || "-",
                    location,
                    format(item.checkInDate, "dd/MM/yyyy"),
                    format(item.checkOutDate, "dd/MM/yyyy"),
                    itemStatus
                 ];
                 
                 // Detail columns separate color/style optional
                 
                 currentRow++;
             });
        }
    });
    
    // Formatting Borders
    const lastRow = currentRow - 1;
    if (lastRow >= 5) {
        for(let r = 5; r <= lastRow; r++) {
            for(let c = 1; c <= 14; c++) {
                 const cell = sheet.getCell(r, c);
                 cell.border = {
                     top: { style: 'thin' },
                     left: { style: 'thin' },
                     bottom: { style: 'thin' },
                     right: { style: 'thin' }
                 };
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Booking_Requests_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;

    return { success: true, data: { base64, filename } };

  } catch (error) {
    console.error("[EXPORT_BOOKING_REQ_ERROR]", error);
    return { success: false, error: "Gagal export data" };
  }
}
