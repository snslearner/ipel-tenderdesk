import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session";

export function UserBadge({ user }: { user: SessionUser }) {
  return (
    <div className="flex min-w-0 items-center gap-2" data-testid="current-user">
      <span className="truncate text-sm font-medium">{user.fullName}</span>
      <Badge variant={user.role === "owner" ? "default" : "secondary"} data-testid="current-role">
        {roleLabel(user.role)}
      </Badge>
    </div>
  );
}
