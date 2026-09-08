/**
 * Local payment simulation only. This module does not contact Stripe or PayPal,
 * persist orders, sign licenses, or grant production entitlements.
 */
export const DEMO_PLANS = Object.freeze({
  pro: Object.freeze({ name: "Pro", amountCents: 4900, description: "For the solo storyteller" }),
  studio: Object.freeze({ name: "Studio", amountCents: 9900, description: "For your next team story" }),
});

export type DemoPlan = keyof typeof DEMO_PLANS;
export type DemoProvider = "stripe" | "paypal";
export type DemoOutcome = "success" | "declined" | "cancelled";

export type MockCheckoutInput = {
  plan: DemoPlan;
  provider: DemoProvider;
  outcome: DemoOutcome;
};

export type MockReceipt = {
  id: string;
  mode: "simulation";
  createdAt: string;
  plan: DemoPlan;
  planName: string;
  provider: DemoProvider;
  outcome: DemoOutcome;
  currency: "USD";
  illustrativeAmountCents: number;
  chargedAmountCents: 0;
  entitlementGranted: false;
};

export type MockCheckoutResult =
  | { mode: "simulation"; receipt: MockReceipt }
  | { mode: "simulation"; error: { code: string; message: string } };

export const MAX_MOCK_CHECKOUT_BYTES = 1024;

class CheckoutInputError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function isDemoPlan(value: unknown): value is DemoPlan {
  return typeof value === "string" && Object.hasOwn(DEMO_PLANS, value);
}

export function isDemoProvider(value: unknown): value is DemoProvider {
  return value === "stripe" || value === "paypal";
}

export function formatDemoAmount(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function parseMockCheckoutInput(value: unknown): MockCheckoutInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CheckoutInputError(400, "invalid_request", "Choose a plan, provider, and demo outcome.");
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 3 || keys.join(",") !== "outcome,plan,provider") {
    throw new CheckoutInputError(400, "invalid_request", "Only plan, provider, and outcome are accepted.");
  }
  if (!isDemoPlan(record.plan)) {
    throw new CheckoutInputError(400, "invalid_plan", "Choose Pro or Studio.");
  }
  if (!isDemoProvider(record.provider)) {
    throw new CheckoutInputError(400, "invalid_provider", "Choose Stripe or PayPal.");
  }
  if (record.outcome !== "success" && record.outcome !== "declined" && record.outcome !== "cancelled") {
    throw new CheckoutInputError(400, "invalid_outcome", "Choose a supported demo outcome.");
  }
  return { plan: record.plan, provider: record.provider, outcome: record.outcome };
}

function jsonResponse(body: MockCheckoutResult, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...(status === 405 ? { Allow: "POST" } : {}),
    },
  });
}

function validateRequest(request: Request): void {
  if (request.method !== "POST") {
    throw new CheckoutInputError(405, "method_not_allowed", "Use POST for a checkout simulation.");
  }

  // An absent Origin is rejected too. This is a browser-only demo mutation,
  // with no cross-origin API clients or provider webhooks.
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (origin !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new CheckoutInputError(403, "origin_not_allowed", "Start the demo from this website.");
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new CheckoutInputError(415, "unsupported_media_type", "Send the demo selection as JSON.");
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      throw new CheckoutInputError(400, "invalid_length", "The request length is invalid.");
    }
    if (Number(declaredLength) > MAX_MOCK_CHECKOUT_BYTES) {
      throw new CheckoutInputError(413, "request_too_large", "The demo request is too large.");
    }
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) {
    throw new CheckoutInputError(400, "invalid_json", "The demo selection is missing.");
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_MOCK_CHECKOUT_BYTES) {
        await reader.cancel();
        throw new CheckoutInputError(413, "request_too_large", "The demo request is too large.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new CheckoutInputError(400, "invalid_json", "The demo selection could not be read.");
  }
}

export async function handleMockCheckout(request: Request): Promise<Response> {
  try {
    validateRequest(request);
    const input = parseMockCheckoutInput(await readBoundedJson(request));
    const plan = DEMO_PLANS[input.plan];

    return jsonResponse({
      mode: "simulation",
      receipt: {
        id: `demo_${crypto.randomUUID()}`,
        mode: "simulation",
        createdAt: new Date().toISOString(),
        plan: input.plan,
        planName: plan.name,
        provider: input.provider,
        outcome: input.outcome,
        currency: "USD",
        illustrativeAmountCents: plan.amountCents,
        chargedAmountCents: 0,
        entitlementGranted: false,
      },
    });
  } catch (error) {
    if (error instanceof CheckoutInputError) {
      return jsonResponse({ mode: "simulation", error: { code: error.code, message: error.message } }, error.status);
    }
    return jsonResponse({
      mode: "simulation",
      error: { code: "simulation_unavailable", message: "The simulation is unavailable. Please try again." },
    }, 500);
  }
}
