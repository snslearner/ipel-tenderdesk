import {
  Bell,
  Boxes,
  Building2,
  Factory,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; mobilePrimary: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/tenders", label: "Tenders", icon: FileText, mobilePrimary: true },
  { href: "/orders", label: "Orders", icon: Package, mobilePrimary: true },
  { href: "/vendors", label: "Vendors", icon: Factory, mobilePrimary: false },
  { href: "/clients", label: "Clients", icon: Building2, mobilePrimary: false },
  { href: "/products", label: "Products", icon: Boxes, mobilePrimary: false },
  { href: "/reminders", label: "Reminders", icon: Bell, mobilePrimary: true },
  { href: "/settings", label: "Settings", icon: Settings, mobilePrimary: false },
];

export const MOBILE_PRIMARY = NAV_ITEMS.filter((i) => i.mobilePrimary);
export const MOBILE_MORE = NAV_ITEMS.filter((i) => !i.mobilePrimary);

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
