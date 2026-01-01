"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Check,
  ChevronRight,
  Calendar,
  Wrench,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ContentWrapper({
  children,
  link,
  onClick,
}: {
  children: React.ReactNode;
  link?: string;
  onClick?: () => void;
}) {
  if (link) {
    return (
      <Link
        href={link}
        className="flex-1 flex items-start gap-3 p-3 group/link"
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <div
      className={cn(
        "flex-1 flex items-start gap-3 p-3",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "booking" | "system" | "maintenance";
  timestamp: string;
  isRead: boolean;
  link?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
    },
    error: {
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
    },
    info: {
      icon: Info,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
  };

  const categoryConfig = {
    booking: {
      label: "Booking",
      icon: Calendar,
    },
    maintenance: {
      label: "Maintenance",
      icon: Wrench,
    },
    system: {
      label: "System",
      icon: CreditCard,
    },
  };

  const config = typeConfig[notification.type];
  const categoryInfo = categoryConfig[notification.category];
  const Icon = config.icon;
  const CategoryIcon = categoryInfo.icon;

  return (
    <div
      className={cn(
        "group relative flex items-center transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-primary/[0.02] border-l-2 border-l-primary"
      )}
    >
      <ContentWrapper
        link={notification.link}
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      >
        {/* Icon - Compact */}
        <div
          className={cn(
            "shrink-0 flex items-center justify-center h-8 w-8 rounded-lg",
            config.bgColor
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        {/* Content - Compact */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h4
                className={cn(
                  "text-sm leading-tight truncate",
                  !notification.isRead
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground"
                )}
              >
                {notification.title}
              </h4>
              {!notification.isRead && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 gap-1 shrink-0"
              >
                <CategoryIcon className="h-2.5 w-2.5" />
                {categoryInfo.label}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true,
                locale: idLocale,
              })}
            </span>
          </div>

          <p
            className={cn(
              "text-xs leading-relaxed line-clamp-2",
              !notification.isRead
                ? "text-foreground/80"
                : "text-muted-foreground"
            )}
          >
            {notification.message}
          </p>

          {notification.link && (
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium pt-0.5">
              <span>Lihat detail</span>
              <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      </ContentWrapper>

      {/* Actions - Only Mark as Read */}
      {!notification.isRead && (
        <div className="pr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onMarkAsRead(notification.id);
            }}
            title="Tandai sudah dibaca"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
