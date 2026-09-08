# Payments

Production `/checkout` offers Focus Pro for **$9 USD per month, one device**, automatically renewing until cancelled in PayPal. No trial or setup fee. The form requires a Device ID and explicit recurring-payment consent, then redirects to PayPal's hosted subscription approval. Card or PayPal credentials are never collected by this website.

The private backend checks the fixed provider plan and completed payment, stores subscription state durably and issues a signed, device-bound license lasting at most three days. Clients renew within the verified paid period. Browser returns alone cannot grant access. Refund, reversal and dispute events can block further leases; an already-issued offline license can remain usable until expiry.

Availability comes from the server and defaults to disabled when configuration is missing. This public repository contains only the UI: setting credentials in a clone does not provide the private backend.

## Configuration and webhook

Production secrets are in Netlify's production environment, never in public Git, client bundles or `NEXT_PUBLIC_` variables. The operator's protected environment file and setup instructions live outside this repository. They include the live client ID/secret, webhook ID, fixed plan ID, session secret and signing key. Environment changes require a redeploy.

Webhook URL: `https://focus-recorder.netlify.app/api/paypal/webhook`.

Registered events:

- `BILLING.SUBSCRIPTION.CREATED`, `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.RE-ACTIVATED`.
- `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`.
- `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`, `PAYMENT.SALE.REVERSED`.
- `CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`, `CUSTOMER.DISPUTE.RESOLVED`.

The backend verifies authenticity before changing payment state. PayPal's live merchant plan and webhook registration are verified; automated tests use injected provider responses and make no real buyer charge.

## Isolated payment playground

`/checkout/demo` is a local simulation for Stripe and PayPal provider labels. Its illustrative $49/$99 one-time prices are not production offers. It does not load payment SDKs, call providers, collect account details, persist orders or issue licenses. Every receipt identifies itself as a demo, with zero charged and no entitlement granted.

Choose a plan, provider and Success, Decline or Cancel outcome. No keys are needed. `POST /api/mock-checkout` bounds and validates JSON, requires the exact same-origin `Origin`, and uses server-owned demo prices. These checks are not authentication; the demo is disconnected from production fulfillment.

The blank `.env.example` retains safe mock defaults for public development. Never populate it with credentials or commit `.env.local`.
