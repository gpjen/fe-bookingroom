"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  getUnreadNotificationsCount,
  getRecentUnreadNotifications,
  markNotificationAsRead,
  NotificationWithDetail,
} from "@/app/(protected)/notifications/_actions/notifications.actions";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface NotificationDropdownProps {
  userId?: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationWithDetail[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const [countRes, itemsRes] = await Promise.all([
        getUnreadNotificationsCount(userId),
        getRecentUnreadNotifications(userId),
      ]);

      if (countRes.success) setCount(countRes.count);
      if (itemsRes.success) setItems(itemsRes.data);
    } catch {
      // Ignore errors silently for UI polling
    }
  }, [userId]);

  // Initial load & Poll every 60s
  useEffect(() => {
    // Wrap in async IIFE to satisfy strict linters avoiding sync effect callbacks
    const init = async () => {
      await fetchData();
    };
    void init();

    const interval = setInterval(() => {
      void fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh when opened
  useEffect(() => {
    if (open) {
      const refresh = async () => {
        await fetchData();
      };
      void refresh();
    }
  }, [open, fetchData]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markNotificationAsRead(id);
    void fetchData(); // Refresh local list
    router.refresh(); // Refresh page content
  };

  if (!userId) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground/50 cursor-not-allowed"
      >
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          {count > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
              {count} Baru
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <span className="text-xs">Tidak ada notifikasi baru</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer items-start gap-3 p-3 focus:bg-muted/50"
                  asChild
                >
                  <Link
                    href={item.notification.link || "/notifications"}
                    onClick={() => {
                      setItems((prev) => prev.filter((i) => i.id !== item.id));
                      setCount((prev) => Math.max(0, prev - 1));
                      void markNotificationAsRead(item.id);
                    }}
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        item.notification.type === "SUCCESS"
                          ? "bg-green-500"
                          : item.notification.type === "WARNING"
                          ? "bg-yellow-500"
                          : item.notification.type === "ERROR"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 pt-1">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 -mr-1 hover:bg-background hover:text-primary"
                      onClick={(e) => handleMarkRead(item.id, e)}
                      title="Tandai sudah dibaca"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button variant="outline" className="w-full h-8 text-xs" asChild>
            <Link href="/notifications">Lihat Semua Notifikasi</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
