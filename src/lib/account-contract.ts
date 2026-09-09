// Public response validation only. Identity and paid access are verified by the private backend.
export type AccountConfig = { enabled: false } | { enabled: true; supabaseUrl: string; publishableKey: string };
export type AccountEntitlement = { accountId: string; status: "free" | "pending" | "cancelled" | "unavailable" }
  | { accountId: string; status: "active"; expiresAt: number };
export const isAccountId = (value: unknown): value is string => typeof value === "string"
  && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);

export type RecoveryGrant = { accountId: string; accessToken: string };
export function nextRecoveryGrant(previous: RecoveryGrant | null, event: string,
  session: { user: { id: string }; access_token: string } | null): RecoveryGrant | null {
  if (!session || event === "SIGNED_OUT") return null;
  if (event === "PASSWORD_RECOVERY") return { accountId: session.user.id, accessToken: session.access_token };
  if (!previous || previous.accountId !== session.user.id) return null;
  // Supabase also emits SIGNED_IN on tab focus. Preserve that same session, but
  // don't carry a recovery grant into a genuinely different login.
  if (event === "SIGNED_IN" && previous.accessToken !== session.access_token) return null;
  return { accountId: session.user.id, accessToken: session.access_token };
}

export function parseAccountConfig(value: unknown): AccountConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Account sign-in is unavailable.");
  const data = value as Record<string, unknown>;
  if (data.enabled === false) return { enabled: false };
  if (data.enabled !== true || typeof data.supabaseUrl !== "string" || typeof data.publishableKey !== "string"
    || !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(data.supabaseUrl)
    || data.publishableKey.length > 4096) throw new Error("Account sign-in is unavailable.");
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]{16,256}$/.test(data.publishableKey);
  if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.publishableKey)) {
    try {
      const encoded = data.publishableKey.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
      const claims = JSON.parse(atob(encoded));
      // This only distinguishes a public legacy anon key from a privileged server key.
      publicKey = claims.role === "anon";
    } catch { publicKey = false; }
  }
  if (!publicKey) throw new Error("Account sign-in is unavailable.");
  return { enabled: true, supabaseUrl: data.supabaseUrl, publishableKey: data.publishableKey };
}

export function parseAccountEntitlement(value: unknown, accountId: string): AccountEntitlement {
  if (!value || typeof value !== "object" || Array.isArray(value) || !isAccountId(accountId)) throw new Error("Unable to verify your plan.");
  const data = value as Record<string, unknown>;
  if (data.accountId !== accountId) throw new Error("Unable to verify your plan.");
  if (["free", "pending", "cancelled", "unavailable"].includes(data.status as string)) {
    return { accountId, status: data.status as "free" | "pending" | "cancelled" | "unavailable" };
  }
  if (data.status === "active" && typeof data.expiresAt === "number" && Number.isSafeInteger(data.expiresAt)
    && data.expiresAt > Date.now() / 1000 && data.expiresAt <= Date.now() / 1000 + 3 * 86400 + 60
    && typeof data.token === "string" && data.token.length <= 16384
    && /^FR2\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.token)) {
    // The browser displays status, not a transferable activation code. Desktop apps verify the signature.
    return { accountId, status: "active", expiresAt: data.expiresAt };
  }
  throw new Error("Unable to verify your plan.");
}

export function accountReturnPath(value: unknown): string {
  if (value === "/checkout") return value;
  if (typeof value === "string" && /^\/checkout\/return\?checkout=[a-f0-9]{32}$/.test(value)) return value;
  return "/account";
}
