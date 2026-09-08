# Payment playground

`/checkout?plan=pro&provider=stripe` demonstrates a checkout flow. Supported plans are `pro` ($49 USD) and `studio` ($99 USD), both illustrative one-time prices. Supported provider labels are `stripe` and `paypal`.

This is a **local simulation**, not a live integration or either provider's sandbox. It does not load payment SDKs, call providers, collect card/account details, persist orders, or issue licenses. A success result is not proof of payment. Downloadable receipts explicitly identify themselves as demos; the amount actually charged is always zero.

## Try it

1. Pick a plan and provider on `/checkout`.
2. Choose Success, Decline, or Cancel.
3. Run the simulation, inspect the result, and optionally download the demo receipt.
4. Choose “Try another checkout” to test another outcome.

No payment keys or environment variables are needed.

## API boundary

`POST /api/mock-checkout` accepts exactly `{"plan":"pro","provider":"stripe","outcome":"success"}` with `Content-Type: application/json`. Outcomes also include `declined` and `cancelled`.

The handler requires the exact same-origin `Origin` header, rejects cross-site browser requests, bounds the actual streamed body to 1,024 bytes, rejects unknown fields, and derives prices from its own allowlist. All handled responses are `no-store`. The endpoint always returns `mode: "simulation"`; every receipt includes `chargedAmountCents: 0` and `entitlementGranted: false`. Origin validation limits browser cross-origin use; it is not authentication or a licensing security boundary. The demo has no valuable or persistent mutation to protect.

`tests/mock-payments.test.ts` covers both providers, every outcome, price/entitlement injection, strict inputs, origin checks, JSON/UTF-8 errors, body limits, non-POST access, and non-entitling receipts.

## Before accepting real money

Build a separate, private payment backend with official hosted Stripe Checkout and PayPal Orders, server-held credentials and authoritative price identifiers. Verify provider webhook signatures and payment state server-side, process events idempotently, persist orders, handle refunds/disputes, and authorize any license issuance there. A browser redirect, client-selected outcome, or demo receipt must never grant a production entitlement. The mock endpoint must remain disconnected from that backend.

References: [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Stripe Checkout](https://docs.stripe.com/payments/checkout), [PayPal Checkout](https://developer.paypal.com/docs/checkout/).
