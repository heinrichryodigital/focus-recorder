# Release status · September 9, 2026

Version 0.6.0 adds website-matched orange/aperture branding, System/Light/Dark appearance, saved recording preferences with a reset option, and a quick-start tutorial. Settings and appearance are local to each computer; they do not change the recorded display's theme. Existing Firebase account login, PayPal subscriptions, and licensing are unchanged.

No account, payment or activation is required for Free recording. Exports are limited to at most 1080p and 24 fps and include a bouncing watermark for the whole video. The app discloses these limits and marks paid controls Pro. Older device-bound purchases retain their legacy activation option; creating a login does not automatically transfer ownership.

| Component | Capabilities and checks | Remaining limitations |
| --- | --- | --- |
| Next.js / TypeScript website | Firebase email login and hosted email actions, verified-email checkout gating, Free/Pro comparison, Apple/Windows downloads, account race and publication-boundary tests | Netlify and Firebase are subject to their free allowances; no real account/email automation tests |
| Private PayPal subscriptions | Fixed $9 USD/month plan, independent Firebase user verification, durable state, signed webhook verification, refunds/disputes and short account leases | No real buyer charge was used as an automated test |
| macOS | Native recording; Free 720p/1080p24; Pro up to 1440p and 60 fps; system audio; Firebase login with Keychain storage, account/expiry/race regression tests | Apple Development-signed, not Developer ID-signed or notarized |
| Windows x64 | Native Win32 capture, smooth cursor, autozoom, WebM and optional microphone; Pro up to 1080p30; Firebase login with encrypted session storage and account/expiry/race regression tests | Unsigned installer; broader real-device visual/audio/mixed-DPI QA pending; no system audio or MP4 |
| Source protection | Website public; desktop/payment/issuer source private; server-issued Ed25519 licenses | Binaries can be reverse-engineered; offline leases may remain valid up to three days after a server revocation |

Pro costs $9 USD per month for your verified account, renewing automatically until cancelled in PayPal. There is no trial or setup fee. Sign into the website and the latest app with the same account; a verified payment unlocks Pro. Connect at least every three days to renew access. Cancellation retains the verified paid period; refunds and disputes can block further renewals sooner. Try the Free preview on your device before subscribing.

The public repository contains checkout UI but not the private backend. `/checkout/demo` remains an isolated no-charge, non-entitling Stripe/PayPal simulation. A browser return or demo receipt never proves payment.

## Configurable desktop preview

[Free macOS and Windows downloads](https://github.com/heinrichryodigital/focus-recorder/releases/tag/v0.6.0-theme-preview) include the new themes and preferences. The release page contains publisher checksums and build notes. Windows output is variable-frame-rate, not guaranteed constant-frame-rate.

Read the [user guide](https://focus-recorder.netlify.app/guide) for installation, a first recording, zoom strength, saved settings, and troubleshooting. Updates are downloaded manually; this preview does not include an automatic updater.

The current website and payment origin is [focus-recorder.netlify.app](https://focus-recorder.netlify.app). Security warnings may appear for these preview builds; do not disable system security to use them.
