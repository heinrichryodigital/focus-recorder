"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { checkoutRequest } from "@/app/checkout/checkout-client";
import { parseAccountConfig } from "./account-contract";

let clientPromise: Promise<SupabaseClient | null> | undefined;

export function accountClient(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!clientPromise) clientPromise = checkoutRequest("/api/account/config").then(value => {
    const config = parseAccountConfig(value);
    if (!config.enabled) { clientPromise = undefined; return null; }
    return createClient(config.supabaseUrl, config.publishableKey, { global: { fetch: (input, init) => {
      const requestUrl = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (requestUrl.origin !== config.supabaseUrl || !requestUrl.pathname.startsWith("/auth/v1/")) {
        return Promise.reject(new Error("Unexpected authentication destination."));
      }
      return fetch(input, { ...init, redirect: "error", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
        signal: AbortSignal.any([AbortSignal.timeout(20000), ...(init?.signal ? [init.signal] : [])]) });
    } }, auth: {
      flowType: "pkce", autoRefreshToken: true, persistSession: true, detectSessionInUrl: true,
      storageKey: `focus-recorder-auth-${new URL(config.supabaseUrl).hostname}`,
    } });
  }).catch(() => { clientPromise = undefined; return null; });
  return clientPromise;
}
