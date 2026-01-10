"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  CalendarCheck2,
  DoorOpen,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  User2,
  ChevronDown,
  LogOut,
  ChevronsUpDown,
  Building,
  Activity,
  Folder,
  Home,
  DoorOpenIcon,
  UsersRound,
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
import {
  MenuItem,
  AppSidebarProps,
  GroupMenuItem as TypesGroupMenuItem,
} from "@/types/sidebar-types";
import { usePermissions } from "@/providers/permissions-provider";
import { performLogout } from "@/lib/auth/logout-utils";

const menuConfig: MenuItem[] = [
  {
    type: "single",
    href: "/home",
    label: "Home",
    icon: Home,
    active: true,
    permissions: ["home:read"],
  },
  {
    type: "single",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
    permissions: ["dashboard:read"],
  },
  {
    type: "group",
    label: "Booking",
    active: true,
    permissions: ["booking:read"],
    icon: CalendarCheck2,
    items: [
      {
        href: "/booking/request",
        label: "Permintaan",
        icon: ClipboardList,
        active: true,
        permissions: ["booking-request:read"],
      },
      {
        href: "/booking/mine",
        label: "Pemesanan Saya",
        icon: DoorOpen,
        active: true,
        permissions: ["booking-mine:read"],
      },
    ],
  },
  {
    type: "single",
    href: "/properties/buildings",
    label: "Bangunan",
    icon: Building,
    active: true,
    permissions: ["building:read"],
  },
  {
    type: "single",
    href: "/occupants",
    label: "Penghuni",
    icon: UsersRound,
    active: true,
    permissions: ["occupant:read"],
  },
  {
    type: "group",
    label: "Master Data",
    active: true,
    permissions: ["property:read"],
    icon: Folder,
    items: [
      {
        href: "/properties/companies",
        label: "Perusahaan",
        icon: Building2,
        active: true,
        permissions: ["companies:read"],
      },
      {
        href: "/properties/areas",
        label: "Areal",
        icon: MapPinned,
        active: true,
        permissions: ["area:read"],
      },
      {
        href: "/properties/building-types",
        label: "Tipe Bangunan",
        icon: Building2,
        active: true,
        permissions: ["building-type:read"],
      },
      {
        href: "/properties/room-types",
        label: "Tipe Ruangan",
        icon: DoorOpenIcon,
        active: true,
        permissions: ["room-type:read"],
      },
    ],
  },
  {
    type: "group",
    label: "Administration",
    active: true,
    permissions: ["admin:read"],
    icon: Settings,
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users2,
        active: true,
        permissions: ["admin-users:read"],
      },
      {
        href: "/admin/roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        active: true,
        permissions: ["admin-roles:read"],
      },
      {
        href: "/admin/settings",
        label: "System Settings",
        icon: Settings,
        active: true,
        permissions: ["admin-settings:read"],
      },
      {
        href: "/admin/logs",
        label: "System Logs",
        icon: Activity,
        active: true,
        permissions: ["admin-logs:read"],
      },
    ],
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
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    active: true,
    // badge: "3",
    permissions: ["notifications:read"],
  },
];

const hasPermission = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[] | undefined
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes("*")) return true;
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

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
      className="h-10"
    >
      <Link href={item.href} className="flex items-center gap-3">
        {item.icon && <item.icon className="size-4 shrink-0" />}
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

const GroupMenuItem = ({
  item,
  pathname,
  isCollapsed,
}: {
  item: TypesGroupMenuItem;
  pathname: string;
  isCollapsed: boolean;
}) => {
  const IconComponent = item.icon || Folder;
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // State persistence for collapsible
  const [isCollapsibleOpen, setIsCollapsibleOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sidebar-group-${item.label}`);
      if (saved !== null) return saved === "true";
    }
    return item.items?.some((sub) => pathname.startsWith(sub.href)) || false;
  });

  // Save to localStorage when changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `sidebar-group-${item.label}`,
        String(isCollapsibleOpen)
      );
    }
  }, [isCollapsibleOpen, item.label]);

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 w-full items-center justify-center rounded-md px-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer border-0 bg-transparent outline-none"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <IconComponent className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-56"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className="px-2 py-1.5 text-sm font-semibold">
              {item.label}
            </div>
            <DropdownMenuSeparator />
            {item.items?.map((subItem) => {
              const isActive = pathname === subItem.href;
              return (
                <DropdownMenuItem key={subItem.href} asChild>
                  <Link
                    href={subItem.href}
                    className={`flex items-center gap-3 ${
                      isActive ? "bg-accent" : ""
                    }`}
                  >
                    <subItem.icon className="size-4" />
                    <span>{subItem.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      open={isCollapsibleOpen}
      onOpenChange={setIsCollapsibleOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-10">
            <div className="flex items-center gap-3 w-full">
              <IconComponent className="size-4 shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">
                {item.label}
              </span>
              <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-0 pl-0 border-none">
            {item.items?.map((subItem) => {
              const isActive = pathname === subItem.href;
              return (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActive}
                    className="h-9"
                  >
                    <Link
                      href={subItem.href}
                      className="flex items-center gap-3 pl-11"
                    >
                      <subItem.icon className="size-4 shrink-0" />
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
};

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
        className="h-14 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
      >
        <Avatar className="h-9 w-9 rounded-lg border-2 border-background shadow-sm">
          <AvatarImage alt={userName} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate text-xs font-semibold uppercase">
            {userName || "User"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {email || ""}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </SidebarMenuButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className="w-[260px] rounded-xl"
      side="top"
      align="end"
      sideOffset={8}
    >
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage alt={userName} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm">
          <span className="font-semibold">{userName || "User"}</span>
          <span className="text-xs text-muted-foreground">{email || ""}</span>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer gap-3 py-2.5">
        <User2 className="size-4 text-muted-foreground" />
        <span>Profile Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer gap-3 py-2.5 text-destructive focus:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="size-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export function AppSidebar({ userName, email }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { permissions } = usePermissions();
  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  const isCollapsed = state === "collapsed";
  const visibleMenuItems = filterMenuItems(menuConfig, permissions);
  const { data: session } = useSession();
  const handleLogout = async () => {
    await performLogout(session);
  };

  return (
    <Sidebar collapsible="offcanvas" className="bg-sidebar">
      <SidebarHeader className="h-16 bg-sidebar/50 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link href="/" className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                  <Image
                    src="/logo-1.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight">
                    E-BOOKING
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground font-medium">
                    HARITA LYGEND
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
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
                return (
                  <GroupMenuItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto p-3">
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
