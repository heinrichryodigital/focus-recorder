import Link from 'next/link';
import {Command, Monitor, Download as DownloadIcon, ArrowUpRight} from 'lucide-react';
import {Header, Footer} from '@/components/chrome';
export const metadata = {title: 'Free downloads'};
const release = 'https://github.com/heinrichryodigital/focus-recorder/releases/download/v0.3.0-free-preview';
export default function Download() {
  return <><Header/><main id="main" className="content-page page-width">
    <span className="eyebrow">YOUR NEXT WALKTHROUGH STARTS FREE</span>
    <h1>Find your Focus.</h1>
    <p className="lead">Download free. No account, payment, or activation needed. Record at up to 1080p and 24 fps with automatic zoom and a smoother cursor.</p>
    <p className="release-note">Free exports include a moving Focus Recorder watermark throughout the whole video. The watermark is added only to exported video. A valid Pro license removes it and unlocks higher frame rates.</p>
    <div className="content-grid">
      <article className="info-card"><Command size={32}/><h2>Focus for macOS</h2><span className="status-pill">Free preview · v0.3.0</span>
        <ul><li>macOS 15 or later · Apple silicon</li><li>Free: 720p / 1080p at 24 fps</li><li>Automatic zoom, smooth cursor, system audio</li><li>Local H.264 QuickTime movie</li><li>Pro: up to 1440p, 30 / 60 fps, no watermark</li></ul>
        <a className="button button-dark" href={release + '/Focus-Recorder-0.3.0-macOS-arm64.zip'}><DownloadIcon size={17}/> Download free for Mac</a>
        <p>This preview is development-signed, not notarized for public distribution. macOS may block it. A standard Developer ID–signed, notarized release is still pending; you do not need to disable system security.</p>
        <Link className="text-link" href="/guide">Read the quick start <ArrowUpRight size={15}/></Link>
      </article>
      <article className="info-card"><Monitor size={32}/><h2>Focus for Windows</h2><span className="status-pill pending">Free preview · v0.3.0</span>
        <ul><li>Windows 10 / 11 · x64</li><li>Free: 720p / 1080p at 24 fps</li><li>Automatic zoom, smooth cursor, optional microphone</li><li>Local WebM video · no system audio yet</li><li>Pro: up to 1080p at 30 fps, no watermark</li></ul>
        <a className="button button-dark" href={release + '/Focus-Recorder-0.3.0-Windows-x64.exe'}><DownloadIcon size={17}/> Download free for Windows</a>
        <p>This preview installer is unsigned and may trigger SmartScreen. Windows capture and packaging are tested in CI; real-device visual, audio, and mixed-DPI testing is still needed.</p>
        <Link className="text-link" href="/guide#windows">Windows quick start <ArrowUpRight size={15}/></Link>
      </article>
    </div>
    <p className="release-note">Free use has no time limit. Higher-quality options are marked Pro inside the app. PayPal and Stripe checkout are still demonstrations: they do not charge money or issue an activation license. <a href="https://github.com/heinrichryodigital/focus-recorder/releases/tag/v0.3.0-free-preview">Release notes and file checksums</a>.</p>
  </main><Footer/></>;
}
