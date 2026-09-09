"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { accountClient } from "./account-browser";
import { nextRecoveryGrant, type RecoveryGrant } from "./account-contract";

export function useAccount(retry = 0) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState<RecoveryGrant | null>(null);
  const [callbackFailed, setCallbackFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let subscription: { unsubscribe(): void } | undefined;
    setLoading(true);
    void accountClient().then(async auth => {
      if (!alive) return;
      setClient(auth);
      if (!auth) { setSession(null); setLoading(false); return; }
      // The session is for UI and transport only. The backend independently authenticates every paid request.
      subscription = auth.auth.onAuthStateChange((event, next) => {
        if (!alive) return;
        setSession(next);
        setRecovery(previous => nextRecoveryGrant(previous, event, next));
        if (event === "PASSWORD_RECOVERY" && next) {
          setCallbackFailed(false);
        }
        setLoading(false);
      }).data.subscription;
      // INITIAL_SESSION and later auth events are the sole session source. A separate
      // awaited getSession snapshot could otherwise overwrite a newer sign-out event.
      const { error } = await auth.auth.initialize();
      if (alive && error) { setCallbackFailed(true); setRecovery(null); setLoading(false); }
    }).catch(() => { if (alive) { setSession(null); setLoading(false); } });
    return () => { alive = false; subscription?.unsubscribe(); };
  }, [retry]);
  return { client, session, loading, recovery, callbackFailed };
}
