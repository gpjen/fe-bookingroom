import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface BookingInfoSectionProps {
  purpose: string;
  notes: string;
  onPurposeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  errors?: Record<string, string>;
}

export function BookingInfoSection({
  purpose,
  notes,
  onPurposeChange,
  onNotesChange,
  errors,
}: BookingInfoSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <Label className="font-medium">Informasi Booking</Label>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Tujuan <span className="text-destructive">*</span></Label>
            <span className="text-xs text-muted-foreground">{purpose?.length || 0}/10</span>
          </div>
          <Textarea
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            placeholder="Kunjungan kerja, meeting, audit, dll..."
            rows={2}
            className="resize-none text-sm"
          />
          {errors?.purpose && (
            <p className="text-xs text-destructive">{errors.purpose}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Catatan (opsional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Catatan tambahan jika ada..."
            rows={2}
            className="resize-none text-sm"
          />
        </div>
      </div>
    </div>
  );
}
