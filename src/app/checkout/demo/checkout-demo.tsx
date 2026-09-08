"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Brand } from "../../../components/chrome";
import {
  DEMO_PLANS,
  formatDemoAmount,
  type DemoOutcome,
  type DemoPlan,
  type DemoProvider,
  type MockCheckoutResult,
  type MockReceipt,
} from "../../../lib/mock-payments";

const providerNames = { stripe: "Stripe", paypal: "PayPal" } as const;
const resultCopy = {
  success: { title: "That’s a wrap.", label: "Simulated success", detail: "Your demo payment was approved. This is a preview receipt; no purchase was made." },
  declined: { title: "Let’s try another take.", label: "Simulated decline", detail: "The demo payment was declined. Try again with a different outcome or provider." },
  cancelled: { title: "No rush. Come back anytime.", label: "Simulated cancellation", detail: "You cancelled this demo checkout. You can return and try the flow again." },
} as const;

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ReceiptIcon({ outcome }: { outcome: DemoOutcome }) {
  return <span className={`checkout-result-icon checkout-result-icon--${outcome}`} aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none">{outcome === "success" ? <path d="m5 12 4 4L19 6" /> : outcome === "declined" ? <><path d="M12 5v8" /><path d="M12 17v.2" /></> : <path d="M6 12h12" />}</svg></span>;
}

