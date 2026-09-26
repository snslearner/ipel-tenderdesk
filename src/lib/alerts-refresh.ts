import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createThrottle } from "@/lib/alerts";

// One refresh per minute per server instance.
const throttle = createThrottle(60_000);

// Runs fn_refresh_alerts (idempotent: extension drafts + reminders) as the signed-in user.
// Called from after(), where request cookies can't be read, so it takes the access token.
export async function refreshAlertsThrottled(accessToken: string) {
  if (!throttle.tryAcquire()) return;
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  const { error } = await supabase.rpc("fn_refresh_alerts");
  if (error) console.error("fn_refresh_alerts failed:", error.message);
}
