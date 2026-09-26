"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MOBILE_MORE, MOBILE_PRIMARY, isActive } from "./nav";

const itemClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-none";

// `account` is rendered inside the More sheet (user name, role, sign out).
export function BottomBar({ account }: { account: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MOBILE_MORE.some((i) => isActive(pathname, i.href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(itemClass, active ? "text-foreground" : "text-muted-foreground")}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(itemClass, moreActive ? "text-foreground" : "text-muted-foreground")}
        >
          <MoreHorizontal className="size-5" />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 px-4">
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="border-t px-4 pt-3">{account}</div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
