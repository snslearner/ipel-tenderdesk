import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut} className={className}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
