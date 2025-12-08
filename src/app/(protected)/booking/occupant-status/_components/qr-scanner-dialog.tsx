"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  QrCode,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  Building,
  Calendar,
  LogIn,
  LogOut,
  Keyboard,
  Video,
  VideoOff,
} from "lucide-react";
import { format } from "date-fns";
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

type ScanResult = {
  status: "idle" | "scanning" | "found" | "not_found" | "error";
  occupant?: OccupantWithBooking;
  message?: string;
};

const getStatusConfig = (status: OccupantStatus) => {
  const configs: Record<OccupantStatus, { label: string; className: string }> = {
    scheduled: {
      label: "Terjadwal",
      className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
    },
    checked_in: {
      label: "Check-In",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    checked_out: {
      label: "Check-Out",
      className: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400",
    },
    cancelled: {
      label: "Dibatalkan",
      className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };
  return configs[status];
};

export function QrScannerDialog({
  open,
  onOpenChange,
  occupants,
  onCheckIn,
  onCheckOut,
}: QrScannerDialogProps) {
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult>({ status: "idle" });
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  // Find occupant by various inputs
  const findOccupant = useCallback((input: string): OccupantWithBooking | undefined => {
    const trimmed = input.trim();
    
    // Try to parse as JSON first (format: {b: bookingCode, o: occupantId, t: type})
    try {
      const qrData = JSON.parse(trimmed);
      if (qrData.o) {
        // Find by occupant ID from JSON
        const found = occupants.find((occ) => occ.id === qrData.o);
        if (found) return found;
      }
      if (qrData.b) {
        // Find by booking code from JSON (return first match)
        const found = occupants.find(
          (occ) => occ.bookingCode.toLowerCase() === qrData.b.toLowerCase()
        );
        if (found) return found;
      }
    } catch {
      // Not JSON, continue with other checks
    }

    // Check if input is a UUID (occupant ID) - simple UUID pattern check
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(trimmed)) {
      const found = occupants.find((occ) => occ.id === trimmed);
      if (found) return found;
    }

    // Try exact match on booking code
    const foundByCode = occupants.find(
      (occ) => occ.bookingCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (foundByCode) return foundByCode;

    // Try partial match on booking code
    const foundByPartialCode = occupants.find(
      (occ) => occ.bookingCode.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (foundByPartialCode) return foundByPartialCode;

    // Try match on identifier (NIK/ID)
    const foundByIdentifier = occupants.find(
      (occ) => occ.identifier.toLowerCase() === trimmed.toLowerCase()
    );
    if (foundByIdentifier) return foundByIdentifier;

    return undefined;
  }, [occupants]);

  // Initialize camera scanner
  const startCamera = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;

    try {
      setCameraError(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code scanned successfully
          const found = findOccupant(decodedText);
          if (found) {
            setScanResult({ status: "found", occupant: found });
            // Stop camera after successful scan
            stopCamera();
          } else {
            setScanResult({
              status: "not_found",
              message: `Tidak ditemukan penghuni dengan data: "${decodedText.substring(0, 50)}${decodedText.length > 50 ? "..." : ""}"`,
            });
          }
        },
        () => {
          // QR code scan error (ignore, keep scanning)
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        err instanceof Error 
          ? err.message 
          : "Tidak dapat mengakses kamera. Pastikan kamera tersedia dan izin diberikan."
      );
      setCameraActive(false);
    }
  }, [findOccupant]);

  // Stop camera scanner
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const html5QrCode = html5QrCodeRef.current as { stop: () => Promise<void>; clear: () => void };
        await html5QrCode.stop();
        html5QrCode.clear();
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Reset dialog state
  const resetScan = useCallback(() => {
    setScanResult({ status: "idle" });
    setManualCode("");
    setCameraError(null);
    if (activeTab === "manual") {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (activeTab === "camera" && !cameraActive) {
      startCamera();
    }
  }, [activeTab, cameraActive, startCamera]);

  // Handle dialog open/close
  useEffect(() => {
    if (open) {
      setScanResult({ status: "idle" });
      setManualCode("");
      setCameraError(null);
      
      if (activeTab === "camera") {
        // Delay camera start to allow dialog to render
        const timer = setTimeout(() => startCamera(), 300);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      stopCamera();
    }
  }, [open, activeTab, startCamera, stopCamera]);

  // Handle tab change
  useEffect(() => {
    if (!open) return;

    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab, open, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      setScanResult({ status: "error", message: "Masukkan kode booking atau ID penghuni" });
      return;
    }

    setScanResult({ status: "scanning" });

    // Simulate small delay for UX
    setTimeout(() => {
      const found = findOccupant(manualCode);

      if (found) {
        setScanResult({ status: "found", occupant: found });
      } else {
        setScanResult({
          status: "not_found",
          message: `Tidak ditemukan penghuni dengan "${manualCode}"`,
        });
      }
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  const handleAction = (action: "checkin" | "checkout") => {
    if (!scanResult.occupant) return;

    if (action === "checkin") {
      onCheckIn(scanResult.occupant);
    } else {
      onCheckOut(scanResult.occupant);
    }

    // Reset for next scan
    resetScan();
  };

  const occupant = scanResult.occupant;
  const status = occupant?.status || "scheduled";
  const statusConfig = occupant ? getStatusConfig(status) : null;
  const canCheckIn = status === "scheduled";
  const canCheckOut = status === "checked_in";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan Tiket QR Code
          </DialogTitle>
          <DialogDescription>
            Scan QR code pada tiket atau masukkan kode secara manual
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Kamera
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4">
            <div className="space-y-4">
              {/* Camera View */}
              {scanResult.status !== "found" && (
                <div className="relative">
                  <div
                    id="qr-reader"
                    ref={scannerRef}
                    className="w-full aspect-square max-h-[300px] bg-black rounded-lg overflow-hidden"
                  />
                  
                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Memulai kamera...</p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 rounded-lg p-4 text-center">
                      <VideoOff className="h-10 w-10 text-red-500 mb-3" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                        Gagal mengakses kamera
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">{cameraError}</p>
                      <Button size="sm" variant="outline" onClick={startCamera}>
                        Coba Lagi
                      </Button>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center">
                      <Badge variant="secondary" className="gap-1.5">
                        <Video className="h-3 w-3" />
                        Arahkan kamera ke QR Code
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Scan Result */}
              {scanResult.status === "not_found" && (
                <div className="p-4 border rounded-lg text-center">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {scanResult.message}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={resetScan}>
                    Scan Lagi
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Booking / ID Penghuni</Label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    id="code"
                    placeholder="Masukkan kode booking atau ID..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={scanResult.status === "scanning"}
                  />
                  <Button
                    onClick={handleManualSearch}
                    disabled={scanResult.status === "scanning"}
                  >
                    {scanResult.status === "scanning" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Cari"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Masukkan kode booking (REQ-XXXXXX), ID penghuni, atau NIK
                </p>
              </div>

              {/* Manual Search Result */}
              {scanResult.status === "not_found" && (
                <div className="p-4 border rounded-lg text-center">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {scanResult.message}
                  </p>
                </div>
              )}

              {scanResult.status === "error" && (
                <div className="p-4 border rounded-lg text-center">
                  <XCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {scanResult.message}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Found Result - Shown for both tabs */}
        {scanResult.status === "found" && occupant && statusConfig && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Data Ditemukan
                </span>
              </div>
              <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {occupant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{occupant.name}</p>
                  <p className="text-xs text-muted-foreground">{occupant.identifier}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>{occupant.buildingName} - R.{occupant.roomCode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>Bed {occupant.bedCode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {format(new Date(occupant.inDate), "dd MMM", { locale: id })} -{" "}
                    {occupant.outDate
                      ? format(new Date(occupant.outDate), "dd MMM", { locale: id })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Durasi:</span>
                  <span className="font-medium">{occupant.duration} Hari</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canCheckIn && (
                <Button
                  onClick={() => handleAction("checkin")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Check-In
                </Button>
              )}
              {canCheckOut && (
                <Button
                  onClick={() => handleAction("checkout")}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Check-Out
                </Button>
              )}
              {!canCheckIn && !canCheckOut && (
                <div className="flex-1 p-3 text-center text-sm text-muted-foreground bg-muted/50 rounded">
                  {status === "checked_out" && "Penghuni sudah check-out"}
                  {status === "cancelled" && "Pemesanan dibatalkan"}
                </div>
              )}
              <Button variant="outline" onClick={resetScan}>
                Scan Lagi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
