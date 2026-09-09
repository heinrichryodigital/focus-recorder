"use client";

import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { accountClient, getAccountSession, type AccountClient, type AccountSession } from "./account-browser";
import { firebaseAccountId } from "./account-contract";
import { accountSessionTracker } from "./account-session-state";

export function useAccount(retry = 0) {
  const [client, setClient] = useState<AccountClient | null>(null);
  const [session, setSession] = useState<AccountSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    let tracker: ReturnType<typeof accountSessionTracker> | undefined;
    setLoading(true);
    void accountClient().then(auth => {
      if (!alive) return;
      setClient(auth);
      if (!auth) { setSession(null); setLoading(false); return; }
      tracker = accountSessionTracker(() => getAccountSession(auth), (next, pending) => {
        if (alive) { setSession(next); setLoading(pending); }
      });
      unsubscribe = onIdTokenChanged(auth.auth, user => {
        try { void tracker?.changed(user ? firebaseAccountId(auth.config.projectId, user.uid) : null); }
        catch { void tracker?.changed(null); }
      }, () => { void tracker?.changed(null); });
    }).catch(() => { if (alive) { setSession(null); setLoading(false); } });
    return () => { alive = false; tracker?.dispose(); unsubscribe?.(); };
  }, [retry]);
  return { client, session, loading };
}
