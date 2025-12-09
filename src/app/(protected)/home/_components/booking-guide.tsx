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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Panduan Booking Kamar
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Cara pemesanan dan ketentuan yang berlaku
          </p>
        </SheetHeader>

        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              Ketersediaan kamar mengikuti konfigurasi admin.
            </AlertDescription>
          </Alert>

          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Cara Pemesanan</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <StepItem number="1" title="Pilih Area & Tanggal" />
                <StepItem number="2" title="Masukkan Jumlah Orang" />
                <StepItem number="3" title="Lihat Ketersediaan" />
                <StepItem number="4" title="Request Booking" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Aturan Alokasi</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <RuleItem
                  icon={<Briefcase className="h-4 w-4" />}
                  title="Karyawan"
                />
                <RuleItem
                  icon={<User className="h-4 w-4" />}
                  title="Tamu (Non-Karyawan)"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Ketentuan Gender</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <GenderItem
                  icon={<Mars className="h-4 w-4" />}
                  label="Khusus Pria"
                />
                <GenderItem
                  icon={<Venus className="h-4 w-4" />}
                  label="Khusus Wanita"
                />
                <GenderItem
                  icon={<Users className="h-4 w-4" />}
                  label="Campur (Keluarga)"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-4 text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <p>Untuk bantuan, hubungi tim HR atau Administrator.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepItem({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center justify-center">
        {number}
      </div>
      <span className="text-sm">{title}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
    </div>
  );
}

function RuleItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
      {icon}
      <span className="text-sm">{title}</span>
    </div>
  );
}

function GenderItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 p-2">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
