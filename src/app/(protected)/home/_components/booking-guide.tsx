import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Info,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  Mars,
  Venus,
  Users,
} from "lucide-react";

export function BookingGuide() {
  return (
    <Card className="mt-6 border-l-4 border-l-yellow-500 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Panduan & Aturan Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Reservation Steps */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Cara Pemesanan
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-1">
            <li>
              Pilih <strong>Area</strong> dan tentukan{" "}
              <strong>Tanggal Check-in/out</strong>.
            </li>
            <li>
              Masukkan jumlah <strong>Karyawan</strong> atau{" "}
              <strong>Tamu</strong>.
            </li>
            <li>
              Sistem akan menyarankan kamar yang sesuai (Karyawan bisa di kamar
              Tamu, tapi Tamu <strong>wajib</strong> di kamar Tamu).
            </li>
            <li>
              Klik <strong>Request Booking</strong> pada menu samping untuk
              memproses surat.
            </li>
          </ol>
        </div>

        {/* Allocation Rules */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Aturan Alokasi Kamar
          </h4>
          <div className="grid gap-2">
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
              <Briefcase className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium block text-xs uppercase tracking-wider mb-0.5">
                  Karyawan
                </span>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Bisa menempati tipe <strong>Standard</strong> (Khusus
                  Karyawan) maupun <strong>VIP/VVIP</strong> (jika tersedia).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
              <User className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium block text-xs uppercase tracking-wider mb-0.5">
                  Tamu (Non-Karyawan)
                </span>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Hanya diperbolehkan menempati kamar yang di khususkan untuk
                  Tamu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gender Rules */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Ketentuan Gender</h4>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
              <Mars className="h-3.5 w-3.5" /> Khusus Pria
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-50 text-pink-700 border border-pink-100 text-xs font-medium dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800">
              <Venus className="h-3.5 w-3.5" /> Khusus Wanita
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800">
              <Users className="h-3.5 w-3.5" /> Campur (Keluarga)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
