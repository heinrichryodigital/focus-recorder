import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutRequest, isCheckoutId, isDeviceId, parseCheckoutConfig,
  parseCheckoutRedirect, parseCheckoutStatus,
} from "../src/app/checkout/checkout-client";

const config = { enabled: true, environment: "live", amount: "9.00", currency: "USD", interval: "MONTH" };
const checkoutId = "a".repeat(32);
const approvalUrl = "https://www.paypal.com/webapps/billing/subscriptions?ba_token=BA-TEST123";

test("checkout stays closed for missing or mismatched commercial terms", () => {
  assert.equal(parseCheckoutConfig(config).enabled, true);
  assert.equal(parseCheckoutConfig({ ...config, enabled: false }).enabled, false);
  for (const value of [null, {}, [], { ...config, enabled: "true" }, { ...config, amount: "49.00" },
    { ...config, currency: "PHP" }, { ...config, interval: "YEAR" }, { ...config, environment: "test" }]) {
    assert.throws(() => parseCheckoutConfig(value));
  }
});

test("only the selected PayPal environment and subscription approval route can receive redirects", () => {
  assert.equal(parseCheckoutRedirect({ checkoutId, approvalUrl }, "live"), approvalUrl);
  const sandbox = approvalUrl.replace("www.paypal.com", "www.sandbox.paypal.com");
  assert.equal(parseCheckoutRedirect({ checkoutId, approvalUrl: sandbox }, "sandbox"), sandbox);
  for (const address of [
    sandbox, approvalUrl.replace("https:", "http:"), approvalUrl.replace("www.paypal.com", "www.paypal.com.attacker.example"),
    approvalUrl.replace("www.paypal.com", "attacker@www.paypal.com"), approvalUrl.replace("www.paypal.com", "www.paypal.com:8443"),
    approvalUrl.replace("/webapps/billing/subscriptions", "/signin"), `${approvalUrl}#redirect`,
    approvalUrl.replace("BA-TEST123", ""), "javascript:alert(1)", "/checkout/return",
  ]) assert.throws(() => parseCheckoutRedirect({ checkoutId, approvalUrl: address }, "live"), address);
  assert.throws(() => parseCheckoutRedirect({ checkoutId: "unbound", approvalUrl }, "live"));
});

test("client requires server activation, a bounded FR1 token, and a future expiry in seconds", () => {
  const active = { status: "active", token: ["FR1", "dGVzdA", "c2ln"].join("."), expiresAt: Math.floor(Date.now() / 1000) + 600 };
  assert.deepEqual(parseCheckoutStatus(active), active);
  assert.deepEqual(parseCheckoutStatus({ ...active, status: "pending" }), { status: "pending" });
  for (const value of [
    { status: "approved" }, { status: "active" }, { ...active, token: "demo-receipt" },
    { ...active, token: "FR1." + "x".repeat(16384) + ".c2ln" },
    { ...active, expiresAt: 1 }, { ...active, expiresAt: new Date().toISOString() },
    { ...active, expiresAt: Date.now() + 600000 },
  ]) assert.throws(() => parseCheckoutStatus(value));
});

test("device and checkout identifiers are distinct, bounded lowercase hashes", () => {
  assert.equal(isDeviceId("a".repeat(64)), true);
  assert.equal(isDeviceId("A".repeat(64)), false);
  assert.equal(isDeviceId("a".repeat(63)), false);
  assert.equal(isDeviceId("g".repeat(64)), false);
  assert.equal(isCheckoutId(checkoutId), true);
  assert.equal(isCheckoutId("a".repeat(64)), false);
});

test("checkout requests reject non-JSON, errors, and oversized responses", async t => {
  let response = Response.json(config);
  const request = t.mock.method(globalThis, "fetch", async () => response);
  assert.deepEqual(await checkoutRequest("/api/paypal/config"), config);
  const options = request.mock.calls[0].arguments[1] as RequestInit;
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.cache, "no-store");
  assert.equal(options.redirect, "error");
  assert.equal(options.referrerPolicy, "no-referrer");
  for (const value of [
    new Response("missing", { status: 404 }),
    new Response("<html>unavailable</html>", { headers: { "Content-Type": "text/html" } }),
    new Response("{}", { headers: { "Content-Type": "application/jsonp" } }),
    new Response("x".repeat(24577), { headers: { "Content-Type": "application/json" } }),
    new Response("malformed", { headers: { "Content-Type": "application/json" } }),
  ]) {
    response = value;
    await assert.rejects(checkoutRequest("/api/paypal/status", { checkoutId }));
  }
});
