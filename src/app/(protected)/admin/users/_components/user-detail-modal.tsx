"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  Building2,
  Calendar,
  UserCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Key,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { User as UserType } from "./types";
import { getUserPermissions } from "../_actions/users.actions";

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

type UserPermissionItem = {
  id: string;
  permissionKey: string;
  permissionDescription: string | null;
  isExpired: boolean;
  expiresAt: Date | null;
  grantedAt: Date;
};

export function UserDetailModal({
  open,
  onOpenChange,
  user,
}: UserDetailModalProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermissionItem[]>(
    []
  );
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const fetchUserPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    try {
      const result = await getUserPermissions(user.id);
      if (result.success) {
        setUserPermissions(result.data);
      }
    } catch (error) {
      console.error("[FETCH_USER_PERMISSIONS]", error);
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (open) {
      fetchUserPermissions();
    }
  }, [open, fetchUserPermissions]);

  // Get active permissions count
  const activePermissions = userPermissions.filter((p) => !p.isExpired);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl">Detail Pengguna</SheetTitle>
              <SheetDescription>Informasi lengkap pengguna</SheetDescription>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute right-6 top-6">
            {user.status ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Akun Aktif
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Akun Non-Aktif
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Content - Now scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 pt-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Informasi Akun
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Username
                </p>
                <p className="font-mono text-sm font-semibold">
                  {user.username}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5" />
                  Nama Lengkap
                </p>
                <p className="font-medium">{user.displayName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                <p className="text-sm break-all">{user.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Hak Akses (Roles)
            </h3>
            {user.userRoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {user.userRoles.map((ur) => (
                  <div
                    key={ur.id}
                    className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30"
                  >
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {ur.role.name}
                      </p>
                      {ur.role.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {ur.role.description}
                        </p>
                      )}
                    </div>
                    {ur.company && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {ur.company.code}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Belum ada role yang diberikan
              </p>
            )}
          </div>

          <Separator />

          {/* User-Specific Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                Permission Tambahan (User-Specific)
              </h3>
              {activePermissions.length > 0 && (
                <Badge variant="secondary">
                  {activePermissions.length} active
                </Badge>
              )}
            </div>

            {isLoadingPermissions ? (
              <p className="text-sm text-muted-foreground">
                Loading permissions...
              </p>
            ) : userPermissions.length > 0 ? (
              <div className="space-y-2">
                {userPermissions.map((perm) => (
                  <div
                    key={perm.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-md border ${
                      perm.isExpired
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <code className="font-mono text-xs font-semibold truncate">
                          {perm.permissionKey}
                        </code>
                        {perm.isExpired && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] h-4 px-1"
                          >
                            Expired
                          </Badge>
                        )}
                      </div>
                      {perm.permissionDescription && (
                        <p className="text-xs text-muted-foreground truncate">
                          {perm.permissionDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>Granted: {formatDate(perm.grantedAt)}</span>
                        {perm.expiresAt && (
                          <>
                            <span>•</span>
                            <span>Expires: {formatDate(perm.expiresAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Tidak ada permission tambahan
              </p>
            )}
          </div>

          <Separator />

          {/* Company Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              Akses Perusahaan
            </h3>
            {user.userCompanies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.userCompanies.map((uc) => (
                  <Badge
                    key={uc.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-medium">{uc.company.code}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{uc.company.name}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Belum ada akses perusahaan
              </p>
            )}
          </div>

          <Separator />

          {/* Building Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Akses Gedung
            </h3>
            {user.userBuildings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {user.userBuildings.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {ub.building.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ub.building.code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Belum ada akses gedung
              </p>
            )}
          </div>

          <Separator />

          {/* Audit Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Informasi Audit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Dibuat
                </p>
                <p className="font-mono text-xs">
                  {formatDate(user.createdAt)}
                </p>
                {user.createdBy && (
                  <p className="text-xs text-muted-foreground">
                    User ID: <code className="font-mono">{user.createdBy}</code>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Terakhir Diupdate
                </p>
                <p className="font-mono text-xs">
                  {formatDate(user.updatedAt)}
                </p>
                {user.updatedBy && (
                  <p className="text-xs text-muted-foreground">
                    User ID: <code className="font-mono">{user.updatedBy}</code>
                  </p>
                )}
              </div>

              {user.lastLogin && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Login Terakhir
                  </p>
                  <p className="font-mono text-xs">
                    {formatDate(user.lastLogin)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
