"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  markNotificationAsRead,
  getNotificationState,
  NotificationWithDetail,
  markAllNotificationsAsRead,
} from "@/app/(protected)/notifications/_actions/notifications.actions";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  userId?: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationWithDetail[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await getNotificationState(userId);

      if (result.success) {
        setCount(result.count);
        // Limit to max 20 items for dropdown
        setItems(result.data.slice(0, 20));
      }
    } catch {
      // Ignore errors silently for UI polling
    }
  }, [userId]);

  // Initial load & Poll every 60s
  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };

    void init();

    const interval = setInterval(() => {
      void fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData, userId]);

  // Refresh when opened
  useEffect(() => {
    if (open && userId) {
      const refresh = async () => {
        await fetchData();
      };
      void refresh();
    }
  }, [open, fetchData, userId]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    await markNotificationAsRead(id);
    void fetchData();
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    if (!userId || count === 0) return;
    await markAllNotificationsAsRead(userId);
    void fetchData();
    router.refresh();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <Check className="h-3 w-3 text-emerald-500" />;
      case "WARNING":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "ERROR":
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return <Info className="h-3 w-3 text-primary" />;
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  if (!userId) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground/50 cursor-not-allowed"
        disabled
      >
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-muted/50"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold animate-pulse"
              variant="destructive"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[320px] p-0 shadow-lg border-border/50"
        collisionPadding={16}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Notifikasi</h4>
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {count} baru
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={handleMarkAllRead}
                    title="Tandai semua sudah dibaca"
                  >
                    <CheckCheck className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notification List - Ultra Compact */}
        <ScrollArea className="max-h-[480px]">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5 p-2">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                <Bell className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-medium text-foreground mb-0.5">
                Tidak ada notifikasi
              </p>
              <p className="text-[10px] text-muted-foreground">
                Semua pesan sudah ditinjau
              </p>
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer p-0 focus:bg-muted/30 focus:text-foreground"
                  asChild
                >
                  <Link
                    href={item.notification.link || "/notifications"}
                    prefetch={false}
                    className="block"
                    onClick={() => handleMarkRead(item.id)}
                  >
                    <div className="flex items-start gap-2 p-2 hover:bg-muted/20 transition-colors border-b border-border/30 last:border-0">
                      {/* Icon - Compact */}
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          item.notification.type === "SUCCESS" &&
                            "bg-emerald-500/10",
                          item.notification.type === "WARNING" &&
                            "bg-amber-500/10",
                          item.notification.type === "ERROR" &&
                            "bg-destructive/10",
                          !["SUCCESS", "WARNING", "ERROR"].includes(
                            item.notification.type
                          ) && "bg-primary/10"
                        )}
                      >
                        {getNotificationIcon(item.notification.type)}
                      </div>

                      {/* Content - Ultra Compact */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold leading-tight truncate">
                              {item.notification.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="text-[9px] text-muted-foreground/70 font-medium uppercase tracking-tight">
                              {item.notification.type}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-0.5 hover:bg-background/50"
                              onClick={(e) => handleMarkRead(item.id, e)}
                              title="Tandai sudah dibaca"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-1 leading-tight">
                          {truncateMessage(item.notification.message, 50)}
                        </p>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[9px] text-muted-foreground/60 font-medium">
                            {formatDistanceToNow(new Date(item.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                          <span className="text-[8px] px-1 py-0.5 rounded bg-muted/30 text-muted-foreground font-medium">
                            #{item.notification.category || "UMUM"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Ultra Compact */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-2 py-1.5">
          <div className="flex items-center justify-between gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 hover:bg-muted/30"
              asChild
            >
              <Link href="/notifications" prefetch={false}>
                Lihat Semua
              </Link>
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {items.length} dari {count} notifikasi
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
