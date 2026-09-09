"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Check, UserRound } from "lucide-react";
import { Brand } from "@/components/chrome";
import { useAccount } from "@/lib/use-account";
import { parseAccountEntitlement, type AccountEntitlement } from "@/lib/account-contract";
import { updateRecoveredPassword } from "@/lib/account-password";
import { checkoutRequest } from "../checkout/checkout-client";

export default function Account({ next, reset }: { next: string; reset: boolean }) {
  const [retry, setRetry] = useState(0);
  const account = useAccount(retry);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<AccountEntitlement | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const operation = useRef(false);
  const mounted = useRef(true);
  const passwordUpdate = Boolean(account.recovery && account.recovery.accountId === account.session?.user.id) && !passwordUpdated;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setPlan(null); setPlanError(false); setPlanLoading(false);
    if (!account.session) return () => controller.abort();
    const session = account.session;
    setPlanLoading(true);
    checkoutRequest("/api/account/entitlement", undefined, controller.signal, session.access_token)
      .then(value => { if (!controller.signal.aborted) setPlan(parseAccountEntitlement(value, session.user.id)); })
      .catch(() => { if (!controller.signal.aborted) setPlanError(true); })
      .finally(() => { if (!controller.signal.aborted) setPlanLoading(false); });
    return () => controller.abort();
  }, [account.session?.access_token, account.session?.user.id, retry]);

  function changeMode(value: typeof mode) { setMode(value); setPassword(""); setError(""); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account.client || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    const enteredPassword = password;
    setPassword("");
    try {
      if (passwordUpdate) {
        const recovery = account.recovery;
        const { data, error } = await account.client.auth.getSession();
        if (error || !recovery || data.session?.user.id !== recovery.accountId) throw new Error();
        const configuration = await checkoutRequest("/api/account/config");
        await updateRecoveredPassword(configuration, recovery, enteredPassword);
        if (mounted.current) { setPasswordUpdated(true); setMessage("Your password has been updated. Use it when you sign into Focus Recorder."); }
      } else if (mode === "forgot") {
        const { error } = await account.client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/account?mode=reset`,
        });
        if (error) throw new Error();
        if (mounted.current) setMessage("If this email has an account, check your inbox for a password reset link. Open it in this browser.");
      } else if (mode === "signup") {
        const { data, error } = await account.client.auth.signUp({ email: email.trim(), password: enteredPassword,
          options: { emailRedirectTo: `${window.location.origin}/account?next=${encodeURIComponent(next)}` } });
        if (error) throw new Error();
        if (mounted.current) {
          if (data.session && next !== "/account") window.location.assign(next);
          else setMessage("Check your inbox to confirm your email, then sign in. Creating an account does not start a paid subscription.");
        }
      } else {
        const { error } = await account.client.auth.signInWithPassword({ email: email.trim(), password: enteredPassword });
        if (error) throw new Error();
        if (mounted.current && next !== "/account") window.location.assign(next);
      }
    } catch {
      if (mounted.current) setError(passwordUpdate ? "Your password could not be updated. Request a new reset link and try again."
        : mode === "signin" ? "Sign-in failed. Check your email and password, confirm your email if needed, and try again."
        : "We couldn’t complete this request. Check your connection and try again in a moment.");
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function signOut() {
    if (!account.client || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const { error } = await account.client.auth.signOut({ scope: "local" });
      if (error) throw new Error();
      if (mounted.current) { setPlan(null); setPassword(""); setPasswordUpdated(false); }
    } catch { if (mounted.current) setError("Sign-out could not complete. Please try again."); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }

  return <main id="main" className="checkout-shell checkout-live account-shell">
    <nav className="checkout-nav" aria-label="Account navigation"><Brand /><Link className="checkout-back" href="/"><ArrowLeft size={18} aria-hidden="true" />Back to home</Link></nav>
    <div className="account-layout">
      <div className="account-intro"><span className="checkout-eyebrow">FOCUS RECORDER ACCOUNT</span><h1>One login.<br /><span>Your Pro.</span></h1><p>Sign into the website and the app with the same account. No Device ID to copy. No computer to lock it to.</p><p className="checkout-help">Free recording is still available without an account.</p></div>
      <section className="checkout-panel account-panel" aria-label="Your account">
        {!account.loading && (account.callbackFailed || (reset && !passwordUpdate && !passwordUpdated)) && <p className="checkout-error" role="alert">This recovery link could not be verified. No password has been changed. Request a new reset link and open it in the same browser.</p>}
        {account.loading ? <p role="status">Loading secure sign-in…</p> : !account.client ? <div className="checkout-info" role="status"><h2>Sign-in is not available yet.</h2><p>You can keep recording with Free while account setup is completed. No subscription can be started here.</p><button className="checkout-text-button" type="button" onClick={() => setRetry(value => value + 1)}>Check again</button></div>
          : account.session && !passwordUpdate ? <>
            <UserRound size={28} aria-hidden="true" /><h2>Your account.</h2><p className="account-email">{account.session.user.email}</p>
            <div className="checkout-info" role="status"><strong>{planLoading ? "Checking your plan…" : planError ? "Plan status unavailable" : plan?.status === "active" ? "Focus Pro is active" : plan?.status === "pending" ? "Payment confirmation pending" : plan?.status === "cancelled" ? "Subscription cancelled" : plan?.status === "unavailable" ? "Subscription needs attention" : "Focus Free"}</strong>
              <p>{plan?.status === "active" ? "Open the latest Focus Recorder app and sign in with this account. Pro unlocks automatically after verification." : plan?.status === "pending" ? "If you already approved payment, check again shortly. Please don’t start another subscription." : planError || plan?.status === "unavailable" ? "Check your connection and your subscription in PayPal before attempting another purchase." : "Free includes up to 1080p at 24 fps with a bouncing watermark. Pro is $9 USD per month."}</p>
              <button className="checkout-text-button" type="button" disabled={planLoading || busy} onClick={() => setRetry(value => value + 1)}>Refresh plan</button>
            </div>
            {plan?.status === "active" ? <Link href="/download" className="checkout-primary"><Check size={18} aria-hidden="true" />Open downloads</Link>
              : !planLoading && !planError && plan?.status !== "unavailable" && <Link href="/checkout" className="checkout-primary">{plan?.status === "pending" ? "Continue your checkout" : "Get Focus Pro"}<ArrowUpRight size={18} aria-hidden="true" /></Link>}
            <p className="checkout-help">Cancel automatic renewal in your PayPal account. Signing out does not cancel a subscription. For an older device-bound purchase, keep using its existing activation; ownership isn’t reassigned automatically.</p>
            <button className="checkout-text-button" type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out of this browser"}</button>
          </> : <>
            <h2>{passwordUpdate ? "Choose a new password." : mode === "signup" ? "Create your account." : mode === "forgot" ? "Reset your password." : "Welcome back."}</h2>
            <p className="checkout-help">{passwordUpdate ? "Your new password will work on the website and in the app." : "Use the email you want to use in Focus Recorder."}</p>
            <form onSubmit={submit} aria-busy={busy}>
              {!passwordUpdate && <><label className="checkout-input-label" htmlFor="account-email">Email</label><input className="checkout-device-input" id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /></>}
              {(mode !== "forgot" || passwordUpdate) && <><label className="checkout-input-label" htmlFor="account-password">{passwordUpdate ? "New password" : "Password"}</label><input className="checkout-device-input" id="account-password" type="password" autoComplete={mode === "signup" || passwordUpdate ? "new-password" : "current-password"} required minLength={mode === "signup" || passwordUpdate ? 8 : 1} maxLength={1024} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />{mode === "signup" && <p className="checkout-help">Use at least 8 characters.</p>}</>}
              <button className="checkout-primary account-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : passwordUpdate ? "Save new password" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowUpRight size={18} aria-hidden="true" /></button>
            </form>
            {!passwordUpdate && <div className="account-actions"><button className="checkout-text-button" type="button" disabled={busy} onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New here? Create an account" : "Back to sign in"}</button>{mode === "signin" && <button className="checkout-text-button" type="button" disabled={busy} onClick={() => changeMode("forgot")}>Forgot password?</button>}</div>}
            <p className="checkout-help">Login is handled by Supabase. Your recordings stay on your computer. <Link href="/privacy">Privacy details</Link>.</p>
          </>}
        {error && <p className="checkout-error" role="alert">{error}</p>}{message && <p className="checkout-info" role="status">{message}</p>}
      </section>
    </div>
    <footer className="checkout-footer"><Link href="/privacy">Privacy & subscription data</Link><Link href="/guide">Account and activation guide</Link></footer>
  </main>;
}
