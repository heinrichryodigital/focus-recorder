# Payments

Production `/checkout` offers Focus Pro for **$9 USD per month, linked to your account**, automatically renewing until cancelled in PayPal. No trial or setup fee. Sign in with a verified Firebase email account and give explicit recurring-payment consent, then review approval on PayPal's hosted page. No Device ID is requested. Card or PayPal credentials are never collected by this website.

The private backend independently verifies the Firebase ID token and current user, checks the fixed provider plan and completed payment, stores subscription state durably and issues a signed, account-bound lease lasting at most three days. Clients renew within the verified paid period. Account identity is project-scoped and case-sensitive, and cannot be assigned from a browser-supplied email or profile field. Browser returns alone cannot grant access. Refund, reversal and dispute events can block further leases; an already-issued offline lease can remain usable until expiry. Existing device-bound purchases stay on their legacy activation path and are not automatically transferred to a login.

Availability comes from the server and defaults to disabled when configuration is missing. This public repository contains only the UI: setting credentials in a clone does not provide the private backend.

## Configuration and webhook

Production secrets are in Netlify's production environment, never in public Git, client bundles or `NEXT_PUBLIC_` variables. The operator's protected environment file and setup instructions live outside this repository. They include the live client ID/secret, webhook ID, fixed plan ID, session secret and signing key. Environment changes require a redeploy.

Firebase uses the four web app settings listed in `.env.example`, with account login enabled only for the coordinated website/backend/native-app rollout. Do not add a Firebase Admin or service-account private key. Firebase's default hosted email action handler completes verification and password resets; the website only sends explicitly requested emails with the approved `/account` continue URL. See the [account setup](../README.md#account-based-pro).

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
