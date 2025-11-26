"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
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
  KeySquare,
  User2,
  ChevronDown,
  MapPinned,
  Hotel,
  CalendarCheck2,
  ListChecks,
  LogOut,
  Settings,
  ChevronsUpDown,
  DoorOpen,
  BedDouble,
  ClipboardList,
  BarChart3,
  Wallet,
  Bell,
  FileText,
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
import { signOut } from "next-auth/react";

// Menu structure with flexible single items and collapsible groups
const menuStructure = [
  {
    type: "single",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    type: "group",
    label: "Booking Management",
    items: [
      {
        href: "/booking/calendar",
        label: "Calendar View",
        icon: CalendarCheck2,
      },
      { href: "/booking/new", label: "New Booking", icon: DoorOpen },
      { href: "/booking/list", label: "All Bookings", icon: ListChecks },
      {
        href: "/booking/requests",
        label: "Pending Requests",
        icon: ClipboardList,
      },
    ],
  },
  {
    type: "group",
    label: "Property Management",
    items: [
      { href: "/properties/buildings", label: "Buildings", icon: Building2 },
      { href: "/properties/rooms", label: "Rooms", icon: Hotel },
      { href: "/properties/facilities", label: "Facilities", icon: BedDouble },
      { href: "/properties/locations", label: "Locations", icon: MapPinned },
    ],
  },
  {
    type: "single",
    href: "/reports",
    label: "Reports & Analytics",
    icon: BarChart3,
  },
  {
    type: "single",
    href: "/payments",
    label: "Payments",
    icon: Wallet,
  },
  {
    type: "group",
    label: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: Users2 },
      { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
      {
        href: "/admin/company-access",
        label: "Company Access",
        icon: Building2,
      },
      { href: "/admin/settings", label: "System Settings", icon: Settings },
    ],
  },
  {
    type: "single",
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    badge: "5",
  },
  {
    type: "single",
    href: "/documents",
    label: "Documents",
    icon: FileText,
  },
];

export function AppSidebar({
  userName,
  email,
}: {
  userName?: string;
  email?: string;
}) {
  const pathname = usePathname();
  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    await signOut({ callbackUrl: "/" });
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
              <Link href="/dashboard" className="gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    Booking Room
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 overflow-y-auto minimal-scroll">
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuStructure.map((item, index) => {
                // Single menu item
                if (item.type === "single") {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-9"
                      >
                        <Link
                          href={item.href!}
                          className="flex items-center gap-2"
                        >
                          {item.icon && <item.icon className="size-4" />}
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Collapsible group
                return (
                  <Collapsible
                    key={item.label}
                    defaultOpen={index <= 2}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className="h-9"
                      >
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
                                    <span className="text-sm">
                                      {subItem.label}
                                    </span>
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-12 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg border-2 border-background shadow-sm">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${userName}`}
                      alt={userName}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
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
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${userName}`}
                      alt={userName}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm">
                    <span className="font-semibold">
                      {userName || "User Account"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {email || ""}
                    </span>
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
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
