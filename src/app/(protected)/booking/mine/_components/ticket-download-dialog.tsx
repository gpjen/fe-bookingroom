/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, User } from "lucide-react";
import {
  BookingRequest,
  BookingOccupant,
} from "@/app/(protected)/booking/request/_components/types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BookingTicketPDF } from "./booking-ticket-pdf";
import QRCode from "qrcode";

interface TicketDownloadDialogProps {
  booking: BookingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDownloadDialog({
  booking,
  open,
  onOpenChange,
}: TicketDownloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unduh Tiket / Download Ticket</DialogTitle>
          <DialogDescription>
            Silakan unduh tiket untuk setiap penghuni. Tiket berisi kode QR
            untuk check-in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {booking.occupants.map((occupant) => (
            <TicketDownloadItem
              key={occupant.id}
              booking={booking}
              occupant={occupant}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketDownloadItem({
  booking,
  occupant,
}: {
  booking: BookingRequest;
  occupant: BookingOccupant;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate QR Code: BookingCode + OccupantID JSON string for better parsing
    const data = occupant.id;

    QRCode.toDataURL(data, { width: 200, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Gen Error", err));
  }, [booking, occupant]);

  if (!qrCodeUrl) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <span className="text-sm font-medium">{occupant.name}</span>
        </div>
      </div>
    );
  }

  const fileName = `Ticket_${booking.bookingCode}_${occupant.name.replace(
    /\s+/g,
    "_"
  )}.pdf`;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{occupant.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {occupant.type}
          </p>
        </div>
      </div>

      <PDFDownloadLink
        document={
          <BookingTicketPDF
            booking={booking}
            occupant={occupant}
            qrCodeUrl={qrCodeUrl}
          />
        }
        fileName={fileName}
      >
        {({ blob, url, loading, error }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
}
