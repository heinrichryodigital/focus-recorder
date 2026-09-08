# Website deployment

Production: [focus-recorder.netlify.app](https://focus-recorder.netlify.app), Netlify project `focus-recorder`. Production is public for visitors and payment webhooks; non-production previews remain behind Netlify login. No custom domain has been purchased.

The deployment uses Netlify Free with Node 24, the Next.js adapter, server functions and durable Blobs storage. Free usage is metered and may pause the site when its allowance is exhausted. No paid plan or automatic recharge is required by this setup.

## Source and deployment boundary

This repository contains the public Next.js UI, product docs and isolated checkout simulation. The private core repository assembles a deployment in an ignored output directory, overlaying private payment routes and dependencies. Do not copy those server files back into this public repository.

PayPal credentials, the checkout session secret and the private signing key are server environment variables on Netlify, for production only. No environment files or secrets are copied into the assembly or public assets. Free uses ordinary account-protected variables, not the paid Secrets Controller feature. Never prefix these values with `NEXT_PUBLIC_`.

The authenticated Netlify CLI builds and deploys the assembled output. Git auto-deploy is intentionally not connected: a public-only deployment would omit the private backend. The older Vercel website is not the current payment endpoint.

## Verification and release checklist

- Run public tests, TypeScript/build checks and `npm run check:public` after staging the exact public files. Run private payment tests separately.
- Build with the Netlify adapter and inspect client assets for secret values before deployment.
- Verify HTTPS, checkout configuration, durable storage, invalid-license rejection and unsigned-webhook rejection. Never use a buyer charge as an automated smoke test.
- Verify the live PayPal plan is exactly $9 USD per month and its webhook targets `/api/paypal/webhook` on the production origin.
- Keep compiled installers separate from private source and keys. Publish checksums with each release.
- Retain preview warnings: macOS Developer ID notarization and Windows Authenticode signing remain pending, along with broader real-device Windows visual/audio/mixed-DPI QA.
- Rebuild and redeploy after production environment changes. Disable checkout before maintenance that prevents safe fulfillment.
