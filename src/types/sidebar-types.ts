import { LucideIcon } from "lucide-react";

export interface BaseMenuItem {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  permissions?: string[];
  badge?: string;
}

export interface SingleMenuItem extends BaseMenuItem {
  type: "single";
  href: string;
  icon?: LucideIcon;
}

export interface SubMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  permissions?: string[];
}

export interface GroupMenuItem extends BaseMenuItem {
  type: "group";
  items: SubMenuItem[];
}

export type MenuItem = SingleMenuItem | GroupMenuItem;

export interface SidebarConfig {
  items: MenuItem[];
}

export interface AppSidebarProps {
  userName?: string;
  email?: string;
  userPermissions?: string[];
}
