import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Back to the sign-in page at "/", which lists the demo users.
export function SwitchUserButton() {
  return (
    <Link
      href="/"
      aria-label="Switch user"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
    >
      <Users />
      <span className="hidden sm:inline">Switch user</span>
    </Link>
  );
}
