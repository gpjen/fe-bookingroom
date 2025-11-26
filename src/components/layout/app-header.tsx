"use client";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { LangSelect } from "@/components/settings/lang-select";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { Search, Bell, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader({
  userName,
  email,
  isLoggedIn,
}: {
  userName?: string;
  email?: string;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Left Section: Trigger + Breadcrumb */}
        <div className="flex md:hidden items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
        </div>

        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Home
                </div>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((c, idx) => (
              <React.Fragment key={c.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {idx === crumbs.length - 1 ? (
                    <BreadcrumbPage className="font-medium text-foreground">
                      {c.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={c.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Center Section: Search (Optional - can be toggled) */}
        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          {/* Search Bar - Hidden on mobile */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pl-8 lg:w-[300px] h-9 bg-muted/50"
            />
          </div>

          {/* Search Button - Visible on mobile */}
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Language Select */}
          <LangSelect />

          {/* Theme Toggle */}
          <ThemeToggle />

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* User Menu */}
          {/* <span className="block md:hidden">
            <UserMenu
              isLoggedIn={isLoggedIn}
              userName={userName}
              email={email}
            />
          </span> */}
        </div>
      </div>
    </header>
  );
}
