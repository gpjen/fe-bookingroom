"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Users,
  QrCode,
  RefreshCw,
  Download,
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { getColumns } from "./_components/columns";
import { OccupantFilters } from "./_components/occupant-filters";
import { OccupantDetailDialog } from "./_components/occupant-detail-dialog";
import { QrScannerDialog } from "./_components/qr-scanner-dialog";
import {
  MOCK_APPROVED_OCCUPANTS,
  BUILDINGS,
  type OccupantWithBooking,
} from "./_components/mock-data";

export default function OccupantStatusPage() {
  const [occupants, setOccupants] = useState<OccupantWithBooking[]>(
    MOCK_APPROVED_OCCUPANTS
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");

  // Dialog states
  const [selectedOccupant, setSelectedOccupant] =
    useState<OccupantWithBooking | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Filter occupants
  const filteredOccupants = useMemo(() => {
    return occupants.filter((occ) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        occ.name.toLowerCase().includes(searchLower) ||
        occ.bookingCode.toLowerCase().includes(searchLower) ||
        occ.identifier.toLowerCase().includes(searchLower) ||
        occ.requesterName.toLowerCase().includes(searchLower) ||
        (occ.buildingName?.toLowerCase() || "").includes(searchLower) ||
        (occ.roomCode?.toLowerCase() || "").includes(searchLower);

      const matchesStatus =
        statusFilter === "all" || occ.status === statusFilter;
      const matchesBuilding =
        buildingFilter === "all" || occ.buildingId === buildingFilter;

      return matchesSearch && matchesStatus && matchesBuilding;
    });
  }, [occupants, searchQuery, statusFilter, buildingFilter]);

  // Stats
  const stats = useMemo(() => {
    const scheduled = occupants.filter((o) => o.status === "scheduled").length;
    const checkedIn = occupants.filter((o) => o.status === "checked_in").length;
    const checkedOut = occupants.filter(
      (o) => o.status === "checked_out"
    ).length;
    return { scheduled, checkedIn, checkedOut, total: occupants.length };
  }, [occupants]);

  // Handlers
  const handleView = (occupant: OccupantWithBooking) => {
    setSelectedOccupant(occupant);
  };

  const handleCheckIn = (occupant: OccupantWithBooking) => {
    setOccupants((prev) =>
      prev.map((occ) =>
        occ.id === occupant.id
          ? { ...occ, status: "checked_in", actualCheckInAt: new Date() }
          : occ
      )
    );
    toast.success(`${occupant.name} berhasil check-in`, {
      description: `Ruangan ${occupant.roomCode}, Bed ${occupant.bedCode}`,
    });
    setSelectedOccupant(null);
  };

  const handleCheckOut = (occupant: OccupantWithBooking) => {
    setOccupants((prev) =>
      prev.map((occ) =>
        occ.id === occupant.id
          ? { ...occ, status: "checked_out", actualCheckOutAt: new Date() }
          : occ
      )
    );
    toast.success(`${occupant.name} berhasil check-out`, {
      description: `Ruangan ${occupant.roomCode}, Bed ${occupant.bedCode}`,
    });
    setSelectedOccupant(null);
  };

  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    setTimeout(() => {
      setOccupants(MOCK_APPROVED_OCCUPANTS);
      toast.success("Data berhasil dimuat ulang");
    }, 500);
  };

  const handleExport = () => {
    toast.success("Export dimulai", {
      description: `Mengekspor ${filteredOccupants.length} data penghuni`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setBuildingFilter("all");
    toast.info("Filter telah direset");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    buildingFilter !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const columns = getColumns({
    onView: handleView,
    onCheckIn: handleCheckIn,
    onCheckOut: handleCheckOut,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Status Penghuni
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola check-in dan check-out penghuni yang telah disetujui
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setScannerOpen(true)} className="gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>

          {/* Dev Tool: Download Mock QRs */}
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const QRCode = (await import("qrcode")).default;

                // Find candidates
                // 1. Scheduled Object (Ready to Check-in)
                const scheduled =
                  occupants.find((o) => o.id === "fixed-test-scheduled-id") ||
                  occupants.find((o) => o.status === "scheduled");
                // 2. Checked-In Object (Ready to Check-out)
                const checkedIn =
                  occupants.find((o) => o.id === "fixed-test-checked-in-id") ||
                  occupants.find((o) => o.status === "checked_in");
                // 3. Checked-In Object (Not Ready - Future Checkout)
                const future = occupants.find(
                  (o) => o.id === "fixed-test-future-checkout-id"
                );

                const targets = [scheduled, checkedIn, future].filter(
                  Boolean
                ) as OccupantWithBooking[];

                if (targets.length === 0) {
                  toast.error("Tidak ada data mock yang sesuai");
                  return;
                }

                toast.info(`Men-generate ${targets.length} QR Code test...`);

                // Generate and download
                for (const occ of targets) {
                  // QR Data is just the unique Occupant ID now
                  const qrData = occ.id;
                  const url = await QRCode.toDataURL(qrData, {
                    width: 400,
                    margin: 2,
                  });

                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `TEST-QR-${occ.status?.toUpperCase()}-${
                    occ.name
                  }.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Small delay between downloads
                  await new Promise((r) => setTimeout(r, 500));
                }

                toast.success("Berhasil download QR test");
              } catch (err) {
                console.error(err);
                toast.error("Gagal generate QR");
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Test QR
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Muat Ulang
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Terjadwal</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.checkedIn}</p>
              <p className="text-xs text-muted-foreground">Check-In</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.checkedOut}</p>
              <p className="text-xs text-muted-foreground">Check-Out</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Filters */}
          <OccupantFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            buildingFilter={buildingFilter}
            setBuildingFilter={setBuildingFilter}
            buildings={BUILDINGS}
            clearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Data Table */}
          <div className="">
            <DataTable columns={columns} data={filteredOccupants} />
          </div>
        </div>
      </Card>

      {/* Detail Dialog */}
      {selectedOccupant && (
        <OccupantDetailDialog
          occupant={selectedOccupant}
          onClose={() => setSelectedOccupant(null)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      )}

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        occupants={occupants}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />
    </div>
  );
}