function downloadReceipt(receipt: MockReceipt) {
  const lines = [
    "FOCUS RECORDER — DEMO RECEIPT",
    "LOCAL SIMULATION ONLY — NOT PROOF OF PAYMENT",
    "",
    `Demo reference: ${receipt.id}`,
    `Created: ${receipt.createdAt}`,
    `Provider label: ${providerNames[receipt.provider]}`,
    `Plan: ${receipt.planName}`,
    `Outcome: ${receipt.outcome}`,
    `Illustrative price: ${formatDemoAmount(receipt.illustrativeAmountCents)} USD`,
    "Actually charged: $0 USD",
    "License or production entitlement issued: No",
    "",
    "No Stripe or PayPal API was contacted. This is not a provider sandbox transaction.",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `focus-recorder-${receipt.id}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CheckoutDemo({ initialPlan, initialProvider }: { initialPlan: DemoPlan; initialProvider: DemoProvider }) {
  const [plan, setPlan] = useState<DemoPlan>(initialPlan);
  const [provider, setProvider] = useState<DemoProvider>(initialProvider);
  const [outcome, setOutcome] = useState<DemoOutcome>("success");
  const [receipt, setReceipt] = useState<MockReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const shouldRestoreFocus = useRef(false);

  useEffect(() => {
    if (receipt) resultHeading.current?.focus();
    else if (shouldRestoreFocus.current) {
      formHeading.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [receipt]);

  async function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/mock-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, provider, outcome }),
        signal: controller.signal,
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as MockCheckoutResult;
      if (!response.ok || !("receipt" in result)) {
        setError("error" in result ? result.error.message : "The simulation could not finish. Please try again.");
        return;
      }
      setReceipt(result.receipt);
    } catch {
      setError("We couldn’t reach the demo checkout. Check your connection and try again.");
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  function resetDemo() {
    shouldRestoreFocus.current = true;
    setReceipt(null);
    setError("");
  }

  return (
    <main id="main" className="checkout-shell">
      <nav className="checkout-nav" aria-label="Checkout navigation">
        <Brand />
        <Link className="checkout-back" href="/#pricing"><Arrow back /> Back to plans</Link>
      </nav>

      <div className="checkout-banner"><span className="checkout-status-dot" aria-hidden="true" /> CHECKOUT PLAYGROUND <span className="checkout-banner-detail">All of the flow. None of the charge.</span></div>

      <div className="checkout-grid">
        <aside className="checkout-story">
          <span className="checkout-eyebrow">A LITTLE PREVIEW</span>
          <h1>Good stories<br />start with<br /> <span>a little focus.</span></h1>
          <p>Pick a plan, choose a payment method, and take the checkout for a spin.</p>
          <div className="checkout-mini-scene" aria-hidden="true">
            <div className="checkout-mini-window"><div className="checkout-mini-toolbar"><i /><i /><i /><span>your next big idea.mov</span></div><div className="checkout-mini-content"><span className="checkout-mini-orbit" /><span className="checkout-mini-cursor"><svg viewBox="0 0 24 30" fill="none"><path d="m3 2 17 16-9 1-4 8L3 2Z" fill="var(--checkout-ink)" stroke="var(--checkout-paper)" strokeWidth="2.5" strokeLinejoin="round" /></svg></span><span className="checkout-mini-caption">Make the moment<br /><strong>the main character.</strong></span></div><div className="checkout-mini-timeline"><span /><span /><span /><b /></div></div>
            <span className="checkout-mini-tag">Less editing. More creating.</span>
          </div>
          <p className="checkout-simulation-note">This is a local simulation, not a live checkout or a Stripe/PayPal sandbox. No card details, sign-in, or payment-provider requests.</p>
        </aside>

        <section className="checkout-panel" aria-label="Checkout simulation">
          {receipt ? (
            <div className="checkout-result">
              <ReceiptIcon outcome={receipt.outcome} />
              <span className="checkout-eyebrow">{resultCopy[receipt.outcome].label}</span>
              <h2 ref={resultHeading} tabIndex={-1}>{resultCopy[receipt.outcome].title}</h2>
              <p>{resultCopy[receipt.outcome].detail}</p>
              <dl className="checkout-receipt">
                <div><dt>Demo plan</dt><dd>{receipt.planName}</dd></div>
                <div><dt>Provider label</dt><dd>{providerNames[receipt.provider]}</dd></div>
                <div><dt>Illustrative amount</dt><dd>{formatDemoAmount(receipt.illustrativeAmountCents)} USD</dd></div>
                <div className="checkout-receipt-total"><dt>Actually charged</dt><dd>$0 USD</dd></div>
                <div><dt>License issued</dt><dd>No</dd></div>
              </dl>
              <div className="checkout-reference"><span>Demo reference</span><code>{receipt.id}</code></div>
              <button className="checkout-primary" type="button" onClick={resetDemo}>Try another checkout <Arrow /></button>
              <button className="checkout-text-button" type="button" onClick={() => downloadReceipt(receipt)}>Download demo receipt</button>
              <p className="checkout-fineprint">Demo receipts cannot unlock the app or serve as proof of payment.</p>
            </div>
          ) : (
            <form onSubmit={simulate} aria-busy={submitting}>
              <div className="checkout-panel-heading"><span className="checkout-eyebrow">LET’S GIVE IT A GO</span><h2 ref={formHeading} tabIndex={-1}>Your demo checkout.</h2><p>Illustrative prices. No real purchase.</p></div>

              <fieldset className="checkout-fieldset" disabled={submitting}>
                <legend><span>01</span> Choose your plan</legend>
                <div className="checkout-plans">
                  {(Object.keys(DEMO_PLANS) as DemoPlan[]).map((id) => <label className={`checkout-plan${plan === id ? " is-selected" : ""}`} key={id}><input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} /><span className="checkout-plan-text"><strong>{DEMO_PLANS[id].name}</strong><small>{DEMO_PLANS[id].description}</small></span><span className="checkout-plan-price">{formatDemoAmount(DEMO_PLANS[id].amountCents)}<small>one-time · demo</small></span></label>)}
                </div>
              </fieldset>

              <fieldset className="checkout-fieldset" disabled={submitting}>
                <legend><span>02</span> Pick a payment method</legend>
                <div className="checkout-providers">
                  {(["stripe", "paypal"] as const).map((id) => <label className={`checkout-provider${provider === id ? " is-selected" : ""}`} key={id}><input type="radio" name="provider" value={id} checked={provider === id} onChange={() => setProvider(id)} /><span className={`checkout-provider-word checkout-provider-word--${id}`}>{providerNames[id]}</span><small>Simulated flow</small></label>)}
                </div>
              </fieldset>

              <fieldset className="checkout-fieldset checkout-outcome-fieldset" disabled={submitting}>
                <legend><span>03</span> Try an outcome</legend>
                <div className="checkout-outcomes">
                  {(["success", "declined", "cancelled"] as const).map((id) => <label className={`checkout-outcome${outcome === id ? " is-selected" : ""}`} key={id}><input type="radio" name="outcome" value={id} checked={outcome === id} onChange={() => setOutcome(id)} /><span>{id === "success" ? "Success" : id === "declined" ? "Decline" : "Cancel"}</span></label>)}
                </div>
              </fieldset>

              <div className="checkout-total"><span>Demo total <small>USD · illustrative one-time price</small></span><strong>{formatDemoAmount(DEMO_PLANS[plan].amountCents)}</strong></div>
              {error && <p className="checkout-error" role="alert">{error}</p>}
              <button className="checkout-primary" type="submit" disabled={submitting}>{submitting ? "Running simulation…" : `Simulate ${providerNames[provider]} ${outcome === "cancelled" ? "cancellation" : "payment"}`}<Arrow /></button>
              <p className="checkout-fineprint">You will be charged <strong>$0</strong>. No account or license is created.</p>
            </form>
          )}
        </section>
      </div>

      <footer className="checkout-footer"><span>Made for the moments worth showing.</span><Link href="/">Explore Focus Recorder <Arrow /></Link></footer>
    </main>
  );
}
