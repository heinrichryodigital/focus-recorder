"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import CheckoutFrame from "./checkout-frame";
import { checkoutRequest, isDeviceId, parseCheckoutConfig, parseCheckoutRedirect, type CheckoutConfig } from "./checkout-client";

export default function Checkout({ cancelled }: { cancelled: boolean }) {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  const [machineId, setMachineId] = useState("");
  const [platform, setPlatform] = useState<"macos" | "windows">("macos");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deviceError, setDeviceError] = useState("");
  const deviceInput = useRef<HTMLInputElement>(null);
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

  useEffect(() => () => submission.current?.abort(), []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.current || !config?.enabled || checking) return;
    setError("");
    if (!isDeviceId(machineId.trim())) {
      setDeviceError("Paste the complete 64-character Device ID from Focus Recorder on the computer you want to activate.");
      deviceInput.current?.focus();
      return;
    }
    setDeviceError("");
    if (!termsAccepted) { setError("Read and accept the monthly subscription terms to continue."); return; }
    const controller = new AbortController();
    submission.current = controller;
    setSubmitting(true);
    try {
      const value = await checkoutRequest("/api/paypal/checkout", { machineId: machineId.trim(), platform, termsAccepted: true }, controller.signal);
      const approvalUrl = parseCheckoutRedirect(value, config.environment);
      if (!controller.signal.aborted) window.location.assign(approvalUrl);
    } catch {
      if (!controller.signal.aborted) setError("We couldn’t open PayPal checkout. Check your connection and try again. If you already approved a subscription, check its status in PayPal before starting another.");
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
      submission.current = null;
    }
  }

  return <CheckoutFrame>
    <div className="checkout-panel-heading"><span className="checkout-eyebrow">MONTHLY SUBSCRIPTION</span><h2>Make it Pro.</h2><p>Focus Pro for one Mac or Windows computer.</p></div>
    <div className="checkout-total checkout-subscription-total"><span>Focus Pro <small>USD · automatically renews monthly</small></span><strong>$9<span> / month</span></strong></div>
    {cancelled && <p className="checkout-info" role="status">You returned from PayPal without completing this checkout here. If you approved a subscription, check PayPal before trying again.</p>}
    {checking ? <p className="checkout-availability" role="status">Checking checkout availability…</p>
      : !config?.enabled ? <div className="checkout-info" role="status"><strong>Subscriptions are not available right now.</strong><p>You can keep using Free. No payment can be started from this page.</p><button className="checkout-text-button" type="button" onClick={() => setRetry(value => value + 1)}>Check availability again</button></div>
      : config.environment === "sandbox" ? <p className="checkout-info" role="status"><strong>PayPal sandbox test.</strong> This checkout uses test accounts and does not charge real money. Test activation is not a production license.</p> : null}
    <form onSubmit={subscribe} aria-busy={submitting}>
      <fieldset className="checkout-fieldset" disabled={submitting || checking || !config?.enabled}>
        <legend>Your computer</legend>
        <div className="checkout-platforms">
          {(["macos", "windows"] as const).map(value => <label className={`checkout-plan${platform === value ? " is-selected" : ""}`} key={value}><input type="radio" name="platform" value={value} checked={platform === value} onChange={() => setPlatform(value)} /><span>{value === "macos" ? "macOS" : "Windows"}</span></label>)}
        </div>
        <label className="checkout-input-label" htmlFor="device-id">Device ID <span>(required)</span></label>
        <input className="checkout-device-input" ref={deviceInput} id="device-id" name="machineId" type="text" value={machineId} maxLength={128} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby={`device-help${deviceError ? " device-error" : ""}`} aria-invalid={Boolean(deviceError)} onChange={event => { setMachineId(event.target.value); if (isDeviceId(event.target.value.trim())) setDeviceError(""); }} />
        <p className="checkout-help" id="device-help">On Mac, open the license activation window and choose “Copy ID”. On Windows, open “Activate Pro” and copy the “Device ID” field. Use the computer you want to activate; device swaps are not supported.</p>
        {deviceError && <p className="checkout-error" id="device-error" role="alert">{deviceError}</p>}
      </fieldset>
      <div className="checkout-terms" id="subscription-terms"><h3>Before you subscribe</h3><p>$9 USD is charged when you subscribe, then automatically every month until you cancel in PayPal. There is no free trial.</p><p>Cancellation keeps Pro available through the current paid period. Refunds or payment disputes can revoke access earlier.</p><p>Connect the app to the internet at least every three days to refresh your activation while your subscription is paid. Otherwise, the app returns to Free until it can verify access.</p></div>
      <label className="checkout-consent"><input type="checkbox" checked={termsAccepted} disabled={submitting || checking || !config?.enabled} onChange={event => setTermsAccepted(event.target.checked)} /><span>I agree to the $9 USD monthly automatic renewal and the subscription terms above. <Link href="/privacy">Privacy details</Link>.</span></label>
      {error && <p className="checkout-error" role="alert">{error}</p>}
      <button className="checkout-primary" type="submit" disabled={submitting || checking || !config?.enabled || !termsAccepted}>{submitting ? "Opening PayPal…" : config?.environment === "sandbox" ? "Continue to PayPal sandbox" : "Subscribe with PayPal"}<ArrowUpRight size={18} aria-hidden="true" /></button>
      <p className="checkout-fineprint">You review and approve the subscription on PayPal. We never ask for your card details or PayPal password.</p>
    </form>
  </CheckoutFrame>;
}
