# Release status · September 9, 2026

Version 0.4.0 is a free public preview. No account, payment or activation is required for Free recording. Exports are limited to at most 1080p and 24 fps and include a bouncing watermark for the whole video. The app discloses these limits and marks paid controls Pro.

| Component | Verified | Remaining limitations |
| --- | --- | --- |
| Next.js / TypeScript website | Netlify deployment, responsive Apple/Windows marks, Free/Pro comparison, downloads, guide, $9 monthly checkout UI; 23 automated tests | Hosting is subject to the Free allowance |
| Private PayPal subscriptions | Fixed $9 USD/month plan, durable state, signed webhook verification, refunds/disputes and device-bound short license leases; 74 automated tests and live rejection/storage probes | No real buyer charge was used as an automated test |
| macOS | Native recording; Free 720p/1080p24; Pro up to 1440p and 60 fps; system audio; 29 tests and packaged signature verification | Apple Development-signed, not Developer ID-signed or notarized |
| Windows x64 | Native Win32 capture, smooth cursor, autozoom, WebM and optional microphone; Pro up to 1080p30; 33 Windows CI tests with no skips, including capture | Unsigned installer; broader real-device visual/audio/mixed-DPI QA pending; no system audio or MP4 |
| Source protection | Website public; desktop/payment/issuer source private; server-issued Ed25519 licenses | Binaries can be reverse-engineered; offline leases may remain valid up to three days after a server revocation |

Pro costs $9 USD per month for one device, renewing automatically until cancelled in PayPal. There is no trial or setup fee. Apply the token returned after server verification of payment. Connect at least every three days to renew access. Cancellation retains the verified paid period; refunds and disputes can block further renewals sooner. Try the Free preview on your device before subscribing.

The public repository contains checkout UI but not the private backend. `/checkout/demo` remains an isolated no-charge, non-entitling Stripe/PayPal simulation. A browser return or demo receipt never proves payment.

## Published preview

[Free macOS and Windows downloads](https://github.com/heinrichryodigital/focus-recorder/releases/tag/v0.4.0-monthly-pro-preview) include SHA-256 checksums. The Windows asset comes from private core revision `4c3f6bb1c41037f117e4c5362d509c952bcc8d6a`, Windows CI run `34253155062`. Windows output is variable-frame-rate, not guaranteed constant-frame-rate.

The current website and payment origin is [focus-recorder.netlify.app](https://focus-recorder.netlify.app). Security warnings may appear for these preview builds; do not disable system security to use them.
