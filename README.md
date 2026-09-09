# Focus Recorder · public website

Website: [focus-recorder.netlify.app](https://focus-recorder.netlify.app).

The official Focus Recorder website, built with Next.js and TypeScript. This is deliberately a limited public repository: the desktop recording engine, license issuer, signing material, and release pipelines belong in the private `focus-recorder-core` repository.

## Source boundary

Public: marketing pages, product documentation, checkout UI, isolated payment simulation, and publication checks.

Private: macOS and Windows recording implementations, desktop build pipelines, and licensing issuer tools. Only compiled desktop preview installers are attached to public GitHub releases. Private signing keys must also stay outside the private repository, in an operator-controlled secret store.

Public visibility is not an open-source license. No license to redistribute the proprietary desktop application is granted by this repository.

See [SECURITY.md](SECURITY.md) for the protection model and its limits.

## User guide

The [recording guide](https://focus-recorder.netlify.app/guide) covers first-time Mac
and Windows setup, a short practice recording, saved defaults, System/Light/Dark
appearance, account-based Pro, troubleshooting, and manual updates. Direct links:
[Mac](https://focus-recorder.netlify.app/guide#mac),
[Windows](https://focus-recorder.netlify.app/guide#windows),
[settings](https://focus-recorder.netlify.app/guide#settings), and
[zoom versus cursor speed](https://focus-recorder.netlify.app/guide#motion).

The guide uses the site's existing brand icons and colors, accessible anchor
navigation, a platform settings table, and a native expandable practice checklist.
It is a Server Component with no new client-side state, tracking, external media,
account calls, or payment behavior. The checklist only marks temporary practice
steps; it never operates the recorder. Its source is `src/app/guide/page.tsx`, with
guide-scoped styles in `src/app/globals.css` and checks in `tests/guide.test.ts`.

Keep platform limits and control names aligned with the shipped desktop release.
Strength means zoom magnification, not cursor speed. Reset preferences restores
appearance and recording defaults, without signing out, deleting recordings, or
changing a Pro license or billing. The equivalent offline developer/distribution
guide is `docs/USER_GUIDE.md` in the private desktop repository. Do not promise
Windows production validation or an automatic updater without evidence.

## Develop

Use Node 22 or newer. Run `npm ci`, then `npm run dev`. Visit http://localhost:3000.

`npm run build` builds the production website. `npm run typecheck` validates TypeScript; `npm run check:public` validates tracked publication content. No external service credentials are needed for the public website or payment simulation.

The animated homepage demonstration is an interactive illustration, not footage from the app. Free desktop downloads record up to 1080p at 24 fps with a bouncing watermark throughout the exported video. A valid Pro license removes it and unlocks supported higher frame rates. Production uses a separately assembled private PayPal backend for $9 USD monthly subscriptions. Cloning this repository does not include that backend: checkout stays unavailable without it. `/checkout/demo` remains a no-charge simulation.

## Account-based Pro

New subscriptions use Firebase Authentication login, not a Device ID. `/account`
provides email/password sign-in, verified-email signup, password reset emails,
plan status and local browser sign-out. The private backend independently verifies
the Firebase ID token, current user, verified email and PayPal payment before granting
account-based Pro. Browser profile metadata never grants access. Legacy paid
activations remain separate; signing up does not transfer their ownership.

Deploy this website together with the account-enabled backend and updated Mac and
Windows apps. Do not deploy it over the legacy backend as an isolated UI change.
The selected Firebase project must be configured first; an unconfigured account
service leaves signup and checkout unavailable.

The private operator environment needs `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`,
`FIREBASE_AUTH_DOMAIN`, `FIREBASE_APP_ID`, and `ACCOUNT_LOGIN_ENABLED=true`.
Use the project's **web app configuration**, not an Admin/service-account key.
The API key is a public Firebase identifier; it does not grant account or Pro access.
Configuration is returned through the private `/api/account/config` route. The CSP
permits auth connections only to `identitytoolkit.googleapis.com` and
`securetoken.googleapis.com`, without wildcard Google hosts. Keep actual operator
environment values out of Git; the public `.env.example` intentionally stays blank.

Enable Email/Password in Firebase Authentication and add
`focus-recorder.netlify.app` to Authorized domains. Keep Firebase's default hosted
email action handler (`https://YOUR-PROJECT.firebaseapp.com/__/auth/action`) for
verification and password reset. Do not point that handler to `/account`: this
website sends emails but never applies an email action code or changes passwords
directly. The approved continue URL is `https://focus-recorder.netlify.app/account`.
Verification is required before checkout and Pro access; use Refresh account after
opening the verification link. Password reset emails are available both before and
after sign-in, and are sent only after an explicit button click.

The website initializes only Firebase Authentication: no Analytics, Firestore,
Storage, popup sign-in resolver, or Admin SDK. No Firebase service-account private
key is required for this integration. Browser sessions use local storage when
available, falling back to session-only or in-memory persistence. Email delivery
is subject to Firebase quotas and abuse protection; never promise unlimited sends.

Put PayPal test credentials in the ignored `.env.local`, using the blank `.env.example` as a reference. Never populate the public example or prefix credentials with `NEXT_PUBLIC_`. See [payment setup](docs/PAYMENTS.md).

See [release status](docs/RELEASE_STATUS.md) for verified platform capabilities and remaining distribution work. Features are committed and pushed independently; the desktop repository is never included in a public website push.
