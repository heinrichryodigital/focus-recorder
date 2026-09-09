// Public response validation only. Identity and paid access are verified by the private backend.
export type AccountConfig = { enabled: false } | { enabled: true; provider: "firebase"; projectId: string; apiKey: string; authDomain: string; appId: string };
export type AccountEntitlement = { accountId: string; status: "free" | "pending" | "cancelled" | "unavailable" }
  | { accountId: string; status: "active"; expiresAt: number };
export const isAccountId = (value: unknown): value is string => typeof value === "string"
  && /^firebase:[a-z][a-z0-9-]{4,28}[a-z0-9]:[A-Za-z0-9_-]{1,128}$/.test(value);

export function firebaseAccountId(projectId: string, uid: string): string {
  const id = `firebase:${projectId}:${uid}`;
  if (!isAccountId(id)) throw new Error("Your account could not be verified.");
  return id;
}

export function parseAccountConfig(value: unknown): AccountConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Account sign-in is unavailable.");
  const data = value as Record<string, unknown>;
  if (data.enabled === false) return { enabled: false };
  if (data.enabled !== true || data.provider !== "firebase" || typeof data.projectId !== "string"
    || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(data.projectId)
    || typeof data.apiKey !== "string" || !/^AIza[A-Za-z0-9_-]{35}$/.test(data.apiKey)
    || data.authDomain !== `${data.projectId}.firebaseapp.com`
    || typeof data.appId !== "string" || !/^1:[0-9]+:web:[a-f0-9]{20,64}$/.test(data.appId)) throw new Error("Account sign-in is unavailable.");
  return { enabled: true, provider: "firebase", projectId: data.projectId, apiKey: data.apiKey, authDomain: data.authDomain, appId: data.appId };
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
