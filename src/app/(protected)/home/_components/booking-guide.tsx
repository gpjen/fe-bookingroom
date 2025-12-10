"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Info,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  Mars,
  Venus,
  Users,
  BookOpen,
  Shield,
  ChevronRight,
  BedDouble,
  Building2,
  Calendar,
  Search,
  FileText,
  Upload,
  Star,
  Crown,
  MapPin,
  Clock,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  Mail,
} from "lucide-react";

interface BookingGuideSheetProps {
  trigger?: React.ReactNode;
}

export function BookingGuideSheet({ trigger }: BookingGuideSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Panduan Booking
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            Panduan Booking Kamar
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Informasi lengkap cara pemesanan dan ketentuan yang berlaku
          </p>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Quick Info Alert */}
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              Ketersediaan kamar mengikuti konfigurasi admin. Booking akan
              diproses setelah mendapat persetujuan.
            </AlertDescription>
          </Alert>

          <Accordion
            type="multiple"
            defaultValue={["cara-booking"]}
            className="w-full space-y-3"
          >
            {/* Cara Booking */}
            <AccordionItem
              value="cara-booking"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold">Cara Pemesanan</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <StepItem
                    number="1"
                    icon={<MapPin className="h-4 w-4" />}
                    title="Pilih Area & Tanggal"
                    description="Tentukan lokasi (LQ, LQ Center, Tomori, P2) dan periode menginap"
                  />
                  <StepItem
                    number="2"
                    icon={<Users className="h-4 w-4" />}
                    title="Masukkan Jumlah Orang"
                    description="Tentukan jumlah karyawan dan tamu yang akan menginap"
                  />
                  <StepItem
                    number="3"
                    icon={<Search className="h-4 w-4" />}
                    title="Cari & Pilih Kamar"
                    description="Klik kamar di timeline untuk melihat detail dan pilih bed"
                  />
                  <StepItem
                    number="4"
                    icon={<FileText className="h-4 w-4" />}
                    title="Lengkapi Data"
                    description="Isi data penghuni, tujuan, dan upload dokumen pendukung"
                  />
                  <StepItem
                    number="5"
                    icon={<Check className="h-4 w-4" />}
                    title="Kirim Request"
                    description="Review dan kirim permintaan booking untuk disetujui"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tipe Kamar */}
            <AccordionItem
              value="tipe-kamar"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <BedDouble className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="font-semibold">Tipe Kamar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <RoomTypeItem
                    icon={<Crown className="h-4 w-4 text-amber-500" />}
                    badge={
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px]">
                        VVIP
                      </Badge>
                    }
                    title="VVIP Room"
                    description="Kamar premium dengan fasilitas lengkap, kapasitas 1 orang"
                  />
                  <RoomTypeItem
                    icon={<Star className="h-4 w-4 text-violet-500" />}
                    badge={
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-400 text-white text-[10px]">
                        VIP
                      </Badge>
                    }
                    title="VIP Room"
                    description="Kamar dengan fasilitas tambahan, kapasitas 2 orang"
                  />
                  <RoomTypeItem
                    icon={<BedDouble className="h-4 w-4 text-slate-500" />}
                    badge={
                      <Badge variant="outline" className="text-[10px]">
                        Standard
                      </Badge>
                    }
                    title="Standard Room"
                    description="Kamar standar dengan fasilitas dasar, kapasitas 2-4 orang"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Alokasi Kamar */}
            <AccordionItem
              value="alokasi"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold">Alokasi Kamar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <AllocationItem
                    icon={<Briefcase className="h-5 w-5 text-blue-600" />}
                    bgColor="bg-blue-50 dark:bg-blue-950/30"
                    borderColor="border-blue-200 dark:border-blue-800"
                    title="Kamar Karyawan"
                    description="Khusus untuk karyawan perusahaan. Tamu tidak diperbolehkan."
                  />
                  <AllocationItem
                    icon={<User className="h-5 w-5 text-amber-600" />}
                    bgColor="bg-amber-50 dark:bg-amber-950/30"
                    borderColor="border-amber-200 dark:border-amber-800"
                    title="Kamar Tamu"
                    description="Bisa untuk karyawan maupun tamu. Tamu wajib ada pendamping."
                  />
                  <Alert className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-xs">
                      <strong>Karyawan</strong> dapat menempati kamar karyawan
                      maupun kamar tamu.
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs">
                      <strong>Tamu</strong> hanya dapat menempati kamar tamu dan
                      wajib didampingi karyawan.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ketentuan Gender */}
            <AccordionItem
              value="gender"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <span className="font-semibold">Ketentuan Gender Kamar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <GenderItem
                    icon={<Mars className="h-5 w-5 text-blue-500" />}
                    label="Pria"
                    description="Khusus penghuni laki-laki. Gender otomatis terkunci."
                    locked={true}
                  />
                  <GenderItem
                    icon={<Venus className="h-5 w-5 text-pink-500" />}
                    label="Wanita"
                    description="Khusus penghuni perempuan. Gender otomatis terkunci."
                    locked={true}
                  />
                  <GenderItem
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    label="Campur (Mix)"
                    description="Boleh pria dan wanita dalam satu kamar (keluarga)."
                    locked={false}
                  />
                  <GenderItem
                    icon={<Users className="h-5 w-5 text-emerald-500" />}
                    label="Fleksibel"
                    description="Bisa pria semua ATAU wanita semua (tidak boleh campur)."
                    locked={false}
                    special={true}
                  />
                  <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs">
                      Untuk kamar Pria/Wanita, gender penghuni akan otomatis
                      terkunci dan tidak dapat diubah.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Status Timeline */}
            <AccordionItem
              value="timeline"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                  </div>
                  <span className="font-semibold">Membaca Timeline</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Timeline menunjukkan ketersediaan bed per hari:
                  </p>
                  <TimelineStatusItem
                    color="bg-emerald-500"
                    label="Tersedia Penuh"
                    description="Semua bed kosong dan bisa dipesan"
                    example="4/4"
                  />
                  <TimelineStatusItem
                    color="bg-amber-500"
                    label="Tersedia Sebagian"
                    description="Beberapa bed masih kosong"
                    example="2/4"
                  />
                  <TimelineStatusItem
                    color="bg-rose-500"
                    label="Penuh"
                    description="Semua bed terisi atau dipesan"
                    example="0/4"
                  />
                  <TimelineStatusItem
                    color="bg-gray-400"
                    label="Maintenance"
                    description="Kamar sedang dalam perbaikan"
                    example="MT"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dokumen Pendukung */}
            <AccordionItem
              value="dokumen"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Upload className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-semibold">Dokumen Pendukung</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Upload dokumen untuk mempercepat proses persetujuan:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <DocTypeItem label="Surat Tugas" />
                    <DocTypeItem label="Memo Internal" />
                    <DocTypeItem label="SPD" />
                    <DocTypeItem label="Undangan" />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <p className="text-xs font-medium">Format yang didukung:</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        JPG
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        PNG
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        GIF
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        PDF
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        DOC
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        DOCX
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Maksimal 5MB per file
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Validasi Data */}
            <AccordionItem
              value="validasi"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-semibold">Validasi Data</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Data yang wajib diisi sebelum submit:
                  </p>
                  <ValidationItem label="Nama lengkap penghuni" required />
                  <ValidationItem
                    label="NIK (karyawan) / No. KTP (tamu)"
                    required
                  />
                  <ValidationItem label="Gender sesuai kamar" required />
                  <ValidationItem
                    label="Tujuan booking (min 10 karakter)"
                    required
                  />
                  <ValidationItem
                    label="Data pendamping (jika ada tamu)"
                    required
                  />
                  <Separator className="my-2" />
                  <ValidationItem label="Email penghuni" />
                  <ValidationItem label="No. telepon penghuni" />
                  <ValidationItem label="Catatan tambahan" />
                  <ValidationItem label="Dokumen pendukung" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer Help */}
          <div className="pt-4 border-t">
            <div className="flex gap-3 p-4 bg-muted/30 rounded-lg">
              {/* Icon */}
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />

              {/* Content */}
              <div className="flex flex-col gap-4 w-full">
                <p className="text-sm font-medium">Butuh Bantuan?</p>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/6281143403568?text=Halo%2C%20saya%20butuh%20bantuan%20untuk%20akses%20sistem%20manajemen%20gedung"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    size="lg"
                    className="w-full gap-3 bg-gradient-to-r from-green-500 to-emerald-600 
                     hover:from-green-600 hover:to-emerald-700 text-white 
                     border-0 shadow-lg shadow-green-500/20 group"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="flex-1 text-left font-semibold">
                      WhatsApp
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>

                {/* Email */}
                <a
                  href="mailto:booking@obi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-3  
                     hover:bg-white/10 backdrop-blur-sm group"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="flex-1 text-left font-semibold">
                      Email
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>

                {/* Helpdesk */}
                <a
                  href="http://helpdesk.obi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-3  
                     hover:bg-white/10 backdrop-blur-sm group"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span className="flex-1 text-left font-semibold">
                      Helpdesk
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepItem({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="flex-shrink-0 w-7 h-7 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function RoomTypeItem({
  icon,
  badge,
  title,
  description,
}: {
  icon: React.ReactNode;
  badge: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function AllocationItem({
  icon,
  bgColor,
  borderColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <span className="font-semibold text-sm">{title}</span>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function GenderItem({
  icon,
  label,
  description,
  locked,
  special = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  locked: boolean;
  special?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        special
          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
          : "bg-muted/30"
      }`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {locked && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <X className="h-2.5 w-2.5" />
              Terkunci
            </Badge>
          )}
          {special && (
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Baru
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function TimelineStatusItem({
  color,
  label,
  description,
  example,
}: {
  color: string;
  label: string;
  description: string;
  example: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div
        className={`w-10 h-6 ${color} rounded text-white text-[10px] font-bold flex items-center justify-center`}
      >
        {example}
      </div>
      <div className="flex-1">
        <span className="font-medium text-sm">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DocTypeItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
      <FileText className="h-3 w-3 text-muted-foreground" />
      {label}
    </div>
  );
}

function ValidationItem({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {required ? (
        <CheckCircle2 className="h-4 w-4 text-red-500" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={required ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      {required && (
        <Badge variant="destructive" className="text-[10px] h-4">
          Wajib
        </Badge>
      )}
    </div>
  );
}
