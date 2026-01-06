"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { NotificationItem } from "./notification-item";
import { isToday, isYesterday } from "date-fns";
import {
  NotificationWithDetail,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../_actions/notifications.actions";

interface NotificationsViewProps {
  initialData: NotificationWithDetail[];
  userId: string;
}

export function NotificationsView({
  initialData,
  userId,
}: NotificationsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      toast.success("Notifikasi ditandai sudah dibaca");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead(userId);
    if (res.success) {
      toast.success("Semua notifikasi ditandai sudah dibaca");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  // Transform Nested DB Data to Flat UI Model
  const notifications = initialData.map((item) => ({
    id: item.id, // Recipient ID
    title: item.notification.title,
    message: item.notification.message,
    type: item.notification.type.toLowerCase() as
      | "info"
      | "success"
      | "warning"
      | "error",
    category: item.notification.category.toLowerCase() as
      | "system"
      | "booking"
      | "maintenance",
    timestamp: new Date(item.createdAt).toISOString(),
    isRead: item.isRead,
    link: item.notification.link || undefined,
  }));

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

  return (
    <Card className="p-3 md:p-6 lg:p-8">
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
