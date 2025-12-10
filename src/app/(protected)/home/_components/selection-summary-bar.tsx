"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BedDouble,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedBed } from "./booking-request-types";

interface SelectionSummaryBarProps {
  selectedBeds: SelectedBed[];
  totalPeople: number;
  onClearAll: () => void;
  onBookNow: () => void;
  onRemoveBed: (bedId: string) => void;
}

export function SelectionSummaryBar({
  selectedBeds,
  totalPeople,
  onClearAll,
  onBookNow,
  onRemoveBed,
}: SelectionSummaryBarProps) {
  const isComplete = selectedBeds.length >= totalPeople;
  const remaining = totalPeople - selectedBeds.length;

  const groupedByRoom = useMemo(() => {
    const grouped = new Map<string, SelectedBed[]>();
    selectedBeds.forEach((bed) => {
      const existing = grouped.get(bed.roomId) || [];
      grouped.set(bed.roomId, [...existing, bed]);
    });
    return Array.from(grouped.entries());
  }, [selectedBeds]);

  if (selectedBeds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background/95 backdrop-blur-lg border-t-2 shadow-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Selected Beds Preview */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-xs text-muted-foreground shrink-0">
                Selected:
              </span>
              {groupedByRoom.map(([roomId, beds]) => (
                <div
                  key={roomId}
                  className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1 shrink-0"
                >
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{beds[0].roomCode}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  {beds.map((bed) => (
                    <Badge
                      key={bed.bedId}
                      variant="secondary"
                      className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => onRemoveBed(bed.bedId)}
                    >
                      {bed.bedCode}
                      <X className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                </div>
              ))}
            </div>

            {/* Main Summary Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Bed Count */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isComplete
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-amber-100 dark:bg-amber-900/30"
                    )}
                  >
                    <BedDouble
                      className={cn(
                        "h-5 w-5",
                        isComplete
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none">
                      {selectedBeds.length}{" "}
                      <span className="text-muted-foreground font-normal text-sm">
                        / {totalPeople}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">beds selected</p>
                  </div>
                </div>

                {/* Status Message */}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    isComplete
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}
                >
                  {isComplete ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready to book!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Need {remaining} more bed{remaining > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
                <Button
                  size="lg"
                  onClick={onBookNow}
                  disabled={!isComplete}
                  className={cn(
                    "gap-2 px-6 font-bold shadow-lg transition-all",
                    isComplete &&
                      "bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Book Now
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
