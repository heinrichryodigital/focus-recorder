import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { accountReturnPath, firebaseAccountId, isAccountId, parseAccountConfig, parseAccountEntitlement } from "../src/lib/account-contract";
import { accountEmailActionSettings } from "../src/lib/account-password";
import { accountSessionTracker } from "../src/lib/account-session-state";
import { getAccountSession, type AccountClient, type AccountSession } from "../src/lib/account-browser";
import { checkoutRequest } from "../src/app/checkout/checkout-client";
import nextConfig from "../next.config";

const projectId = "focus-recorder-test";
const uid = "TestUserAbC_123";
const id = `firebase:${projectId}:${uid}`;
const otherId = `firebase:${projectId}:OtherUser`;
const config = { enabled: true, provider: "firebase", projectId, apiKey: "AIza" + "x".repeat(35),
  authDomain: `${projectId}.firebaseapp.com`, appId: "1:123456789:web:" + "a".repeat(20) };
const session = (accountId = id, token = "example.access.token"): AccountSession => ({
  access_token: token, user: { id: accountId, email: "person@example.test", emailVerified: true },
});

test("public account config accepts only the exact Firebase web configuration contract", () => {
  assert.deepEqual(parseAccountConfig(config), config);
  assert.deepEqual(parseAccountConfig({ enabled: false }), { enabled: false });
  for (const bad of [null, [], {}, { ...config, enabled: "true" }, { ...config, provider: "supabase" },
    ...["abcde", "Avalid-project", "ends-in-", "a".repeat(31), projectId + "\n"].map(projectId => ({ ...config, projectId })),
    ...["secret", "AIza" + "x".repeat(34), config.apiKey + "\n"].map(apiKey => ({ ...config, apiKey })),
    ...["https://" + config.authDomain, config.authDomain + ".evil.test", "other-project.firebaseapp.com"].map(authDomain => ({ ...config, authDomain })),
    ...["1:123:ios:" + "a".repeat(20), "1:123:web:" + "a".repeat(19), config.appId + "\n"].map(appId => ({ ...config, appId }))]) {
    assert.throws(() => parseAccountConfig(bad));
  }
});

test("Firebase identity is project-scoped, UID case-sensitive, and bounded", () => {
  assert.equal(firebaseAccountId(projectId, uid), id);
  assert.notEqual(firebaseAccountId(projectId, uid.toLowerCase()), id);
  assert.notEqual(firebaseAccountId("other-project", uid), id);
  assert.equal(isAccountId(`firebase:${projectId}:${"x".repeat(128)}`), true);
  for (const invalid of ["", uid + "\n", "x".repeat(129), "other:uid", "ünicode", "contains/slash"]) {
    assert.throws(() => firebaseAccountId(projectId, invalid));
  }
  assert.equal(isAccountId("11111111-1111-4111-8111-111111111111"), false);
});

