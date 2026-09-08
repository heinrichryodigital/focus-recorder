# Website deployment

Vercel project: `focus-recorder`, account scope: `mrheinrichhs-projects`.

Current website: https://focus-recorder.vercel.app. The first CLI deployment was automatically assigned Vercel's production domain. No custom domain has been purchased or configured.

Deployments currently use the authenticated Vercel CLI. Automatic Git deployment is not connected: the Vercel GitHub integration cannot access the separate `heinrichryodigital` account's repository. Repository pushes still work normally through GitHub CLI. Connect the intended GitHub account in Vercel to enable automatic deployments later.

The project contains only the public Next.js website, product docs, and checkout simulation. No license issuer, desktop source, or signing key may be uploaded. No external payment credentials are required.

## Preview

Run `npm ci`, `npm test`, `npm run build`, and `npm run check:public` after staging the intended files. Deploy with `vercel deploy --yes --scope mrheinrichhs-projects` from this repository.

The Vercel CLI link is stored in ignored `.vercel/`. GitHub credentials are not stored in the project. The production payment setup is separate future work, not a configuration switch in this demo. Keep all current checkout paths visibly labelled as simulation.

## Release checklist

- Keep desktop source and pre-release installers in the private repository.
- Notarize macOS installers and Authenticode-sign Windows installers before public distribution.
- Complete real-device Windows recording, microphone, mixed-DPI, and installer QA.
- Implement private server-side entitlement fulfillment and verified provider webhooks before accepting real payments.
- Publish final prices and customer policies when the product is ready for paid availability.
