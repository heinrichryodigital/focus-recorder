# Focus Recorder · public website

The official Focus Recorder website, built with Next.js and TypeScript. This is deliberately a limited public repository: the desktop recording engine, license issuer, signing material, and release pipelines belong in the private `focus-recorder-core` repository.

## Source boundary

Public: marketing pages, product documentation, checkout simulation, and publication checks.

Private: macOS and Windows recording implementations, desktop build pipelines, licensing issuer tools, and commercial release artifacts. Private signing keys must also stay outside the private repository, in an operator-controlled secret store.

Public visibility is not an open-source license. No license to redistribute the proprietary desktop application is granted by this repository.

See [SECURITY.md](SECURITY.md) for the protection model and its limits.

## Develop

Use Node 22 or newer. Run `npm ci`, then `npm run dev`. Visit http://localhost:3000.

`npm run build` builds the production website. `npm run typecheck` validates TypeScript; `npm run check:public` validates tracked publication content. No external service credentials are needed for the public website or payment simulation.

The animated homepage demonstration is an interactive illustration, not footage from the app. Download pages distinguish existing local macOS builds from public installer availability and the Windows preview.
