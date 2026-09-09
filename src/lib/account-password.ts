import { parseAccountConfig, isAccountId } from "./account-contract";

/** A recovery token is fixed to the verified recovery event, never whichever account
 * happens to be in browser storage when an asynchronous update completes. */
export async function updateRecoveredPassword(configuration: unknown, recovery: { accountId: string; accessToken: string },
  password: string, transport: typeof fetch = fetch): Promise<void> {
  const config = parseAccountConfig(configuration);
  if (!config.enabled || !isAccountId(recovery.accountId) || !/^[A-Za-z0-9._-]{1,16384}$/.test(recovery.accessToken)
    || password.length < 8 || password.length > 1024) throw new Error("Password recovery could not be verified.");
  const headers = { apikey: config.publishableKey, Authorization: `Bearer ${recovery.accessToken}`, "Content-Type": "application/json" };
  const url = `${config.supabaseUrl}/auth/v1/user`;
  async function request(method: "GET" | "PUT") {
    const response = await transport(url, { method, headers, credentials: "omit", redirect: "error", cache: "no-store",
      referrerPolicy: "no-referrer", signal: AbortSignal.timeout(20000), ...(method === "PUT" ? { body: JSON.stringify({ password }) } : {}) });
    if (!response.ok || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" || !response.body) {
      await response.body?.cancel(); throw new Error("Password recovery could not be verified.");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      for (;;) {
        const chunk = await reader.read(); if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > 65536) { await reader.cancel(); throw new Error("Password recovery could not be verified."); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const user: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!user || typeof user !== "object" || (user as { id?: unknown }).id !== recovery.accountId) throw new Error("Password recovery could not be verified.");
  }
  await request("GET");
  await request("PUT");
}
