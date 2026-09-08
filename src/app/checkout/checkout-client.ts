// Browser-only contract checks. Payment verification and signing stay on the server.
export type CheckoutConfig = {
  enabled: boolean;
  environment: "live" | "sandbox";
  amount: "9.00";
  currency: "USD";
  interval: "MONTH";
};

export type CheckoutStatus =
  | { status: "pending" | "cancelled" | "unavailable" }
  | { status: "active"; token: string; expiresAt: number };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid checkout response.");
  return value as Record<string, unknown>;
}

export function parseCheckoutConfig(value: unknown): CheckoutConfig {
  const data = record(value);
  if (typeof data.enabled !== "boolean" || !["live", "sandbox"].includes(data.environment as string)
      || data.amount !== "9.00" || data.currency !== "USD" || data.interval !== "MONTH") {
    throw new Error("Checkout is not available.");
  }
  return data as CheckoutConfig;
}

export function isDeviceId(value: string): boolean { return /^[a-f0-9]{64}$/.test(value); }
export function isCheckoutId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

export function parseCheckoutRedirect(value: unknown, environment: CheckoutConfig["environment"]): string {
  const data = record(value);
  if (!isCheckoutId(data.checkoutId) || typeof data.approvalUrl !== "string" || data.approvalUrl.length > 2048) {
    throw new Error("Invalid checkout response.");
  }
  const url = new URL(data.approvalUrl);
  const hostname = environment === "live" ? "www.paypal.com" : "www.sandbox.paypal.com";
  if (url.protocol !== "https:" || url.hostname !== hostname || url.port || url.username || url.password || url.hash
      || url.pathname !== "/webapps/billing/subscriptions" || !/^BA-[A-Z0-9]+$/.test(url.searchParams.get("ba_token") ?? "")) {
    throw new Error("Invalid PayPal approval address.");
  }
  return url.href;
}

export function parseCheckoutStatus(value: unknown): CheckoutStatus {
  const data = record(value);
  if (data.status === "pending" || data.status === "cancelled" || data.status === "unavailable") {
    return { status: data.status };
  }
  if (data.status === "active" && typeof data.token === "string" && data.token.length <= 16384
      && /^FR1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.token)
      && typeof data.expiresAt === "number" && Number.isSafeInteger(data.expiresAt)
      && data.expiresAt * 1000 > Date.now() && data.expiresAt < 100000000000) {
    return { status: "active", token: data.token, expiresAt: data.expiresAt };
  }
  throw new Error("Payment confirmation is not available yet.");
}

export async function checkoutRequest(
  path: "/api/paypal/config" | "/api/paypal/checkout" | "/api/paypal/status",
  body?: object,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 30000);
  try {
    const response = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" || !response.body) {
      await response.body?.cancel();
      throw new Error("Checkout could not be reached.");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 24576) {
          await reader.cancel();
          throw new Error("Checkout response is too large.");
        }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
