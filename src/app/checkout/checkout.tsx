"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, UserRound } from "lucide-react";
import { useAccount } from "@/lib/use-account";
import CheckoutFrame from "./checkout-frame";
import { checkoutRequest, parseCheckoutConfig, parseCheckoutRedirect, type CheckoutConfig } from "./checkout-client";

export default function Checkout({ cancelled }: { cancelled: boolean }) {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  const account = useAccount(retry);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submission = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setChecking(true);
    setConfig(null);
    checkoutRequest("/api/paypal/config", undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setConfig(parseCheckoutConfig(value)); })
      .catch(() => { if (!controller.signal.aborted) setConfig(null); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    setTermsAccepted(false);
    setError("");
    setSubmitting(false);
    return () => { submission.current?.abort(); submission.current = null; };
  }, [account.session?.user.id]);

  const loading = checking || account.loading;
  const available = config?.enabled && account.client;
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.current || !available || loading || !account.session || !config) return;
    setError("");
    if (!termsAccepted) { setError("Read and accept the monthly subscription terms to continue."); return; }
    const controller = new AbortController();
    submission.current = controller;
    setSubmitting(true);
    try {
      const { data, error: sessionError } = await account.client!.auth.getSession();
      if (sessionError || !data.session || data.session.user.id !== account.session.user.id) throw new Error();
      if (controller.signal.aborted) return;
      const value = await checkoutRequest("/api/paypal/checkout", { acceptedTerms: true }, controller.signal, data.session.access_token);
      const approvalUrl = parseCheckoutRedirect(value, config.environment);
      if (!controller.signal.aborted) window.location.assign(approvalUrl);
    } catch {
      if (!controller.signal.aborted) setError("We couldn’t open PayPal checkout. Sign in again and retry. If you already approved a subscription, check your account and PayPal before starting another.");
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
      if (submission.current === controller) submission.current = null;
    }
  }

  return <CheckoutFrame>
    <div className="checkout-panel-heading"><span className="checkout-eyebrow">MONTHLY SUBSCRIPTION</span><h2>Make it Pro.</h2><p>Your subscription follows your Focus Recorder account.</p></div>
    <div className="checkout-total checkout-subscription-total"><span>Focus Pro <small>USD · automatically renews monthly</small></span><strong>$9<span> / month</span></strong></div>
    {cancelled && <p className="checkout-info" role="status">You returned from PayPal without completing this checkout here. If you approved a subscription, check your account and PayPal before trying again.</p>}
    {loading ? <p className="checkout-availability" role="status">Checking checkout availability…</p>
      : !available ? <div className="checkout-info" role="status"><strong>Subscriptions are not available right now.</strong><p>You can keep using Free. No payment can be started from this page.</p><button className="checkout-text-button" type="button" onClick={() => setRetry(value => value + 1)}>Check availability again</button></div>
      : config?.environment === "sandbox" ? <p className="checkout-info" role="status"><strong>PayPal sandbox test.</strong> This checkout uses test accounts and does not charge real money. Test activation is not a production license.</p> : null}
    {!loading && available && !account.session ? <div className="checkout-account">
      <UserRound size={24} aria-hidden="true" /><h3>Sign in to continue.</h3>
      <p>Pro is linked to your login, not your computer. Use the same account in the Mac or Windows app.</p>
      <Link className="checkout-primary" href="/account?next=%2Fcheckout">Sign in or create an account<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div> : <form onSubmit={subscribe} aria-busy={submitting}>
      {account.session && <div className="checkout-account"><span className="checkout-eyebrow">YOUR ACCOUNT</span><p className="account-email">{account.session.user.email}</p><Link href="/account">Manage account and plan</Link><p className="checkout-help">No Device ID or activation code required. Sign into the app with this account after payment is verified.</p></div>}
      <div className="checkout-terms" id="subscription-terms"><h3>Before you subscribe</h3><p>$9 USD is charged when you subscribe, then automatically every month until you cancel in PayPal. There is no free trial.</p><p>Cancellation keeps Pro available through the current paid period. Refunds or payment disputes can revoke access earlier.</p><p>Sign into the app and connect to the internet at least every three days to refresh Pro while your subscription is paid. Otherwise, the app returns to Free until it can verify access.</p></div>
      <label className="checkout-consent"><input type="checkbox" checked={termsAccepted} disabled={submitting || loading || !available || !account.session} onChange={event => setTermsAccepted(event.target.checked)} /><span>I agree to the $9 USD monthly automatic renewal and the subscription terms above. <Link href="/privacy">Privacy details</Link>.</span></label>
      {error && <p className="checkout-error" role="alert">{error}</p>}
      <button className="checkout-primary" type="submit" disabled={submitting || loading || !available || !account.session || !termsAccepted}>{submitting ? "Opening PayPal…" : config?.environment === "sandbox" ? "Continue to PayPal sandbox" : "Subscribe with PayPal"}<ArrowUpRight size={18} aria-hidden="true" /></button>
      <p className="checkout-fineprint">You review and approve the subscription on PayPal. We never ask for your card details or PayPal password.</p>
    </form>}
  </CheckoutFrame>;
}
