"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Users2,
  ShieldCheck,
  MapPinned,
  Hotel,
  CalendarCheck2,
  ListChecks,
  DoorOpen,
  BedDouble,
  ClipboardList,
  BarChart3,
  Wallet,
  Bell,
  Settings,
  User2,
  ChevronDown,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuItem, AppSidebarProps } from "@/types/sidebar-types";
import { performLogout } from "@/lib/auth/logout-utils";

// Menu Configuration
const menuConfig: MenuItem[] = [
  {
    type: "single",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
    permissions: ["dashboard:read"],
  },
  {
    type: "single",
    href: "/booking/calendar",
    label: "Calendar View",
    icon: CalendarCheck2,
    active: true,
    permissions: ["calendar:read"],
  },
  {
    type: "single",
    href: "/booking/list",
    label: "All Bookings",
    icon: ListChecks,
    active: true,
    permissions: ["booking:read"],
  },
  {
    type: "single",
    href: "/booking/mine",
    label: "My Bookings",
    icon: DoorOpen,
    active: true,
    permissions: ["booking-mine:read"],
  },
  {
    type: "single",
    href: "/booking/requests",
    label: "Pending Requests",
    icon: ClipboardList,
    active: true,
    permissions: ["booking-request:read"],
    badge: "5",
  },
  {
    type: "single",
    href: "/reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    active: true,
    permissions: ["reports:read"],
  },
  {
    type: "single",
    href: "/payments",
    label: "Payments",
    icon: Wallet,
    active: true,
    permissions: ["payments:read"],
  },
  {
    type: "single",
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    active: true,
    badge: "3",
  },
  {
    type: "group",
    label: "Property Management",
    active: true,
    permissions: ["property:read"],
    items: [
      {
        href: "/properties/areas",
        label: "Areas",
        icon: MapPinned,
        active: true,
        permissions: ["area:read"],
      },
      {
        href: "/properties/buildings",
        label: "Buildings",
        icon: Building2,
        active: true,
        permissions: ["property:read"],
      },
      {
        href: "/properties/rooms",
        label: "Rooms",
        icon: Hotel,
        active: true,
        permissions: ["property:read"],
      },
      {
        href: "/properties/facilities",
        label: "Facilities",
        icon: BedDouble,
        active: true,
        permissions: ["property:read"],
      },
    ],
  },
  {
    type: "group",
    label: "Administration",
    active: true,
    permissions: ["admin:read"],
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users2,
        active: true,
        permissions: ["admin:read"],
      },
      {
        href: "/admin/roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        active: true,
        permissions: ["admin:read"],
      },
      {
        href: "/admin/company-access",
        label: "Company Access",
        icon: Building2,
        active: true,
        permissions: ["admin:read"],
      },
      {
        href: "/admin/settings",
        label: "System Settings",
        icon: Settings,
        active: true,
        permissions: ["admin:read"],
      },
    ],
  },
];

// Helper function to check if user has permission
const hasPermission = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[] | undefined
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes("*")) return true;
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

// Helper function to filter menu items based on permissions
const filterMenuItems = (
  items: MenuItem[],
  userPermissions: string[] | undefined
): MenuItem[] => {
  return items
    .filter((item) => {
      if (!hasPermission(userPermissions, item.permissions)) return false;
      if (item.type === "group") {
        const filteredSubItems = item.items.filter((subItem) =>
          hasPermission(userPermissions, subItem.permissions)
        );
        return filteredSubItems.length > 0;
      }
      return true;
    })
    .map((item) => {
      if (item.type === "group") {
        return {
          ...item,
          items: item.items.filter((subItem) =>
            hasPermission(userPermissions, subItem.permissions)
          ),
        };
      }
      return item;
    });
};

// Single Menu Item Component
const SingleMenuItem = ({
  item,
  isActive,
}: {
  item: MenuItem & { type: "single" };
  isActive: boolean;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={item.label}
      className="h-9"
    >
      <Link href={item.href} className="flex items-center gap-2">
        {item.icon && <item.icon className="size-4" />}
        <span className="text-sm font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

// Group Menu Item Component
const GroupMenuItem = ({
  item,
  pathname,
  defaultOpen,
}: {
  item: MenuItem & { type: "group" };
  pathname: string;
  defaultOpen: boolean;
}) => (
  <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.label} className="h-9">
        <CollapsibleTrigger className="group/label flex w-full items-center gap-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&[data-state=open]>svg]:rotate-180">
          <div className="flex size-4 items-center justify-center">
            <div className="size-1.5 rounded-full bg-muted-foreground/50" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">
            {item.label}
          </span>
          <ChevronDown className="size-4 transition-transform duration-200" />
        </CollapsibleTrigger>
      </SidebarMenuButton>
      <CollapsibleContent>
        <SidebarMenuSub className="ml-0 border-l-0 px-0">
          {item.items?.map((subItem) => {
            const isActive = pathname === subItem.href;
            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isActive}
                  className="h-8"
                >
                  <Link
                    href={subItem.href}
                    className="flex items-center gap-2 pl-8"
                  >
                    <subItem.icon className="size-4" />
                    <span className="text-sm">{subItem.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </SidebarMenuItem>
  </Collapsible>
);

// User Menu Component
const UserMenuDropdown = ({
  userName,
  email,
  userInitials,
  onLogout,
}: {
  userName?: string;
  email?: string;
  userInitials: string;
  onLogout: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <SidebarMenuButton
        size="lg"
        className="h-12 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
      >
        <Avatar className="h-8 w-8 rounded-lg border-2 border-background shadow-sm">
          <AvatarImage alt={userName} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate text-xs font-semibold uppercase">
            {userName || "User Account"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {email || ""}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </SidebarMenuButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className="w-[240px] rounded-xl"
      side="top"
      align="end"
      sideOffset={8}
    >
      <div className="flex items-center gap-2 p-2">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage alt={userName} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm">
          <span className="font-semibold">{userName || "User Account"}</span>
          <span className="text-xs text-muted-foreground">{email || ""}</span>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
        <User2 className="size-4 text-muted-foreground" />
        <span>Profile Settings</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
        <Settings className="size-4 text-muted-foreground" />
        <span>Preferences</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="size-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export function AppSidebar({
  userName,
  email,
  userPermissions,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();
  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  // Filter menu items based on user permissions
  const visibleMenuItems = filterMenuItems(menuConfig, userPermissions);

  // Expand sidebar if a submenu is active on initial render
  useEffect(() => {
    const hasActiveSubmenu = visibleMenuItems.some(
      (it) =>
        it.type === "group" &&
        it.items?.some((s) => pathname.startsWith(s.href))
    );
    if (hasActiveSubmenu && state === "collapsed") setOpen(true);
  }, [pathname, visibleMenuItems, state, setOpen]);

  const { data: session } = useSession();
  const handleLogout = async () => {
    await performLogout(session);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link href="/" className="gap-2">
                <div className="flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo-1.png"
                    alt="Logo"
                    width={44}
                    height={44}
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    E-BOOKING
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    HARITA LYGEND
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2">
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleMenuItems.map((item) => {
                if (item.type === "single") {
                  const isActive = pathname === item.href;
                  return (
                    <SingleMenuItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                    />
                  );
                }

                const isGroupActive = item.items?.some(
                  (sub) =>
                    pathname === sub.href || pathname.startsWith(sub.href)
                );
                return (
                  <GroupMenuItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    defaultOpen={Boolean(isGroupActive)}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenuDropdown
              userName={userName}
              email={email}
              userInitials={userInitials}
              onLogout={handleLogout}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
