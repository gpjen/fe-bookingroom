"use client";

import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Check, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  onMarkAsRead
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />;
    }
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (notification.link) {
      return (
        <Link 
          href={notification.link}
          className="flex-1 flex items-start gap-4 p-4 cursor-pointer"
        >
          {children}
        </Link>
      );
    }
    return (
      <div className="flex-1 flex items-start gap-4 p-4 cursor-default">
        {children}
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center border-b last:border-0 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
      )}
    >
      <ContentWrapper>
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "text-sm leading-none",
              !notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(notification.timestamp), { 
                addSuffix: true,
                locale: idLocale 
              })}
            </span>
          </div>
          <p className={cn(
            "text-sm line-clamp-2",
            !notification.isRead ? "text-foreground/90" : "text-muted-foreground"
          )}>
            {notification.message}
          </p>
        </div>
      </ContentWrapper>

      {/* Actions */}
      <div className="flex items-center gap-2 pr-4 pl-2 shrink-0">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Tandai sudah dibaca"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {notification.link && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}
