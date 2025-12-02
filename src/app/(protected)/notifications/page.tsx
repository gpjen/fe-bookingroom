"use client";

import { useState, useEffect } from "react";
import { Activity, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Notification,
  NotificationItem,
} from "./_components/notification-item";
import { isToday, isYesterday } from "date-fns";

// Mock Data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Booking Dikonfirmasi",
    message:
      "Pemesanan ruangan Meeting Room A untuk tanggal 25 Nov 2024 telah disetujui oleh admin.",
    type: "success",
    category: "booking",
    timestamp: new Date().toISOString(),
    isRead: false,
    link: "/bookings/123",
  },
  {
    id: "2",
    title: "Jadwal Maintenance",
    message:
      "Akan dilakukan pemeliharaan AC di Lantai 3 pada hari Sabtu, 30 Nov 2024 pukul 09:00 - 12:00.",
    type: "warning",
    category: "maintenance",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
  {
    id: "3",
    title: "Pembayaran Berhasil",
    message: "Pembayaran sewa bulan November telah diterima. Terima kasih.",
    type: "info",
    category: "system",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
  {
    id: "4",
    title: "Pengingat Check-out",
    message:
      "Masa sewa kamar 301 akan berakhir dalam 3 hari. Mohon lakukan perpanjangan jika ingin melanjutkan.",
    type: "warning",
    category: "booking",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
    link: "/properties/buildings/1/rooms/301",
  },
  {
    id: "5",
    title: "Gangguan Teknis",
    message:
      "Mohon maaf, lift utama sedang mengalami gangguan. Teknisi sedang dalam perjalanan.",
    type: "error",
    category: "maintenance",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    isRead: true,
  },
  {
    id: "6",
    title: "Pembayaran Tertunda",
    message:
      "Pembayaran untuk periode Desember 2024 belum kami terima. Mohon segera lakukan pembayaran.",
    type: "error",
    category: "system",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 800);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    toast.success("Notifikasi ditandai sudah dibaca");
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Semua notifikasi ditandai sudah dibaca");
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const groupedNotifications = {
    today: filteredNotifications.filter((n) => isToday(new Date(n.timestamp))),
    yesterday: filteredNotifications.filter((n) =>
      isYesterday(new Date(n.timestamp))
    ),
    older: filteredNotifications.filter(
      (n) =>
        !isToday(new Date(n.timestamp)) && !isYesterday(new Date(n.timestamp))
    ),
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Card className="overflow-hidden">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" /> Notifikasi
            </h1>
            <p className="text-muted-foreground mt-1">
              Daftar lengkap notifikasi dalam sistem.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                Notifikasi
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-[20px] px-1.5 text-xs font-bold"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notifications.length} notifikasi total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Tandai Semua Dibaca</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-[320px] grid-cols-2 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Semua
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-[20px] px-1.5 text-xs"
              >
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm">
              Belum Dibaca
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Card className="overflow-hidden shadow-sm">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  Tidak ada notifikasi
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "unread"
                    ? "Anda sudah membaca semua notifikasi"
                    : "Belum ada notifikasi untuk ditampilkan"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {groupedNotifications.today.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm border-b">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          Hari Ini
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4 text-[10px] px-1.5"
                        >
                          {groupedNotifications.today.length}
                        </Badge>
                      </div>
                    </div>
                    {groupedNotifications.today.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                  </>
                )}

                {groupedNotifications.yesterday.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-muted/30 backdrop-blur-sm border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Kemarin
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4 text-[10px] px-1.5"
                        >
                          {groupedNotifications.yesterday.length}
                        </Badge>
                      </div>
                    </div>
                    {groupedNotifications.yesterday.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                  </>
                )}

                {groupedNotifications.older.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-muted/20 backdrop-blur-sm border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Lebih Lama
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4 text-[10px] px-1.5"
                        >
                          {groupedNotifications.older.length}
                        </Badge>
                      </div>
                    </div>
                    {groupedNotifications.older.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </Card>
        </Tabs>
      </div>
    </Card>
  );
}
