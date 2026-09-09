import type { AccountSession } from "./account-browser";

/** Keeps same-account token refreshes separate from logout/account-switch events. */
export function accountSessionTracker(
  readSession: () => Promise<AccountSession | null>,
  publish: (session: AccountSession | null, loading: boolean) => void,
) {
  let generation = 0;
  let disposed = false;
  let session: AccountSession | null = null;
  return {
    async changed(accountId: string | null) {
      if (disposed) return;
      const operation = ++generation;
      if (!accountId) { session = null; publish(null, false); return; }
      // A background refresh must not reset checkout consent or abort its request.
      // An actual identity change must stop displaying the prior account immediately.
      if (session?.user.id !== accountId) session = null;
      publish(session, true);
      try {
        const next = await readSession();
        if (!disposed && operation === generation) session = next?.user.id === accountId ? next : null;
      } catch { if (!disposed && operation === generation) session = null; }
      finally { if (!disposed && operation === generation) publish(session, false); }
    },
    dispose() { disposed = true; ++generation; session = null; },
  };
}
