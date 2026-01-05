"use client";

import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PaginatedResult,
  OccupantListItem,
  OccupantStats,
  FilterOptions,
} from "../_actions/occupants.types";
import { getOccupants, getOccupantStats } from "../_actions/occupants.actions";
import { getColumns } from "./columns";
import {
  OccupantsFilters,
  FilterState,
  defaultFilters,
} from "./occupants-filters";
import { OccupantDetailSheet } from "./occupant-detail-sheet";
import { OccupantStatsCards } from "./occupant-stats";
import { QrScannerDialog } from "./qr-scanner-dialog";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

// ========================================
// PROPS
// ========================================

interface OccupantsClientProps {
  initialData: PaginatedResult<OccupantListItem>;
  initialStats: OccupantStats;
  filterOptions: FilterOptions;
}

// ========================================
// MAIN CLIENT COMPONENT
// ========================================

export function OccupantsClient({
  initialData,
  initialStats,
  filterOptions,
}: OccupantsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [data, setData] = useState(initialData);
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Detail sheet state
  const [selectedOccupant, setSelectedOccupant] =
    useState<OccupantListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // QR Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);

  // Debounce ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse initial filters from URL
  const initialFilters = useMemo((): FilterState => {
    return {
      search: searchParams.get("search") || "",
      status: (searchParams.get("status") as FilterState["status"]) || "all",
      occupantType:
        (searchParams.get("type") as FilterState["occupantType"]) || "all",
      gender: (searchParams.get("gender") as FilterState["gender"]) || "all",
      buildingId: searchParams.get("building") || "all",
      areaId: searchParams.get("area") || "all",
      hasBooking:
        (searchParams.get("booking") as FilterState["hasBooking"]) || "all",
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 20
  );

  // Build query string from filters
  const buildQuery = useCallback((f: FilterState, p: number, ps: number) => {
    const params = new URLSearchParams();
    if (f.search) params.set("search", f.search);
    if (f.status !== "all") params.set("status", f.status);
    if (f.occupantType !== "all") params.set("type", f.occupantType);
    if (f.gender !== "all") params.set("gender", f.gender);
    if (f.buildingId !== "all") params.set("building", f.buildingId);
    if (f.areaId !== "all") params.set("area", f.areaId);
    if (f.hasBooking !== "all") params.set("booking", f.hasBooking);
    if (p > 1) params.set("page", String(p));
    if (ps !== 20) params.set("pageSize", String(ps));
    return params.toString();
  }, []);

  // Fetch data
  const fetchData = useCallback(
    async (f: FilterState, p: number, ps: number, updateUrl = true) => {
      setIsLoading(true);

      try {
        const result = await getOccupants(
          {
            search: f.search || undefined,
            status: f.status !== "all" ? [f.status] : undefined,
            occupantType: f.occupantType !== "all" ? f.occupantType : undefined,
            gender: f.gender !== "all" ? f.gender : undefined,
            buildingId: f.buildingId !== "all" ? f.buildingId : undefined,
            areaId: f.areaId !== "all" ? f.areaId : undefined,
            hasBooking:
              f.hasBooking === "true"
                ? true
                : f.hasBooking === "false"
                ? false
                : undefined,
          },
          { field: "createdAt", direction: "desc" },
          p,
          ps
        );

        if (result.success) {
          setData(result.data);
        } else {
          toast.error(result.error);
        }

        // Update URL without reload
        if (updateUrl) {
          const query = buildQuery(f, p, ps);
          router.replace(`${pathname}${query ? `?${query}` : ""}`, {
            scroll: false,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data");
      } finally {
        setIsLoading(false);
      }
    },
    [router, pathname, buildQuery]
  );

  // Refresh stats
  const refreshStats = useCallback(async () => {
    const result = await getOccupantStats();
    if (result.success) {
      setStats(result.data);
    }
  }, []);

  // Handle filter change with debounce for search
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page

      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // If only search changed, debounce
      const isOnlySearchChange =
        newFilters.status === filters.status &&
        newFilters.occupantType === filters.occupantType &&
        newFilters.gender === filters.gender &&
        newFilters.buildingId === filters.buildingId &&
        newFilters.areaId === filters.areaId &&
        newFilters.hasBooking === filters.hasBooking;

      if (isOnlySearchChange && newFilters.search !== filters.search) {
        searchTimeoutRef.current = setTimeout(() => {
          fetchData(newFilters, 1, pageSize);
        }, 300);
      } else {
        fetchData(newFilters, 1, pageSize);
      }
    },
    [filters, pageSize, fetchData]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchData(filters, newPage, pageSize);
    },
    [filters, pageSize, fetchData]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (newSize: string) => {
      const size = Number(newSize);
      setPageSize(size);
      setPage(1);
      fetchData(filters, 1, size);
    },
    [filters, fetchData]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchData(filters, page, pageSize);
      refreshStats();
    });
    toast.info("Memuat ulang data...");
  }, [filters, page, pageSize, fetchData, refreshStats]);

  // Handle view detail
  const handleView = useCallback((occupant: OccupantListItem) => {
    setSelectedOccupant(occupant);
    setDetailOpen(true);
  }, []);

  // Handle update from detail sheet
  const handleUpdate = useCallback(() => {
    // Refresh data after action (optimistic update would go here)
    fetchData(filters, page, pageSize);
    refreshStats();
  }, [filters, page, pageSize, fetchData, refreshStats]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Table setup
  const columns = useMemo(
    () =>
      getColumns({
        onView: handleView,
        onCheckIn: handleView, // Open detail sheet for check-in
        onCheckOut: handleView, // Open detail sheet for check-out
        onTransfer: handleView, // Open detail sheet for transfer
      }),
    [handleView]
  );

  const table = useReactTable({
    data: data.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data.pagination.totalPages,
  });

  const isLoadingState = isLoading || isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Penghuni
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data penghuni dari semua bangunan dan area
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setScannerOpen(true)}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
          >
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingState}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoadingState ? "animate-spin" : ""}`}
            />
            Muat Ulang
          </Button>
          <Button variant="outline" size="sm" disabled={isLoadingState}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <OccupantStatsCards stats={stats} isLoading={isLoadingState} />

      {/* Main Content */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Filters */}
          <OccupantsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={isLoadingState}
          />

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center"
                    >
                      <div className="text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada data penghuni</p>
                        {(filters.search || filters.status !== "all") && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleFiltersChange(defaultFilters)}
                          >
                            Reset filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Data rows
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={(e) => {
                            // Prevent row click for action column
                            if (cell.column.id === "actions") {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, data.pagination.totalItems)} dari{" "}
              {data.pagination.totalItems} data
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Per halaman:
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                  disabled={isLoadingState}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!data.pagination.hasPrevPage || isLoadingState}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm">
                  {page} / {data.pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!data.pagination.hasNextPage || isLoadingState}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <OccupantDetailSheet
        occupant={selectedOccupant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
      />

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
