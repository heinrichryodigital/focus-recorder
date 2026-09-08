# Focus Recorder · public website

Website: [focus-recorder.vercel.app](https://focus-recorder.vercel.app).

The official Focus Recorder website, built with Next.js and TypeScript. This is deliberately a limited public repository: the desktop recording engine, license issuer, signing material, and release pipelines belong in the private `focus-recorder-core` repository.

## Source boundary

Public: marketing pages, product documentation, checkout simulation, and publication checks.

Private: macOS and Windows recording implementations, desktop build pipelines, and licensing issuer tools. Only compiled desktop preview installers are attached to public GitHub releases. Private signing keys must also stay outside the private repository, in an operator-controlled secret store.

Public visibility is not an open-source license. No license to redistribute the proprietary desktop application is granted by this repository.

See [SECURITY.md](SECURITY.md) for the protection model and its limits.

## Develop

Use Node 22 or newer. Run `npm ci`, then `npm run dev`. Visit http://localhost:3000.

`npm run build` builds the production website. `npm run typecheck` validates TypeScript; `npm run check:public` validates tracked publication content. No external service credentials are needed for the public website or payment simulation.

The animated homepage demonstration is an interactive illustration, not footage from the app. Free desktop downloads record up to 1080p at 24 fps with a bouncing watermark throughout the exported video. A valid Pro license removes the watermark and unlocks supported higher frame rates. Checkout is still mock-only, including when local PayPal credentials have been configured.

Put PayPal test credentials in the ignored `.env.local`, using the blank `.env.example` as a reference. Never populate the public example or prefix credentials with `NEXT_PUBLIC_`. See [payment setup](docs/PAYMENTS.md).

See [release status](docs/RELEASE_STATUS.md) for verified platform capabilities and remaining distribution work. Features are committed and pushed independently; the desktop repository is never included in a public website push.
