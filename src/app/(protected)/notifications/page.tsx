"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Notification, NotificationItem } from "./_components/notification-item";
import { isToday, isYesterday } from "date-fns";

// Mock Data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Booking Dikonfirmasi",
    message: "Pemesanan ruangan Meeting Room A untuk tanggal 25 Nov 2024 telah disetujui oleh admin.",
    type: "success",
    category: "booking",
    timestamp: new Date().toISOString(), // Today
    isRead: false,
    link: "/bookings/123"
  },
  {
    id: "2",
    title: "Jadwal Maintenance",
    message: "Akan dilakukan pemeliharaan AC di Lantai 3 pada hari Sabtu, 30 Nov 2024 pukul 09:00 - 12:00.",
    type: "warning",
    category: "maintenance",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isRead: false,
  },
  {
    id: "3",
    title: "Pembayaran Berhasil",
    message: "Pembayaran sewa bulan November telah diterima. Terima kasih.",
    type: "info",
    category: "system",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    isRead: true,
  },
  {
    id: "4",
    title: "Pengingat Check-out",
    message: "Masa sewa kamar 301 akan berakhir dalam 3 hari. Mohon lakukan perpanjangan jika ingin melanjutkan.",
    type: "warning",
    category: "booking",
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isRead: true,
    link: "/properties/buildings/1/rooms/301"
  },
  {
    id: "5",
    title: "Gangguan Teknis",
    message: "Mohon maaf, lift utama sedang mengalami gangguan. Teknisi sedang dalam perjalanan.",
    type: "error",
    category: "maintenance",
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    isRead: true,
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    toast.success("Notifikasi ditandai sudah dibaca");
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("Semua notifikasi ditandai sudah dibaca");
  };

  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const groupedNotifications = {
    today: filteredNotifications.filter(n => isToday(new Date(n.timestamp))),
    yesterday: filteredNotifications.filter(n => isYesterday(new Date(n.timestamp))),
    older: filteredNotifications.filter(n => !isToday(new Date(n.timestamp)) && !isYesterday(new Date(n.timestamp))),
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="container max-w-3xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 md:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Notifikasi
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pembaruan aktivitas dan informasi sistem.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
          </Button>
        )}
      </div>

      {/* Content */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[300px] grid-cols-2 mb-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca</TabsTrigger>
        </TabsList>

        <Card>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-4 bg-muted/5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-base">Tidak ada notifikasi</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "unread" 
                  ? "Anda sudah membaca semua notifikasi." 
                  : "Belum ada notifikasi untuk ditampilkan."}
              </p>
            </div>
          ) : (
            <div className="divide-y bg-card">
              {groupedNotifications.today.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 z-10 backdrop-blur-sm">
                    HARI INI
                  </div>
                  {groupedNotifications.today.map(notification => (
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
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 z-10 backdrop-blur-sm">
                    KEMARIN
                  </div>
                  {groupedNotifications.yesterday.map(notification => (
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
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 z-10 backdrop-blur-sm">
                    LEBIH LAMA
                  </div>
                  {groupedNotifications.older.map(notification => (
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
  );
}
