import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Informasi Booking</h3>
            <p className="text-sm text-muted-foreground">
              Detail tujuan dan catatan booking
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">
                Tujuan Booking <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-xs">
                Minimal 10 karakter
              </Badge>
            </div>
            <div className="relative">
              <Textarea
                value={purpose}
                onChange={(e) => onPurposeChange(e.target.value)}
                placeholder="Contoh: Kunjungan kerja tim IT untuk maintenance sistem selama 3 hari..."
                rows={4}
                className="min-h-[120px] resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {purpose?.length || 0}/10
              </div>
            </div>
            {errors?.purpose && (
              <p className="text-sm text-destructive mt-2">{errors.purpose}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="font-medium">Catatan Tambahan (Opsional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Tambahkan catatan atau instruksi khusus jika diperlukan..."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
