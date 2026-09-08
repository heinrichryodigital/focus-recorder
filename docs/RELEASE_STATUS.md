# Release status · September 8, 2026

| Component | Implemented and verified | Remaining distribution work |
| --- | --- | --- |
| Next.js / TypeScript website | Vercel deployment, responsive UI, product guide, pricing demonstration, privacy notes; GitHub quality checks pass | Final commercial pricing and public installer rollout |
| Stripe / PayPal mock | Both provider labels; success, decline and cancellation; server-owned prices; no-charge/non-entitling receipts; 10 automated cases | Real provider setup and server-verified fulfillment are not enabled |
| macOS | Existing native local recorder; signed device-bound activation; owner license verified; 18 release tests | Public Developer ID distribution and notarization |
| Windows x64 preview | Native Win32 cursor-free capture, smooth cursor, autozoom, 720p/1080p at up to 30 fps, local WebM, optional microphone; all 11 tests pass on Windows CI, including capture API test; installer built | Authenticode signing, real-device visual/audio and mixed-DPI QA; no system audio or MP4 support yet |
| Source protection | Website/docs public; desktop engines/issuer private; publication guard and signed-license checks | Offline DRM cannot prevent all binary patches or clock changes; online revocation is future work |

The Windows installer is intentionally a private pre-release artifact. The macOS build remains available to the project owner locally. Website checkout does not sell either build, issue licenses, or unlock private artifacts.
