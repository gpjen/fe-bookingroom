import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";

export function CompactProfileCard({
  label,
  name,
  identifier,
  company,
  department,
  phone,
  email,
  variant = "blue",
}: {
  label: string;
  name: string;
  identifier: string;
  company: string;
  department: string;
  phone?: string;
  email?: string;
  variant?: "blue" | "amber";
}) {
  const styles = {
    blue: {
      bg: "bg-blue-50/50 dark:bg-blue-900/10",
      border: "border-blue-100 dark:border-blue-900/20",
      icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    amber: {
      bg: "bg-amber-50/50 dark:bg-amber-900/10",
      border: "border-amber-100 dark:border-amber-900/20",
      icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
  }[variant];

  return (
    <div
      className={cn(
        "p-3 rounded-lg border flex items-start gap-3",
        styles.bg,
        styles.border
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
          styles.icon
        )}
      >
        {label === "PIC" ? "PIC" : name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate">{name}</p>
          <span className="text-[10px] uppercase font-bold text-muted-foreground border px-1.5 py-0.5 rounded bg-background/50">
            {label}
          </span>
        </div>

        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          <p className="flex items-center gap-1.5">
            <span className="font-mono">{identifier}</span>
            <span>•</span>
            <span className="truncate">{department}</span>
          </p>
          <p className="truncate font-medium opacity-90">{company}</p>

          <div className="flex items-center gap-3 pt-1 mt-1 border-t border-dashed border-gray-200 dark:border-gray-800">
            {phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
