import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Brand } from "../../components/chrome";
import type { ReactNode } from "react";

export default function CheckoutFrame({ children, returning = false }: { children: ReactNode; returning?: boolean }) {
  return <main id="main" className="checkout-shell checkout-live">
    <nav className="checkout-nav" aria-label="Checkout navigation"><Brand />
      <Link className="checkout-back" href="/#pricing"><ArrowLeft size={18} aria-hidden="true" /> Back to plans</Link>
    </nav>
    <div className="checkout-banner"><span className="checkout-status-dot" aria-hidden="true" /> FOCUS PRO
      <span className="checkout-banner-detail">Your account. $9 USD per month.</span>
    </div>
    <div className="checkout-grid">
      <aside className="checkout-story">
        <span className="checkout-eyebrow">{returning ? "ONE LAST STEP" : "A CLEANER FINISH"}</span>
        <h1>Your story.<br /> <span>In full focus.</span></h1>
        <p>Watermark-free exports and the quality settings supported by your device.</p>
        <ul className="checkout-benefits">
          <li><Check size={18} aria-hidden="true" />Mac: up to 1440p and 60 fps</li>
          <li><Check size={18} aria-hidden="true" />Windows preview: up to 1080p and 30 fps</li>
          <li><Check size={18} aria-hidden="true" />Your recordings stay on your computer</li>
        </ul>
        <div className="checkout-info"><strong>Try Free before subscribing.</strong><p>Free includes up to 1080p at 24 fps. A Focus Recorder watermark bounces throughout every exported video; it is added at export. <Link href="/download">Download and check your device</Link>.</p></div>
      </aside>
      <section className="checkout-panel" aria-label={returning ? "Payment confirmation" : "Focus Pro subscription"}>{children}</section>
    </div>
    <footer className="checkout-footer"><Link href="/privacy">Privacy & subscription data</Link><Link href="/guide">Activation guide <ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
  </main>;
}
