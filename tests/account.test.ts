import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { accountReturnPath, parseAccountConfig, parseAccountEntitlement, nextRecoveryGrant } from "../src/lib/account-contract";
import { updateRecoveredPassword } from "../src/lib/account-password";
import { checkoutRequest } from "../src/app/checkout/checkout-client";

const id = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const config = { enabled: true, supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co", publishableKey: "sb_publishable_" + "x".repeat(32) };

test("public account config fails closed and never accepts privileged keys or foreign URLs", () => {
  assert.deepEqual(parseAccountConfig(config), config);
  assert.deepEqual(parseAccountConfig({ enabled: false }), { enabled: false });
  const jwt = (role: string) => ["header", Buffer.from(JSON.stringify({ role })).toString("base64url"), "signature"].join(".");
  assert.equal(parseAccountConfig({ ...config, publishableKey: jwt("anon") }).enabled, true);
  for (const bad of [null, [], {}, { ...config, enabled: "true" }, { ...config, publishableKey: "sb_secret_" + "x".repeat(32) },
    { ...config, publishableKey: jwt("service_role") }, { ...config, publishableKey: jwt("authenticated") },
    ...["http://abcdefghijklmnopqrst.supabase.co", "https://abcdefghijklmnopqrst.supabase.co.evil.test", "https://evil@abcdefghijklmnopqrst.supabase.co", "https://abcdefghijklmnopqrst.supabase.co:444", "https://abcdefghijklmnopqrst.supabase.co/path", "https://abcdefghijklmnopqrst.supabase.co?x=y"].map(supabaseUrl => ({ ...config, supabaseUrl }))]) {
    assert.throws(() => parseAccountConfig(bad));
  }
});

test("UI plan status is account-bound and never treats profile metadata or FR1 as account Pro", () => {
  const active = { accountId: id, status: "active", token: ["FR2", "dGVzdA", "c2ln"].join("."), expiresAt: Math.floor(Date.now() / 1000) + 600 };
  assert.deepEqual(parseAccountEntitlement(active, id), { accountId: id, status: "active", expiresAt: active.expiresAt });
  assert.deepEqual(parseAccountEntitlement({ accountId: id, status: "free" }, id), { accountId: id, status: "free" });
  for (const bad of [{ ...active, accountId: otherId }, { ...active, expiresAt: 1 }, { ...active, expiresAt: Date.now() },
    { ...active, token: active.token.replace("FR2", "FR1") }, { accountId: id, user_metadata: { plan: "pro" } }]) {
    assert.throws(() => parseAccountEntitlement(bad, id));
  }
});

test("login return paths cannot redirect to arbitrary origins or inject URL parameters", () => {
  assert.equal(accountReturnPath("/checkout"), "/checkout");
  const path = `/checkout/return?checkout=${"a".repeat(32)}`;
  assert.equal(accountReturnPath(path), path);
  for (const path of ["//evil.test", "https://evil.test", "javascript:alert(1)", "/checkout?next=https://evil.test", "/account/../evil", ["/checkout"], undefined]) {
    assert.equal(accountReturnPath(path), "/account");
  }
});

test("authenticated checkout sends only consent and a bearer header, not an account or device identifier", async t => {
  const request = t.mock.method(globalThis, "fetch", async () => Response.json({ ok: true }));
  await checkoutRequest("/api/paypal/checkout", { acceptedTerms: true }, undefined, "example.access.token");
  const options = request.mock.calls[0].arguments[1] as RequestInit;
  assert.equal(new Headers(options.headers).get("Authorization"), "Bearer example.access.token");
  assert.deepEqual(JSON.parse(options.body as string), { acceptedTerms: true });
  assert.equal(options.redirect, "error");
  await assert.rejects(checkoutRequest("/api/account/entitlement", undefined, undefined, "bad\nheader"));
});

test("password recovery verifies a fixed recovery account before sending the password", async () => {
  const calls: RequestInit[] = [];
  const transport: typeof fetch = async (_input, init) => { calls.push(init!); return Response.json({ id }); };
  await updateRecoveredPassword(config, { accountId: id, accessToken: "recovery.token" }, "test-only-password", transport);
  assert.deepEqual(calls.map(call => call.method), ["GET", "PUT"]);
  assert.equal(calls[0].body, undefined);
  assert.deepEqual(JSON.parse(calls[1].body as string), { password: "test-only-password" });
  for (const call of calls) {
    assert.equal(new Headers(call.headers).get("Authorization"), "Bearer recovery.token");
    assert.equal(call.redirect, "error"); assert.equal(call.credentials, "omit");
  }
  let requests = 0;
  const wrongAccount: typeof fetch = async () => { requests++; return Response.json({ id: otherId }); };
  await assert.rejects(updateRecoveredPassword(config, { accountId: id, accessToken: "recovery.token" }, "test-only-password", wrongAccount));
  assert.equal(requests, 1, "wrong account must never receive a password update");
});

test("auth events, not URL reset flags or stale session snapshots, authorize recovery UI", () => {
  const hook = readFileSync(new URL("../src/lib/use-account.ts", import.meta.url), "utf8");
  const account = readFileSync(new URL("../src/app/account/account.tsx", import.meta.url), "utf8");
  assert.match(hook, /event === "PASSWORD_RECOVERY"/);
  assert.doesNotMatch(hook, /await auth\.auth\.getSession\(/);
  assert.match(account, /account\.recovery\.accountId === account\.session\?\.user\.id/);
  assert.doesNotMatch(account, /const passwordUpdate = \(reset/);
  const checkout = readFileSync(new URL("../src/app/checkout/checkout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(checkout, /machineId|name="platform"|id="device-id"/);
  assert.match(checkout, /useState\(false\)/);
});

test("password recovery survives tab focus but not logout or a new account/session", () => {
  const session = { user: { id }, access_token: "original.token" };
  const grant = nextRecoveryGrant(null, "PASSWORD_RECOVERY", session);
  assert.deepEqual(grant, { accountId: id, accessToken: "original.token" });
  assert.deepEqual(nextRecoveryGrant(grant, "SIGNED_IN", session), grant);
  assert.equal(nextRecoveryGrant(grant, "SIGNED_IN", { ...session, access_token: "different.login" }), null);
  assert.equal(nextRecoveryGrant(grant, "SIGNED_IN", { user: { id: otherId }, access_token: session.access_token }), null);
  assert.equal(nextRecoveryGrant(grant, "SIGNED_OUT", null), null);
  assert.equal(nextRecoveryGrant(null, "INITIAL_SESSION", session), null);
  assert.deepEqual(nextRecoveryGrant(grant, "TOKEN_REFRESHED", { ...session, access_token: "refreshed.token" }), { accountId: id, accessToken: "refreshed.token" });
});