test("UI plan status is account-bound and never treats editable metadata or FR1 as account Pro", () => {
  const active = { accountId: id, status: "active", token: ["FR2", "dGVzdA", "c2ln"].join("."), expiresAt: Math.floor(Date.now() / 1000) + 600 };
  assert.deepEqual(parseAccountEntitlement(active, id), { accountId: id, status: "active", expiresAt: active.expiresAt });
  assert.deepEqual(parseAccountEntitlement({ accountId: id, status: "free" }, id), { accountId: id, status: "free" });
  for (const bad of [{ ...active, accountId: otherId }, { ...active, accountId: id.toLowerCase() },
    { ...active, expiresAt: 1 }, { ...active, expiresAt: Date.now() }, { ...active, expiresAt: Date.now() / 1000 + 4 * 86400 },
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

test("Firebase hosted email actions use only the approved continue destinations", () => {
  for (const origin of ["https://focus-recorder.netlify.app", "http://localhost", "http://localhost:3000"]) {
    assert.deepEqual(accountEmailActionSettings(origin), { url: `${origin}/account`, handleCodeInApp: false });
  }
  for (const origin of ["https://evil.test", "https://focus-recorder.netlify.app.evil.test", "https://user@focus-recorder.netlify.app",
    "https://focus-recorder.netlify.app/checkout", "https://focus-recorder.netlify.app?mode=reset", "http://localhost.evil.test", "//localhost:3000"]) {
    assert.throws(() => accountEmailActionSettings(origin));
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

test("same-UID token updates do not reset checkout consent or abort an in-flight request", async () => {
  let read = async () => session();
  let previousId: string | undefined;
  let consent = false;
  const checkout = new AbortController();
  let checkoutStarted = false;
  const updates: Array<{ session: AccountSession | null; loading: boolean }> = [];
  const tracker = accountSessionTracker(() => read(), (next, loading) => {
    if (previousId !== next?.user.id) { consent = false; if (checkoutStarted) checkout.abort(); }
    previousId = next?.user.id;
    updates.push({ session: next, loading });
  });
  await tracker.changed(id);
  consent = true; checkoutStarted = true;
  let resolve!: (value: AccountSession) => void;
  read = () => new Promise(value => { resolve = value; });
  const refreshing = tracker.changed(id);
  assert.equal(updates.at(-1)?.session?.user.id, id);
  assert.equal(updates.at(-1)?.loading, true);
  assert.equal(consent, true); assert.equal(checkout.signal.aborted, false);
  resolve(session(id, "rotated.access.token"));
  await refreshing;
  assert.equal(updates.at(-1)?.session?.access_token, "rotated.access.token");
  assert.equal(consent, true); assert.equal(checkout.signal.aborted, false);
  const switching = tracker.changed(otherId);
  assert.equal(updates.at(-1)?.session, null);
  assert.equal(consent, false); assert.equal(checkout.signal.aborted, true);
  resolve(session(otherId));
  await switching;
  tracker.dispose();
});

test("logout, newer identity events and disposal fence out stale session work", async () => {
  let resolve!: (value: AccountSession | null) => void;
  const updates: Array<AccountSession | null> = [];
  const tracker = accountSessionTracker(() => new Promise(value => { resolve = value; }), next => updates.push(next));
  const old = tracker.changed(id);
  const resolveOld = resolve;
  await tracker.changed(null);
  resolveOld(session());
  await old;
  assert.equal(updates.at(-1), null);
  const pending = tracker.changed(id);
  const prior = resolve;
  const newest = tracker.changed(otherId);
  resolve(session(otherId));
  await newest;
  prior(session());
  await pending;
  assert.equal(updates.at(-1)?.user.id, otherId);
  const disposed = tracker.changed(otherId);
  const count = updates.length;
  tracker.dispose(); resolve(session(otherId));
  await disposed;
  assert.equal(updates.length, count);
});

test("failed or mismatched session refreshes fail closed", async () => {
  let read = async (): Promise<AccountSession | null> => session();
  const updates: Array<AccountSession | null> = [];
  const tracker = accountSessionTracker(() => read(), next => updates.push(next));
  await tracker.changed(id);
  read = async () => session(otherId);
  await tracker.changed(id);
  assert.equal(updates.at(-1), null);
  read = async () => { throw new Error("synthetic offline failure"); };
  await tracker.changed(id);
  assert.equal(updates.at(-1), null);
});

test("session snapshots use the same current Firebase user before and after token lookup", async () => {
  let finish!: (token: { token: string; claims: { email_verified: boolean } }) => void;
  const user = { uid, email: "person@example.test", emailVerified: true,
    getIdTokenResult: async () => new Promise<{ token: string; claims: { email_verified: boolean } }>(resolve => { finish = resolve; }) };
  const auth = { currentUser: user as typeof user | null };
  const client = { auth, config } as unknown as AccountClient;
  const snapshot = getAccountSession(client);
  auth.currentUser = { ...user, uid: "OtherUser" };
  finish({ token: "example.access.token", claims: { email_verified: true } });
  await assert.rejects(snapshot, /account changed/);
  auth.currentUser = user;
  const valid = getAccountSession(client);
  finish({ token: "example.access.token", claims: { email_verified: true } });
  assert.deepEqual(await valid, session());
  auth.currentUser = null;
  assert.equal(await getAccountSession(client), null);
});

test("verified profile refreshes stale email claims once, including nested token listeners", async () => {
  for (const providerVerified of [true, false]) {
    let cached = { token: "old.unverified.token", claims: { email_verified: false } };
    let forced = 0;
    let nested: Promise<AccountSession | null> | undefined;
    let client: AccountClient;
    const user = { uid, email: "person@example.test", emailVerified: true,
      getIdTokenResult: async (force = false) => {
        if (!force) return cached;
        forced++;
        cached = { token: "new.refreshed.token", claims: { email_verified: providerVerified } };
        // Firebase emits onIdTokenChanged before the forced refresh promise settles.
        nested = getAccountSession(client);
        await Promise.resolve();
        return cached;
      } };
    client = { auth: { currentUser: user }, config } as unknown as AccountClient;
    const result = await getAccountSession(client);
    assert.equal(result?.access_token, "new.refreshed.token");
    assert.equal(result?.user.emailVerified, providerVerified);
    assert.equal((await nested)?.user.emailVerified, providerVerified);
    assert.equal(forced, 1);
    assert.equal((await getAccountSession(client))?.user.emailVerified, providerVerified);
    assert.equal(forced, 1, "an unverified result must not cause a listener/refresh loop");
  }
});

test("token verification alone never makes an unverified profile eligible for checkout", async () => {
  const user = { uid, email: "person@example.test", emailVerified: false,
    getIdTokenResult: async () => ({ token: "verified.example.token", claims: { email_verified: true } }) };
  const client = { auth: { currentUser: user }, config } as unknown as AccountClient;
  assert.equal((await getAccountSession(client))?.user.emailVerified, false);
});

test("website uses Firebase hosted actions and verified email gating, not URL-authorized password changes", () => {
  const hook = readFileSync(new URL("../src/lib/use-account.ts", import.meta.url), "utf8");
  const account = readFileSync(new URL("../src/app/account/account.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../src/lib/account-browser.ts", import.meta.url), "utf8");
  const checkout = readFileSync(new URL("../src/app/checkout/checkout.tsx", import.meta.url), "utf8");
  assert.match(hook, /onIdTokenChanged/);
  assert.match(hook, /accountSessionTracker/);
  assert.match(browser, /await reload\(user\)/);
  assert.match(browser, /getIdTokenResult\(true\)/);
  assert.match(browser, /user.emailVerified && token.claims.email_verified === true/);
  assert.match(account, /onClick=\{resetSignedInPassword\}/);
  assert.match(account, /sendPasswordResetEmail\(client.auth, user.email/);
  assert.match(account, /if \(!account.session\?\.user.emailVerified\) return/);
  assert.doesNotMatch(account, /confirmPasswordReset|applyActionCode|updatePassword|updateRecoveredPassword/);
  assert.doesNotMatch(browser, /getAnalytics|getFirestore|getStorage|browserPopupRedirectResolver/);
  assert.match(checkout, /!account.session\?\.user.emailVerified/);
  assert.match(checkout, /session.user.id !== account.session.user.id/);
  assert.doesNotMatch(checkout, /machineId|name="platform"|id="device-id"/);
  assert.match(checkout, /useState\(false\)/);
});

test("CSP allows only the two fixed Firebase authentication API hosts", async () => {
  const routes = await nextConfig.headers!();
  const csp = routes[0].headers.find(header => header.key === "Content-Security-Policy")!.value;
  const connect = csp.split(";").map(part => part.trim()).find(part => part.startsWith("connect-src"))!;
  assert.equal(connect, "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com");
  assert.doesNotMatch(connect, /\*|supabase|firebaseio|analytics/);
  assert.match(csp, /frame-ancestors 'none'/);
});
