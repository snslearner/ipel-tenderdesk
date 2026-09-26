"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type DbResult = { error: { message: string } | null };

// Runs a Supabase write: the database message becomes an error toast; success refreshes server data.
export function useDbAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(success: string, write: () => PromiseLike<DbResult>, after?: () => void) {
    startTransition(async () => {
      const { error } = await write();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(success);
      after?.();
      router.refresh();
    });
  }

  return { pending, run };
}
