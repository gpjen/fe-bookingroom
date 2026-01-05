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
  User,
  Building2,
  Bed,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { OccupantListItem, OccupancyStatus } from "../_actions/occupants.types";
import { getOccupantById } from "../_actions/occupants.actions";
import {
  checkInOccupant,
  checkOutOccupant,
} from "@/app/(protected)/properties/buildings/[id]/_actions/occupancy.actions";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

type ScanModalState =
  | { type: "idle" }
  | { type: "processing" }
  | {
      type: "success";
      action: "checkin" | "checkout";
      occupant: OccupantListItem;
    }
  | { type: "error"; message: string; occupant?: OccupantListItem };

export function QrScannerDialog({
  open,
  onOpenChange,
  onUpdate,
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

  // Process scanned occupancy ID
  const processOccupantId = useCallback(
    async (occupancyId: string) => {
      setModalState({ type: "processing" });

      try {
        // Fetch occupant from database
        const result = await getOccupantById(occupancyId);

        if (!result.success) {
          setModalState({
            type: "error",
            message: `Data tidak ditemukan (ID: ${occupancyId.substring(
              0,
              8
            )}...)`,
          });
          return;
        }

        const occupant = result.data;
        const status = occupant.status as OccupancyStatus;
        const today = startOfDay(new Date());

        // checkOutDate can be null for indefinite stays
        const outDate = occupant.checkOutDate
          ? startOfDay(new Date(occupant.checkOutDate))
          : null;

        // Handle based on status
        if (status === "RESERVED" || status === "PENDING") {
          // Auto Check-In
          const checkInResult = await checkInOccupant(occupant.id);
          if (checkInResult.success) {
            setModalState({
              type: "success",
              action: "checkin",
              occupant: {
                ...occupant,
                status: "CHECKED_IN",
              },
            });
            onUpdate?.();
          } else {
            setModalState({
              type: "error",
              message: checkInResult.error || "Gagal melakukan check-in",
              occupant,
            });
          }
        } else if (status === "CHECKED_IN") {
          // For indefinite stays (no checkout date), allow immediate checkout
          // For scheduled checkout, check if date has arrived
          const canCheckout = outDate === null || !isBefore(today, outDate);

          if (!canCheckout) {
            // Not yet time to checkout - show warning
            setModalState({
              type: "error",
              message: `Belum waktunya Check-Out. Jadwal: ${format(
                new Date(occupant.checkOutDate!),
                "dd MMM yyyy",
                { locale: id }
              )}. Gunakan halaman detail untuk Early Checkout.`,
              occupant,
            });
          } else {
            // Auto Check-Out (either indefinite or date has arrived)
            const checkOutResult = await checkOutOccupant({
              occupancyId: occupant.id,
            });
            if (checkOutResult.success) {
              setModalState({
                type: "success",
                action: "checkout",
                occupant: {
                  ...occupant,
                  status: "CHECKED_OUT",
                },
              });
              onUpdate?.();
            } else {
              setModalState({
                type: "error",
                message: checkOutResult.error || "Gagal melakukan check-out",
                occupant,
              });
            }
          }
        } else if (status === "CHECKED_OUT") {
          setModalState({
            type: "error",
            message: "Penghuni sudah melakukan Check-Out sebelumnya.",
            occupant,
          });
        } else if (status === "CANCELLED") {
          setModalState({
            type: "error",
            message: "Reservasi ini telah dibatalkan.",
            occupant,
          });
        } else if (status === "NO_SHOW") {
          setModalState({
            type: "error",
            message: "Penghuni tidak hadir pada reservasi ini.",
            occupant,
          });
        }
      } catch (error) {
        console.error("Process occupant error:", error);
        setModalState({
          type: "error",
          message: "Terjadi kesalahan saat memproses data.",
        });
      }
    },
    [onUpdate]
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

      lastScannedCodeRef.current = decodedText;

      if (processingTimeoutRef.current)
        clearTimeout(processingTimeoutRef.current);

      processingTimeoutRef.current = setTimeout(() => {
        // Try to parse as JSON (legacy format) or use as direct ID
        let occupancyId = decodedText.trim();

        try {
          const qrData = JSON.parse(decodedText);
          if (qrData.o) occupancyId = qrData.o;
        } catch {
          // Not JSON, use as-is
        }

        processOccupantId(occupancyId);
      }, 300);
    },
    [processOccupantId, modalState.type]
  );

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setModalState({ type: "processing" });
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-file-reader-occupants");

      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);

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
      const html5QrCode = new Html5Qrcode("qr-camera-reader-occupants");
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
      setCameraError("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
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
      } catch (err) {
        console.error("Camera stop error:", err);
      }

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
              Arahkan kamera ke QR penghuni atau upload gambar
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
            id="qr-camera-reader-occupants"
            ref={scannerRef}
            className="w-full h-full"
          />
          {/* Hidden helper div for file scanning */}
          <div id="qr-file-reader-occupants" className="hidden"></div>

          {/* Aim Guide */}
          {cameraActive && modalState.type === "idle" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 -mt-0.5 -ml-0.5 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 -mt-0.5 -mr-0.5 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 -mb-0.5 -ml-0.5 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 -mb-0.5 -mr-0.5 rounded-br" />
                {/* Scan line animation */}
                <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
                </div>
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {modalState.type === "processing" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-white mb-3" />
              <p className="text-white text-sm">Memproses...</p>
            </div>
          )}

          {/* Loading/Error State Overlay */}
          {!cameraActive && modalState.type === "idle" && (
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

        {/* RESULT OVERLAY */}
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
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                        : "bg-gradient-to-br from-orange-500 to-orange-600"
                    )}
                  >
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                      {modalState.action === "checkin" ? (
                        <LogIn className="h-8 w-8 text-white" />
                      ) : (
                        <LogOut className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {modalState.action === "checkin"
                        ? "CHECK-IN"
                        : "CHECK-OUT"}
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      Berhasil!
                    </p>
                  </div>

                  <div className="p-6 w-full space-y-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
                        {modalState.occupant.occupantName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
                          {modalState.occupant.occupantName}
                        </p>
                        {modalState.occupant.occupantNik && (
                          <p className="text-sm text-slate-500 font-mono">
                            {modalState.occupant.occupantNik}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Gedung
                          </p>
                          <p className="font-medium">
                            {modalState.occupant.buildingName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Bed className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">Kamar</p>
                          <p className="font-medium">
                            {modalState.occupant.roomCode} -{" "}
                            {modalState.occupant.bedLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-2"
                      size="lg"
                      onClick={resetAndContinue}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Berikutnya
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {modalState.type === "error" && (
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Tidak Dapat Diproses
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {modalState.message}
                    </p>
                  </div>

                  {modalState.occupant && (
                    <div className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-left text-sm border dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {modalState.occupant.occupantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {modalState.occupant.buildingName} •{" "}
                            {modalState.occupant.roomCode}
                          </p>
                        </div>
                      </div>
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
