"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Loader2,
  LogIn,
  LogOut,
  VideoOff,
  AlertTriangle,
  Image as ImageIcon,
  Camera,
  X,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { OccupantWithBooking } from "./mock-data";
import type { OccupantStatus } from "../../request/_components/types";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupants: OccupantWithBooking[];
  onCheckIn: (occupant: OccupantWithBooking) => void;
  onCheckOut: (occupant: OccupantWithBooking) => void;
}

type ScanModalState =
  | { type: "idle" }
  | { type: "processing" }
  | {
      type: "success";
      action: "checkin" | "checkout";
      occupant: OccupantWithBooking;
    }
  | { type: "error"; message: string; occupant?: OccupantWithBooking };

export function QrScannerDialog({
  open,
  onOpenChange,
  occupants,
  onCheckIn,
  onCheckOut,
}: QrScannerDialogProps) {
  const [modalState, setModalState] = useState<ScanModalState>({
    type: "idle",
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find occupant helper - Priorities: 1. Exact ID Match (Primary), 2. JSON
  const findOccupant = useCallback(
    (input: string): OccupantWithBooking | undefined => {
      const trimmed = input.trim();

      // 1. Direct ID Match (UUID or simple string ID)
      // This is the preferred format now: just the ID string
      const exactMatch = occupants.find((o) => o.id === trimmed);
      if (exactMatch) return exactMatch;

      // 2. Legacy/JSON Support (just in case)
      try {
        const qrData = JSON.parse(trimmed);
        if (qrData.o) return occupants.find((occ) => occ.id === qrData.o);
      } catch {}

      return undefined;
    },
    [occupants]
  );

  // Logic to process a found occupant
  const processOccupant = useCallback(
    (occupant: OccupantWithBooking) => {
      const status = occupant.status as OccupantStatus;
      const today = startOfDay(new Date());
      const outDate = startOfDay(occupant.outDate || new Date());

      if (status === "scheduled") {
        // Auto Check-In
        onCheckIn(occupant);
        setModalState({ type: "success", action: "checkin", occupant });
      } else if (status === "checked_in") {
        // Auto Check-Out Check
        if (isBefore(today, outDate)) {
          setModalState({
            type: "error",
            message: `Belum waktunya Check-Out. Jadwal: ${format(
              occupant.outDate!,
              "dd MMM yyyy",
              { locale: id }
            )}`,
            occupant,
          });
        } else {
          onCheckOut(occupant);
          setModalState({ type: "success", action: "checkout", occupant });
        }
      } else if (status === "checked_out") {
        setModalState({
          type: "error",
          message: "Penghuni sudah melakukan Check-Out sebelumnya.",
          occupant,
        });
      } else if (status === "cancelled") {
        setModalState({
          type: "error",
          message: "Booking ini telah dibatalkan.",
          occupant,
        });
      }
    },
    [onCheckIn, onCheckOut]
  );

  // Handle Scan Code
  const handleScan = useCallback(
    (decodedText: string) => {
      if (
        lastScannedCodeRef.current === decodedText &&
        modalState.type !== "idle"
      )
        return;

      if (modalState.type !== "idle" && modalState.type !== "processing")
        return;

      setModalState({ type: "processing" });
      lastScannedCodeRef.current = decodedText;

      if (processingTimeoutRef.current)
        clearTimeout(processingTimeoutRef.current);

      processingTimeoutRef.current = setTimeout(() => {
        const occupant = findOccupant(decodedText);
        if (occupant) {
          processOccupant(occupant);
        } else {
          setModalState({
            type: "error",
            message: `Data tidak ditemukan (ID: ${decodedText.substring(
              0,
              15
            )}...)`,
          });
        }
      }, 500);
    },
    [findOccupant, processOccupant, modalState.type]
  );

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setModalState({ type: "processing" });
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-file-reader");

      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);

      // Clear input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("File scan error", err);
      setModalState({
        type: "error",
        message: "Tidak dapat membaca QR Code dari gambar ini.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Camera Management
  const startCamera = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;
    try {
      setCameraError(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-camera-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError("Gagal mengakses kamera.");
      setCameraActive(false);
    }
  }, [handleScan]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as {
          stop: () => Promise<void>;
          clear: () => void;
        };
        await scanner.stop();
        scanner.clear();
      } catch (err) {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Lifecycle
  useEffect(() => {
    if (open) {
      setModalState({ type: "idle" });
      lastScannedCodeRef.current = null;
      const timer = setTimeout(startCamera, 300);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const resetAndContinue = () => {
    setModalState({ type: "idle" });
    lastScannedCodeRef.current = null;
    if (!cameraActive) startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[500px] p-0 overflow-hidden bg-black border-zinc-800 text-white gap-0"
      >
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <div>
            <DialogTitle className="flex items-center gap-2 text-white">
              <QrCode className="h-5 w-5" />
              Scan QR Check-In/Out
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Arahkan kamera ke tiket QR atau upload gambar
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 -mt-2 -mr-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera Viewport */}
        <div className="relative w-full aspect-[4/3] bg-black group">
          <div
            id="qr-camera-reader"
            ref={scannerRef}
            className="w-full h-full"
          />
          {/* Hidden helper div for file scanning */}
          <div id="qr-file-reader" className="hidden"></div>

          {/* Aim Guide */}
          {cameraActive && modalState.type === "idle" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1" />
                <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-50">
                  <div className="w-full h-0.5 bg-red-500/50" />
                </div>
              </div>
            </div>
          )}

          {/* Loading/Error State Overlay */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
              {cameraError ? (
                <>
                  <VideoOff className="h-10 w-10 mb-4 opacity-50" />
                  <p className="max-w-[200px] text-center text-sm">
                    {cameraError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startCamera}
                    className="mt-4 border-zinc-700 bg-transparent text-white hover:bg-white/10"
                  >
                    Coba Lagi
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Menyiapkan kamera...</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Upload) */}
        <div className="bg-zinc-900 p-4 border-t border-zinc-800 flex justify-center gap-4">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 h-12"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5 mr-2" />
            Upload Foto QR
          </Button>
          {/* If camera fails or user wants to force retry */}
          {!cameraActive && (
            <Button
              variant="ghost"
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 h-12"
              onClick={startCamera}
            >
              <Camera className="h-5 w-5 mr-2" />
              Buka Kamera
            </Button>
          )}
        </div>

        {/* RESULT RESULT OVERLAY */}
        {modalState.type !== "idle" && modalState.type !== "processing" && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
              {/* Success State */}
              {modalState.type === "success" && (
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "w-full p-6 flex flex-col items-center",
                      modalState.action === "checkin"
                        ? "bg-emerald-500"
                        : "bg-orange-500"
                    )}
                  >
                    {modalState.action === "checkin" ? (
                      <LogIn className="h-12 w-12 text-white mb-2" />
                    ) : (
                      <LogOut className="h-12 w-12 text-white mb-2" />
                    )}
                    <h3 className="text-2xl font-bold text-white">
                      {modalState.action === "checkin"
                        ? "CHECK-IN"
                        : "CHECK-OUT"}
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      Berhasil
                    </p>
                  </div>

                  <div className="p-6 w-full space-y-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                        {modalState.occupant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                          {modalState.occupant.name}
                        </p>
                        <p className="text-sm text-slate-500 font-mono">
                          {modalState.occupant.identifier}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Booking / ID
                        </p>
                        <p className="font-medium">
                          {modalState.occupant.id.substring(0, 8)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Lokasi</p>
                        <p className="font-medium">
                          {modalState.occupant.buildingName} -{" "}
                          {modalState.occupant.roomCode}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-2"
                      size="lg"
                      onClick={resetAndContinue}
                    >
                      Lanjut Scan Berikutnya
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {modalState.type === "error" && (
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Gagal Scan
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {modalState.message}
                    </p>
                  </div>

                  {modalState.occupant && (
                    <div className="w-full p-3 bg-slate-50 rounded text-left text-sm border">
                      <p className="font-semibold">
                        {modalState.occupant.name}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetAndContinue}
                  >
                    Coba Lagi
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
