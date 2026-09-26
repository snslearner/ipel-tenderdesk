import { getSessionUser } from "@/lib/auth/session";
import { BottomBar } from "@/components/shell/bottom-bar";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { SwitchUserButton } from "@/components/shell/switch-user-button";
import { UserBadge } from "@/components/shell/user-badge";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex print:hidden">
        <div className="mb-6 px-3 text-base font-semibold tracking-tight">IPEL TenderDesk</div>
        <SidebarNav />
        <div className="mt-auto border-t pt-4">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background px-4 py-3 md:justify-end md:px-6 print:hidden">
          <span className="shrink-0 font-semibold tracking-tight md:hidden">IPEL TenderDesk</span>
          <div className="flex min-w-0 items-center gap-2">
            <UserBadge user={user} />
            <SwitchUserButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6 md:pb-6 print:p-0">{children}</main>
      </div>

      <BottomBar
        account={
          <div className="space-y-2">
            <UserBadge user={user} />
            <SignOutButton />
          </div>
        }
      />
    </div>
  );
}
