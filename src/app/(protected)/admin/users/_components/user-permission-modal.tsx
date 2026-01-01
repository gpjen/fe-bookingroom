"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { User as UserType } from "./types";
import {
  grantUserPermission,
  getUserPermissions,
  revokeUserPermission,
} from "../_actions/users.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { getMasterData } from "@/app/_actions/master-data.actions";

interface UserPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
  onSuccess?: () => void;
}

type UserPermissionItem = {
  id: string;
  permissionKey: string;
  permissionDescription: string | null;
  grantedBy: string | null;
  reason: string | null;
  expiresAt: Date | null;
  grantedAt: Date;
  isExpired: boolean;
};

type PermissionOption = {
  id: string;
  key: string;
  description: string | null;
  category: string | null;
};

export function UserPermissionModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserPermissionModalProps) {
  const [permissions, setPermissions] = useState<UserPermissionItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    PermissionOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Grant form state
  const [selectedPermission, setSelectedPermission] = useState("");
  const [reason, setReason] = useState("");
  const [expirationDays, setExpirationDays] = useState<string>("never");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userPermsResult, masterData] = await Promise.all([
        getUserPermissions(user.id),
        getMasterData({ permissions: true }),
      ]);

      if (userPermsResult.success) {
        setPermissions(userPermsResult.data);
      }

      setAvailablePermissions(masterData.permissions);
    } catch (error) {
      console.error("[FETCH_USER_PERMISSIONS_ERROR]", error);
      toast.error("Gagal mengambil data permissions");
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  // Fetch data
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleGrant = async () => {
    if (!selectedPermission) {
      toast.error("Pilih permission terlebih dahulu");
      return;
    }

    try {
      let expiresAt: Date | undefined = undefined;

      if (expirationDays !== "never") {
        const days = parseInt(expirationDays);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const result = await grantUserPermission({
        userId: user.id,
        permissionKey: selectedPermission,
        reason: reason || undefined,
        expiresAt,
      });

      if (result.success) {
        toast.success("Permission berhasil diberikan");
        setSelectedPermission("");
        setReason("");
        setExpirationDays("never");
        await fetchData();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("[GRANT_PERMISSION_ERROR]", error);
      toast.error("Gagal memberikan permission");
    }
  };

  const handleRevoke = async (permissionKey: string) => {
    try {
      const result = await revokeUserPermission(user.id, permissionKey);

      if (result.success) {
        toast.success("Permission berhasil dicabut");
        await fetchData();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("[REVOKE_PERMISSION_ERROR]", error);
      toast.error("Gagal mencabut permission");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-xl flex flex-col p-0 h-full"
        side="right"
        aria-describedby="user-permission-desc"
      >
        <SheetHeader className="p-6 pb-4 text-left">
          <SheetTitle>User-Specific Permissions</SheetTitle>
          <SheetDescription id="user-permission-desc">
            {user.displayName} ({user.username})
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Grant New Permission Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Berikan Permission Baru
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select
                  value={selectedPermission}
                  onValueChange={setSelectedPermission}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih permission..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availablePermissions.map((perm) => (
                      <SelectItem key={perm.id} value={perm.key}>
                        <div className="flex flex-col">
                          <span className="font-medium">{perm.key}</span>
                          {perm.description && (
                            <span className="text-xs text-muted-foreground">
                              {perm.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Masa Berlaku</Label>
                <Select
                  value={expirationDays}
                  onValueChange={setExpirationDays}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Permanent</SelectItem>
                    <SelectItem value="1">1 Hari</SelectItem>
                    <SelectItem value="7">7 Hari</SelectItem>
                    <SelectItem value="30">30 Hari</SelectItem>
                    <SelectItem value="90">90 Hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Alasan (Opsional)</Label>
                <Textarea
                  placeholder="Mengapa permission ini diberikan..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <Button onClick={handleGrant} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Berikan Permission
            </Button>
          </div>

          <Separator />

          {/* Current Permissions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Permission yang Diberikan</h3>
              <Badge variant="secondary">{permissions.length} items</Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada user-specific permission
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className={`p-3 border rounded-lg ${
                      perm.isExpired
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="font-mono text-sm font-semibold">
                            {perm.permissionKey}
                          </code>
                          {perm.isExpired ? (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>

                        {perm.permissionDescription && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {perm.permissionDescription}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Granted: {formatDate(perm.grantedAt)}
                          </span>
                          {perm.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {formatDate(perm.expiresAt)}
                            </span>
                          )}
                        </div>

                        {perm.reason && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            &quot;{perm.reason}&quot;
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleRevoke(perm.permissionKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
