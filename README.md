# Focus Recorder · public website

Website: [focus-recorder.netlify.app](https://focus-recorder.netlify.app).

The official Focus Recorder website, built with Next.js and TypeScript. This is deliberately a limited public repository: the desktop recording engine, license issuer, signing material, and release pipelines belong in the private `focus-recorder-core` repository.

## Source boundary

Public: marketing pages, product documentation, checkout UI, isolated payment simulation, and publication checks.

Private: macOS and Windows recording implementations, desktop build pipelines, and licensing issuer tools. Only compiled desktop preview installers are attached to public GitHub releases. Private signing keys must also stay outside the private repository, in an operator-controlled secret store.

Public visibility is not an open-source license. No license to redistribute the proprietary desktop application is granted by this repository.

See [SECURITY.md](SECURITY.md) for the protection model and its limits.

## Develop

Use Node 22 or newer. Run `npm ci`, then `npm run dev`. Visit http://localhost:3000.

`npm run build` builds the production website. `npm run typecheck` validates TypeScript; `npm run check:public` validates tracked publication content. No external service credentials are needed for the public website or payment simulation.

The animated homepage demonstration is an interactive illustration, not footage from the app. Free desktop downloads record up to 1080p at 24 fps with a bouncing watermark throughout the exported video. A valid Pro license removes it and unlocks supported higher frame rates. Production uses a separately assembled private PayPal backend for $9 USD monthly subscriptions. Cloning this repository does not include that backend: checkout stays unavailable without it. `/checkout/demo` remains a no-charge simulation.

## Account-based Pro

New subscriptions use Supabase login, not a Device ID. `/account` provides sign-in,
email-confirmed signup, password recovery, plan status and local browser sign-out.
The private backend verifies the Supabase user and PayPal payment before granting
account-based Pro. Browser profile metadata never grants access. Legacy paid
activations remain separate; signing up does not transfer their ownership.

Deploy this website together with the account-enabled backend and updated Mac and
Windows apps. Do not deploy it over the legacy backend as an isolated UI change.
The current Supabase project must be configured first; an unconfigured account
service leaves signup and checkout unavailable.

Set `SUPABASE_URL` to the selected project URL **at build time as well as runtime**:
the content-security policy permits authentication connections only to that exact
origin. The private operator environment also needs `SUPABASE_PUBLISHABLE_KEY` and
`ACCOUNT_LOGIN_ENABLED=true`. Never use a service-role or secret key in browser
configuration. Keep actual environment values out of Git.

Supabase email confirmation and recovery redirects must allow the production
`/account` page and its approved `next`/`mode` query variants. Email links using
PKCE must be completed in the browser that requested them. Keep email confirmation
enabled; production email delivery requires a correctly configured sender.

Put PayPal test credentials in the ignored `.env.local`, using the blank `.env.example` as a reference. Never populate the public example or prefix credentials with `NEXT_PUBLIC_`. See [payment setup](docs/PAYMENTS.md).

See [release status](docs/RELEASE_STATUS.md) for verified platform capabilities and remaining distribution work. Features are committed and pushed independently; the desktop repository is never included in a public website push.
