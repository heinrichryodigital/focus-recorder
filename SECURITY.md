# Security model

## Public source is deliberately limited

Cloning this repository provides the public website and checkout demonstration. It does not provide a working recorder engine, license issuer, or signing key. The desktop implementation and release automation are maintained separately in a private repository. A publication guard rejects unexpected tracked files and common secret formats.

## License authenticity

Official desktop builds allow Free recording without activation: at most 1080p, 24 fps, with a moving watermark baked into every exported frame. A valid Ed25519-signed, device-bound, expiring license unlocks Pro export options. Missing, invalid, expired, or unconfigured licenses fall back to Free, not Pro. Tokens are product scoped and require the recording entitlement. The verification key can safely be distributed; issuance uses a private key stored outside source control.

An offline license cannot provide immediate server-side revocation or a trusted clock. A determined attacker controlling a computer can patch a local program; signatures and a private repository do not make desktop binaries impossible to reverse engineer. Strong enforcement of online services must happen on the server. Do not describe this implementation as uncrackable.

Public release assets contain compiled desktop applications only, not the private project or license issuer. Electron's Windows runtime JavaScript can still be extracted from an installer; private source hosting is not binary encryption. macOS Developer ID notarization and Windows Authenticode signing remain pending for these preview builds.

## Payments

The public checkout is a local simulation. It does not contact Stripe or PayPal, process money, collect payment details, or grant a desktop license. A browser success screen or mock receipt is never evidence of payment.

A future paid launch requires authenticated server-side entitlement storage, verified provider webhooks, idempotent fulfillment, refund/revocation handling, and separately configured live credentials. Those are intentionally not represented as active by this mock.

## Reporting

Do not post keys, licenses, or exploit details in public issues. Use the repository owner's private security reporting channel when enabled.
