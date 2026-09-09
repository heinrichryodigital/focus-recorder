"use client";

import { initializeApp } from "firebase/app";
import { browserLocalPersistence, browserSessionPersistence, initializeAuth, inMemoryPersistence, reload, type Auth, type IdTokenResult, type User } from "firebase/auth";
import { checkoutRequest } from "@/app/checkout/checkout-client";
import { firebaseAccountId, parseAccountConfig, type AccountConfig } from "./account-contract";

export type AccountClient = { auth: Auth; config: Extract<AccountConfig, { enabled: true }> };
export type AccountSession = { access_token: string; user: { id: string; email: string | null; emailVerified: boolean } };
let clientPromise: Promise<AccountClient | null> | undefined;
const verificationRefreshes = new WeakMap<User, { token: string; pending: boolean; result: Promise<IdTokenResult> }>();

function refreshTokenOnce(user: User, cached: IdTokenResult, explicit: boolean): Promise<IdTokenResult> {
  const previous = verificationRefreshes.get(user);
  // getIdTokenResult(true) itself emits onIdTokenChanged. Nested listeners must
  // share that request, even if the refreshed token still says unverified.
  if (previous && (previous.pending || (!explicit && previous.token === cached.token))) return previous.result;
  const entry = { token: cached.token, pending: true, result: Promise.resolve(cached) };
  entry.result = Promise.resolve().then(() => user.getIdTokenResult(true)).then(result => {
    entry.token = result.token;
    entry.pending = false;
    return result;
  }).catch(error => {
    if (verificationRefreshes.get(user) === entry) verificationRefreshes.delete(user);
    throw error;
  });
  verificationRefreshes.set(user, entry);
  return entry.result;
}

export function accountClient(): Promise<AccountClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!clientPromise) clientPromise = checkoutRequest("/api/account/config").then(value => {
    const config = parseAccountConfig(value);
    if (!config.enabled) { clientPromise = undefined; return null; }
    // Email/password only: no Analytics, Firestore, popup resolver, or service-account credential.
    const app = initializeApp(config, `focus-recorder-${config.projectId}`);
    const auth = initializeAuth(app, { persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence] });
    auth.languageCode = "en";
    return { auth, config };
  }).catch(() => { clientPromise = undefined; return null; });
  return clientPromise;
}

/** Transport identity only; the private backend independently verifies every paid request. */
export async function getAccountSession(client: AccountClient, forceRefresh = false): Promise<AccountSession | null> {
  const user = client.auth.currentUser;
  if (!user) return null;
  if (forceRefresh) await reload(user);
  if (client.auth.currentUser !== user) throw new Error("Your signed-in account changed.");
  let token = await user.getIdTokenResult(false);
  if (client.auth.currentUser !== user) throw new Error("Your signed-in account changed.");
  if (forceRefresh || (user.emailVerified && token.claims.email_verified !== true)) {
    token = await refreshTokenOnce(user, token, forceRefresh);
  }
  if (client.auth.currentUser !== user) throw new Error("Your signed-in account changed.");
  return { access_token: token.token, user: { id: firebaseAccountId(client.config.projectId, user.uid), email: user.email,
    emailVerified: user.emailVerified && token.claims.email_verified === true } };
}
