"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import CheckoutFrame from "../checkout-frame";
import { checkoutRequest, isCheckoutId, parseCheckoutStatus, type CheckoutStatus } from "../checkout-client";

export default function CheckoutReturn({ checkoutId }: { checkoutId: string }) {
  const [result, setResult] = useState<CheckoutStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!isCheckoutId(checkoutId)) {
      setMessage("This checkout link is incomplete. Return in the same browser used for PayPal checkout. If you already paid, check your subscription in PayPal before starting another.");
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    setChecking(true);
    setMessage("");
    setResult(null);
    async function poll() {
      try {
        for (let attempt = 0; attempt < 10; attempt++) {
          const status = parseCheckoutStatus(await checkoutRequest("/api/paypal/status", { checkoutId }, controller.signal));
          if (controller.signal.aborted) return;
          setResult(status);
          if (status.status !== "pending") return;
          if (attempt < 9) await new Promise<void>(resolve => {
            const finish = () => { if (timer) clearTimeout(timer); controller.signal.removeEventListener("abort", finish); resolve(); };
            timer = setTimeout(finish, 8000);
            controller.signal.addEventListener("abort", finish, { once: true });
          });
          if (controller.signal.aborted) return;
        }
        setMessage("PayPal confirmation is taking a little longer. You can check again in a moment. Please don’t start another subscription while this one is pending.");
      } catch {
        if (!controller.signal.aborted) setMessage("We couldn’t check your payment. Keep this page open in the browser you used for checkout, check your connection, and try again. Don’t subscribe again if PayPal already shows a payment.");
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }
    void poll();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [checkoutId, retry]);

  useEffect(() => { if (result?.status === "active") heading.current?.focus(); }, [result?.status]);

  async function copyToken() {
    if (result?.status !== "active") return;
    try { await navigator.clipboard.writeText(result.token); setCopyMessage("Activation token copied. Paste it into Focus Recorder."); }
    catch { setCopyMessage("Clipboard access is unavailable. Select and copy the token below, or download it."); }
  }

  function downloadToken() {
    if (result?.status !== "active") return;
    const url = URL.createObjectURL(new Blob([result.token], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Focus-Recorder-activation.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const active = result?.status === "active";
  return <CheckoutFrame returning>
    <div className="checkout-panel-heading"><span className="checkout-eyebrow">{active ? "PAYMENT VERIFIED" : "PAYMENT CONFIRMATION"}</span>
      <h2 ref={heading} tabIndex={-1}>{active ? "Your Pro is ready." : result?.status === "cancelled" ? "Subscription cancelled." : "Let’s confirm your Pro."}</h2>
    </div>
    {active ? <div className="checkout-activation">
      <span className="checkout-result-icon" aria-hidden="true"><Check size={30} /></span>
      <p>Copy this activation token into the Mac license activation window. On Windows, open “Activate Pro”, paste it into “Pro license”, then choose “Activate Pro on this device”. Use the device you selected at checkout.</p>
      <label className="checkout-input-label" htmlFor="activation-token">Your activation token</label>
      <textarea id="activation-token" className="checkout-token" readOnly value={result.token} spellCheck={false} rows={4} autoComplete="off" />
      <div className="checkout-token-actions"><button className="checkout-primary" type="button" onClick={copyToken}><Copy size={16} aria-hidden="true" />Copy token</button><button className="checkout-secondary" type="button" onClick={downloadToken}><Download size={16} aria-hidden="true" />Download token</button></div>
      <p className="checkout-help" role="status">{copyMessage || "Keep your activation token private. It is shown only in this browser session."}</p>
      <div className="checkout-info"><strong>Keep the app online for renewal.</strong><p>This activation is valid until {new Date(result.expiresAt * 1000).toLocaleString()}. The app refreshes it while your subscription remains paid; connect at least every three days. Your recordings stay local.</p></div>
      <p className="checkout-help">One subscription activates one device. Device swaps are not supported. Cancel monthly renewal in your PayPal account; the current paid period remains available unless a refund or dispute revokes access.</p>
    </div> : <div className="checkout-confirmation" aria-live="polite">
      {checking && <p role="status">Checking your payment with the server… This can take about a minute. Keep this page open.</p>}
      {result?.status === "pending" && <p>PayPal approval is being confirmed. Pro becomes available after the payment is verified.</p>}
      {result?.status === "cancelled" && <p>This subscription is cancelled. Check your PayPal account for its payment history and paid period.</p>}
      {result?.status === "unavailable" && <p>Activation is unavailable for this checkout. Use the browser where you started it and check your PayPal subscription before making another purchase.</p>}
      {message && <p className="checkout-info">{message}</p>}
      {!checking && isCheckoutId(checkoutId) && <button className="checkout-primary" type="button" onClick={() => setRetry(value => value + 1)}>Check payment again</button>}
      <p className="checkout-help">Returning from PayPal does not itself confirm a payment. <Link href="/download">You can continue using Free</Link> while we check.</p>
    </div>}
  </CheckoutFrame>;
}
