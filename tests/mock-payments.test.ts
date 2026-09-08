import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_PLANS,
  handleMockCheckout,
  MAX_MOCK_CHECKOUT_BYTES,
  type MockReceipt,
} from "../src/lib/mock-payments";

const origin = "https://focus-recorder.example";
const validInput = { plan: "pro", provider: "stripe", outcome: "success" };

function request(body: unknown = validInput, headers: Record<string, string> = {}): Request {
  return new Request(`${origin}/api/mock-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, ...headers },
    body: JSON.stringify(body),
  });
}

async function expectError(input: Request, status: number, code: string) {
  const response = await handleMockCheckout(input);
  assert.equal(response.status, status);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const body = await response.json();
  assert.equal(body.mode, "simulation");
  assert.equal(body.error.code, code);
  assert.equal(body.receipt, undefined);
}

test("both provider labels and all outcomes return non-entitling demo receipts with server prices", async () => {
  for (const plan of ["pro", "studio"] as const) {
    for (const provider of ["stripe", "paypal"] as const) {
      for (const outcome of ["success", "declined", "cancelled"] as const) {
        const response = await handleMockCheckout(request({ plan, provider, outcome }));
        assert.equal(response.status, 200);
        assert.match(response.headers.get("cache-control") ?? "", /no-store/);
        const { receipt } = await response.json() as { receipt: MockReceipt };
        assert.match(receipt.id, /^demo_[0-9a-f-]{36}$/);
        assert.equal(receipt.mode, "simulation");
        assert.equal(receipt.plan, plan);
        assert.equal(receipt.provider, provider);
        assert.equal(receipt.outcome, outcome);
        assert.equal(receipt.illustrativeAmountCents, DEMO_PLANS[plan].amountCents);
        assert.equal(receipt.currency, "USD");
        assert.equal(receipt.chargedAmountCents, 0);
        assert.equal(receipt.entitlementGranted, false);
        assert.ok(!Number.isNaN(Date.parse(receipt.createdAt)));
        assert.equal("license" in receipt, false);
      }
    }
  }
});

test("rejects price, entitlement, and redirect injection rather than ignoring them", async () => {
  for (const extra of [{ amountCents: 1 }, { entitlementGranted: true }, { redirectUrl: "https://attacker.example" }, { email: "someone@example.com" }]) {
    await expectError(request({ ...validInput, ...extra }), 400, "invalid_request");
  }
});

test("rejects unknown, inherited, or wrong-type plan/provider/outcome values", async () => {
  for (const plan of ["free", "toString", "__proto__", null, 49, {}]) {
    await expectError(request({ ...validInput, plan }), 400, "invalid_plan");
  }
  for (const provider of ["Stripe", "cash", null, ["stripe"]]) {
    await expectError(request({ ...validInput, provider }), 400, "invalid_provider");
  }
  await expectError(request({ ...validInput, outcome: "paid" }), 400, "invalid_outcome");
  for (const body of [null, [], "pro", 49, {}, { plan: "pro", provider: "stripe" }]) {
    await expectError(request(body), 400, "invalid_request");
  }
});

test("rejects absent, foreign, malformed, and opaque Origin values", async () => {
  for (const invalidOrigin of ["https://attacker.example", `${origin}.attacker.example`, "null", `${origin}/path`, ""]) {
    await expectError(request(validInput, { Origin: invalidOrigin }), 403, "origin_not_allowed");
  }
  const missing = request();
  missing.headers.delete("origin");
  await expectError(missing, 403, "origin_not_allowed");
  await expectError(request(validInput, { "Sec-Fetch-Site": "cross-site" }), 403, "origin_not_allowed");
});

test("rejects non-JSON and malformed JSON before creating a receipt", async () => {
  await expectError(request(validInput, { "Content-Type": "text/plain" }), 415, "unsupported_media_type");
  await expectError(new Request(`${origin}/api/mock-checkout`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{",
  }), 400, "invalid_json");
});

test("enforces a byte limit even when content length is absent or understated", async () => {
  const largeBody = { ...validInput, padding: "x".repeat(MAX_MOCK_CHECKOUT_BYTES) };
  await expectError(request(largeBody), 413, "request_too_large");
  await expectError(request(largeBody, { "Content-Length": "1" }), 413, "request_too_large");
  await expectError(request(validInput, { "Content-Length": String(MAX_MOCK_CHECKOUT_BYTES + 1) }), 413, "request_too_large");
  await expectError(request(validInput, { "Content-Length": "not-a-number" }), 400, "invalid_length");
});

test("rejects invalid UTF-8 instead of accepting replacement characters", async () => {
  const bytes = new Uint8Array([123, 34, 112, 108, 97, 110, 34, 58, 34, 0xff, 34, 125]);
  await expectError(new Request(`${origin}/api/mock-checkout`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: bytes,
  }), 400, "invalid_json");
});

test("stops reading chunked bodies as soon as the byte limit is exceeded", async () => {
  let cancelled = false;
  let pulls = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(600).fill(32));
    },
    cancel() { cancelled = true; },
  });
  const options: RequestInit & { duplex: "half" } = {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body, duplex: "half",
  };
  await expectError(new Request(`${origin}/api/mock-checkout`, options), 413, "request_too_large");
  assert.equal(cancelled, true);
  assert.ok(pulls <= 3, "the reader must stop instead of draining an unbounded body");
});

test("non-POST access cannot create receipts and is not cached", async () => {
  await expectError(new Request(`${origin}/api/mock-checkout`), 405, "method_not_allowed");
});

test("each repeated simulation gets a separate demo reference, never a purchase", async () => {
  const first = await (await handleMockCheckout(request())).json();
  const second = await (await handleMockCheckout(request())).json();
  assert.notEqual(first.receipt.id, second.receipt.id);
  assert.equal(first.receipt.entitlementGranted, false);
  assert.equal(second.receipt.entitlementGranted, false);
});
