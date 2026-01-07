"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  FileText,
  BedDouble,
} from "lucide-react";
import { OccupantDetailsForm } from "./occupant-details-form";
import { BookingReviewStep } from "./booking-review-step";
import type {
  BookingRequestSheetProps,
  BookingAttachment,
} from "../booking-request-types";
import type {
  BookingOccupant,
  CompanionInfo,
} from "@/app/(protected)/booking/request/_components/types";
import { differenceInDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Fallback for crypto.randomUUID (not available in all browsers)
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STEPS = [
  { id: 1, label: "Data Penghuni", icon: Users },
  { id: 2, label: "Review & Kirim", icon: FileText },
];

export function BookingRequestSheet({
  searchParams,
  selectedBeds,
  onClose,
}: BookingRequestSheetProps) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const duration = differenceInDays(
    searchParams.endDate,
    searchParams.startDate
  );

  // Initialize occupants based on selected beds
  const initialOccupants: BookingOccupant[] = useMemo(() => {
    return selectedBeds.map((bed) => ({
      id: generateId(),
      name: "",
      identifier: "",
      type: bed.roomAllocation === "guest" ? "guest" : ("employee" as const),
      gender: bed.roomGender === "female" ? "P" : ("L" as const),
      inDate: searchParams.startDate,
      outDate: searchParams.endDate,
      duration: duration,
      areaId: bed.areaId,
      areaName: bed.areaName,
      buildingId: bed.buildingId,
      buildingName: bed.buildingName,
      roomId: bed.roomId,
      roomCode: bed.roomCode,
      bedId: bed.bedId,
      bedCode: bed.bedCode,
      status: "PENDING" as const,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [occupants, setOccupants] =
    useState<BookingOccupant[]>(initialOccupants);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<BookingAttachment[]>([]);
  const [companion, setCompanion] = useState<CompanionInfo | undefined>(
    undefined
  );

  const hasGuestOccupant = useMemo(() => {
    return occupants.some((occ) => occ.type === "guest");
  }, [occupants]);

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    occupants.forEach((occ, index) => {
      const bed = selectedBeds[index];
      if (!bed) return;

      // Check required fields
      if (!occ.name) {
        errors.push(`Penghuni ${index + 1}: Nama wajib diisi`);
      }
      if (!occ.identifier) {
        errors.push(
          `Penghuni ${index + 1}: ${
            occ.type === "employee" ? "NIK" : "No. KTP/Paspor"
          } wajib diisi`
        );
      }

      // Validate dates
      if (!occ.inDate) {
        errors.push(`Penghuni ${index + 1}: Tanggal check-in wajib diisi`);
      }
      if (!occ.outDate) {
        errors.push(`Penghuni ${index + 1}: Tanggal check-out wajib diisi`);
      }
      if (occ.inDate && occ.outDate && occ.outDate <= occ.inDate) {
        errors.push(
          `Penghuni ${index + 1}: Tanggal check-out harus setelah check-in`
        );
      }
      // Validate dates within filter range
      if (occ.inDate && occ.inDate < searchParams.startDate) {
        errors.push(
          `Penghuni ${index + 1}: Check-in tidak boleh sebelum ${format(
            searchParams.startDate,
            "dd MMM",
            { locale: localeId }
          )}`
        );
      }
      if (occ.outDate && occ.outDate > searchParams.endDate) {
        errors.push(
          `Penghuni ${index + 1}: Check-out tidak boleh setelah ${format(
            searchParams.endDate,
            "dd MMM",
            { locale: localeId }
          )}`
        );
      }

      // Validate type matches room allocation
      // Karyawan bisa di kamar employee & guest
      // Tamu hanya bisa di kamar guest
      if (bed.roomAllocation === "employee" && occ.type === "guest") {
        errors.push(
          `Penghuni ${index + 1}: Kamar ${
            bed.roomCode
          } khusus karyawan, tamu tidak diperbolehkan`
        );
      }
      // Tamu di kamar guest = OK
      // Karyawan di kamar guest = OK (tidak perlu validasi)

      // Validate gender matches room gender
      if (bed.roomGender === "male" && occ.gender === "P") {
        errors.push(`Penghuni ${index + 1}: Kamar ${bed.roomCode} khusus pria`);
      }
      if (bed.roomGender === "female" && occ.gender === "L") {
        errors.push(
          `Penghuni ${index + 1}: Kamar ${bed.roomCode} khusus wanita`
        );
      }

      // For flexible rooms, check all occupants in same room have same gender
      if (bed.roomGender === "flexible") {
        const sameRoomOccupants = occupants.filter(
          (o, i) => selectedBeds[i]?.roomId === bed.roomId
        );
        const genders = new Set(sameRoomOccupants.map((o) => o.gender));
        if (genders.size > 1) {
          errors.push(
            `Kamar ${bed.roomCode} fleksibel: semua penghuni harus gender sama`
          );
        }
      }
    });

    // Check purpose
    if (purpose.length < 10) {
      errors.push("Tujuan booking minimal 10 karakter");
    }

    // Check companion for guest
    if (hasGuestOccupant) {
      if (!companion?.nik) {
        errors.push("NIK pendamping wajib diisi untuk tamu");
      }
      if (!companion?.name) {
        errors.push("Nama pendamping wajib diisi untuk tamu");
      }
    }

    return errors;
  }, [
    occupants,
    selectedBeds,
    purpose,
    hasGuestOccupant,
    companion,
    searchParams.startDate,
    searchParams.endDate,
  ]);

  const canProceedToStep2 = validationErrors.length === 0;

  const canSubmit = canProceedToStep2;

  const handleOccupantUpdate = (
    index: number,
    data: Partial<BookingOccupant>
  ) => {
    setOccupants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  };

  const handleNext = () => {
    if (step === 1 && canProceedToStep2) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleSubmit = async () => {
    // TODO: Implement actual API call
    console.log("Submitting booking request:", {
      searchParams,
      selectedBeds,
      occupants,
      purpose,
      notes,
      attachments,
      companion,
    });

    // Close sheet
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-primary" />
                Booking Request
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(searchParams.startDate, "dd MMM", { locale: localeId })}{" "}
                -{" "}
                {format(searchParams.endDate, "dd MMM yyyy", {
                  locale: localeId,
                })}{" "}
                • {duration} malam
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 text-sm">
              <BedDouble className="h-4 w-4" />
              {selectedBeds.length} Bed
            </Badge>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors flex-1",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted &&
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                      !isActive &&
                        !isCompleted &&
                        "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        isActive && "bg-primary-foreground/20",
                        isCompleted && "bg-emerald-600 text-white",
                        !isActive && !isCompleted && "bg-muted-foreground/20"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : s.id}
                    </div>
                    <span className="font-medium text-sm hidden sm:block">
                      {s.label}
                    </span>
                    <StepIcon className="h-4 w-4 sm:hidden" />
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <OccupantDetailsForm
              occupants={occupants}
              selectedBeds={selectedBeds}
              onOccupantUpdate={handleOccupantUpdate}
              companion={companion}
              onCompanionUpdate={setCompanion}
              hasGuestOccupant={hasGuestOccupant}
              purpose={purpose}
              onPurposeChange={setPurpose}
              notes={notes}
              onNotesChange={setNotes}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              filterStartDate={searchParams.startDate}
              filterEndDate={searchParams.endDate}
            />
          )}

          {step === 2 && (
            <BookingReviewStep
              searchParams={searchParams}
              selectedBeds={selectedBeds}
              occupants={occupants}
              purpose={purpose}
              notes={notes}
              attachments={attachments}
              companion={companion}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {step === 1 ? "Batal" : "Kembali"}
            </Button>

            {step < 2 ? (
              <Button onClick={handleNext} disabled={!canProceedToStep2}>
                Lanjut
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Kirim Request
              </Button>
            )}
          </div>

          {/* Progress Text / Validation Errors */}
          <div className="mt-3 text-xs text-center">
            {step === 1 && (
              <>
                {canProceedToStep2 ? (
                  <span className="text-emerald-600 font-medium">
                    Semua data valid! Klik Lanjut untuk review
                  </span>
                ) : validationErrors.length > 0 ? (
                  <div className="text-left space-y-1 max-h-20 overflow-y-auto">
                    {validationErrors.slice(0, 3).map((error, idx) => (
                      <p
                        key={idx}
                        className="text-destructive flex items-start gap-1"
                      >
                        <span className="shrink-0">•</span>
                        <span>{error}</span>
                      </p>
                    ))}
                    {validationErrors.length > 3 && (
                      <p className="text-muted-foreground">
                        +{validationErrors.length - 3} error lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Lengkapi semua data untuk melanjutkan
                  </span>
                )}
              </>
            )}
            {step === 2 && (
              <span className="text-muted-foreground">
                Periksa kembali data booking sebelum mengirim
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
