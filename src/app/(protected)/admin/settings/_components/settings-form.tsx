"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Imports from new structure
import {
  systemSettingsSchema,
  type SystemSettingsInput,
} from "../_actions/settings.schema";
import { updateSystemSettings } from "../_actions/settings.actions";

interface SettingsFormProps {
  initialData: SystemSettingsInput;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // FIX: Removed explicit generic <SystemSettingsInput> to allow correct type inference from resolver
  // This solves specific lint errors with optional vs undefined types
  const form = useForm({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  async function onSubmit(data: SystemSettingsInput) {
    setIsLoading(true);
    try {
      const result = await updateSystemSettings(data);
      if (result.success) {
        toast.success("Pengaturan berhasil disimpan");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  }

  // Watch maintenance mode for conditional rendering
  const maintenanceEnabled = form.watch("maintenance.enabled");

  return (
    <Form {...form}>
      {/* 
          Note: We cast handleSubmit argument to any to bypass strict checks 
          if type inference mismatch persists, but with schema fix it should be fine.
      */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="general">Umum</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
            <TabsTrigger value="system">Sistem</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Umum</CardTitle>
                <CardDescription>
                  Konfigurasi dasar informasi aplikasi dan preferensi regional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="general.appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Aplikasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Booking Room System" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nama yang akan ditampilkan di header dan email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="general.supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Support</FormLabel>
                      <FormControl>
                        <Input placeholder="booking@obi-site.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email untuk kontak bantuan pengguna.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Whatsapp */}
                <FormField
                  control={form.control}
                  name="general.supportWhatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Whatsapp Support</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://wa.me/628123456789"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Link Whatsapp untuk kontak bantuan pengguna.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Helpdesk */}
                <FormField
                  control={form.control}
                  name="general.supportHelpdesk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Helpdesk Support</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="http://helpdesk.obi-site.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Link Helpdesk untuk kontak bantuan pengguna.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="general.timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Waktu</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih zona waktu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Asia/Jakarta">
                              WIB (Jakarta)
                            </SelectItem>
                            <SelectItem value="Asia/Makassar">
                              WITA (Makassar)
                            </SelectItem>
                            <SelectItem value="Asia/Jayapura">
                              WIT (Jayapura)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="general.dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format Tanggal</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih format tanggal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dd/MM/yyyy">
                              DD/MM/YYYY
                            </SelectItem>
                            <SelectItem value="MM/dd/yyyy">
                              MM/DD/YYYY
                            </SelectItem>
                            <SelectItem value="yyyy-MM-dd">
                              YYYY-MM-DD
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Settings */}
          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <CardTitle>Aturan Booking</CardTitle>
                <CardDescription>
                  Kelola kebijakan peminjaman ruangan dan persetujuan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Booking Akhir Pekan
                    </FormLabel>
                    <FormDescription>
                      Izinkan pengguna melakukan booking pada hari Sabtu dan
                      Minggu.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="booking.allowWeekendBooking"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FormControl>
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Wajib Persetujuan
                    </FormLabel>
                    <FormDescription>
                      Setiap booking memerlukan persetujuan admin atau manajer.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="booking.requiresApproval"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FormControl>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="booking.maxBookingDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durasi Maksimal (Jam)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            value={(field.value as string | number) || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Batas waktu maksimal penggunaan ruangan.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="booking.minAdvanceBooking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimal Dimuka (Hari)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              value={(field.value as string | number) || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="booking.maxAdvanceBooking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimal Dimuka (Hari)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              value={(field.value as string | number) || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="booking.operatingHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Mulai Operasional</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="booking.operatingHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Selesai Operasional</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>
                  Atur bagaimana sistem mengirimkan pemberitahuan kepada
                  pengguna.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Notifikasi Email
                    </FormLabel>
                    <FormDescription>
                      Kirim konfirmasi dan pengingat via email.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="notifications.enableEmail"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FormControl>
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Push Notification
                    </FormLabel>
                    <FormDescription>
                      Tampilkan notifikasi di dalam aplikasi.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="notifications.enablePush"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FormControl>
                </div>

                <FormField
                  control={form.control}
                  name="notifications.reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Pengingat</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih waktu pengingat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 Menit sebelum</SelectItem>
                          <SelectItem value="30">30 Menit sebelum</SelectItem>
                          <SelectItem value="60">1 Jam sebelum</SelectItem>
                          <SelectItem value="1440">1 Hari sebelum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Kapan sistem harus mengirimkan pengingat booking.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Pengaturan ini dapat mempengaruhi ketersediaan sistem secara
                  keseluruhan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Perhatian</AlertTitle>
                  <AlertDescription>
                    Mengaktifkan Mode Pemeliharaan akan mencegah pengguna
                    (kecuali Admin) mengakses sistem.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-row items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-destructive">
                      Mode Pemeliharaan
                    </FormLabel>
                    <FormDescription className="text-destructive/80">
                      Aktifkan mode maintenance untuk perbaikan sistem.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="maintenance.enabled"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Toggle maintenance mode"
                        />
                      )}
                    />
                  </FormControl>
                </div>

                {maintenanceEnabled && (
                  <FormField
                    control={form.control}
                    name="maintenance.message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pesan Pemeliharaan</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Pesan yang akan ditampilkan kepada pengguna saat
                          mencoba akses.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
