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
  OccupancyStatus,
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
      status: (searchParams.get("status") || "all") as FilterState["status"],
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
            status:
              f.status !== "all"
                ? f.status.includes(",")
                  ? (f.status.split(",") as OccupancyStatus[])
                  : [f.status as OccupancyStatus]
                : undefined,
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

  // Handle stat click (Quick Filter)
  const handleStatClick = useCallback(
    (status: string) => {
      // Properly typed assignment since FilterState["status"] now accepts string
      const newFilters: FilterState = { ...defaultFilters, status: status };
      setFilters(newFilters);
      setPage(1);
      fetchData(newFilters, 1, pageSize);
    },
    [pageSize, fetchData]
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
    // Refresh data after action
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
        onCheckIn: handleView,
        onCheckOut: handleView,
        onTransfer: handleView,
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
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-900">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Penghuni
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Dashboard pengelolaan data penghuni dan status hunian.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setScannerOpen(true)}
            size="lg"
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg border-0"
          >
            <QrCode className="h-5 w-5" />
            Scan QR
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleRefresh}
            disabled={isLoadingState}
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoadingState ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <OccupantStatsCards
        stats={stats}
        isLoading={isLoadingState}
        onFilterClick={handleStatClick}
      />

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-900 p-6 space-y-6">
        {/* Filters Bar */}
        <div className="p-1">
          <OccupantsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={isLoadingState}
          />
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-slate-200 dark:border-slate-800"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
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
                        <Skeleton className="h-10 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6">
                      <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="text-lg font-medium text-foreground">
                        Tidak ada data ditemukan
                      </p>
                      <p className="text-sm mt-1 max-w-xs mx-auto">
                        Coba ubah filter pencarian atau muat ulang data.
                      </p>
                      {(filters.search || filters.status !== "all") && (
                        <Button
                          variant="secondary"
                          className="mt-4"
                          onClick={() => handleFiltersChange(defaultFilters)}
                        >
                          Reset semua filter
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
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-100 dark:border-slate-800"
                    onClick={() => handleView(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3"
                        onClick={(e) => {
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pageSize, data.pagination.totalItems)}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">
              {data.pagination.totalItems}
            </span>{" "}
            data
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <div className="flex items-center gap-2 mr-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium hidden sm:inline">
                Rows per page
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
                disabled={isLoadingState}
              >
                <SelectTrigger className="w-[70px] h-9">
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

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md bg-white dark:bg-slate-950 shadow-sm disabled:opacity-50"
                onClick={() => handlePageChange(page - 1)}
                disabled={!data.pagination.hasPrevPage || isLoadingState}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 min-w-[3rem] text-center font-medium text-sm">
                {page}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md bg-white dark:bg-slate-950 shadow-sm disabled:opacity-50"
                onClick={() => handlePageChange(page + 1)}
                disabled={!data.pagination.hasNextPage || isLoadingState}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
