# Release status · September 8, 2026

| Component | Implemented and verified | Remaining distribution work |
| --- | --- | --- |
| Next.js / TypeScript website | Vercel deployment, responsive UI, Free/Pro comparison, download links, product guide, pricing demonstration, privacy notes | Final commercial pricing and signed stable installers |
| Stripe / PayPal mock | Both provider labels; success, decline and cancellation; server-owned prices; no-charge/non-entitling receipts; 10 automated cases | Real provider setup and server-verified fulfillment are not enabled |
| macOS | Native recording; Free 720p/1080p24 with bouncing export watermark; signed device-bound Pro supports 1440p30/60 and no watermark; 25 debug and 25 release tests pass | Public Developer ID distribution and notarization |
| Windows x64 preview | Native Win32 cursor-free capture, smooth cursor, autozoom, local WebM, optional microphone; Free 720p/1080p24 with bouncing export watermark; Pro up to 1080p30 without watermark; automated policy, motion, encoded-output, and UI checks | Authenticode signing, real-device visual/audio and mixed-DPI QA; no system audio or MP4 support yet |
| Source protection | Website/docs public; desktop engines/issuer private; publication guard and signed-license checks | Offline DRM cannot prevent all binary patches or clock changes; online revocation is future work |

Version 0.3.0 is a free public preview: no account, payment, or activation is required to record in Free. Free exports are watermarked for their entire duration; the app discloses limits and locks Pro controls before recording. macOS is development-signed and not notarized; Windows is unsigned. The desktop source and issuer remain private.

Website checkout does not sell either build or issue licenses. Adding PayPal credentials to the ignored local environment file does not connect live payments. A server-verified payment and fulfillment integration is still required.
