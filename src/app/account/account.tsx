"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { ArrowLeft, ArrowUpRight, Check, UserRound } from "lucide-react";
import { Brand } from "@/components/chrome";
import { useAccount } from "@/lib/use-account";
import { getAccountSession } from "@/lib/account-browser";
import { parseAccountEntitlement, type AccountEntitlement } from "@/lib/account-contract";
import { accountEmailActionSettings } from "@/lib/account-password";
import { checkoutRequest } from "../checkout/checkout-client";

export default function Account({ next, reset }: { next: string; reset: boolean }) {
  const [retry, setRetry] = useState(0);
  const account = useAccount(retry);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(reset ? "forgot" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<AccountEntitlement | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const operation = useRef(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setResetEmailSent(false); }, [account.session?.user.id]);
  useEffect(() => {
    const controller = new AbortController();
    setPlan(null); setPlanError(false); setPlanLoading(false);
    if (!account.session?.user.emailVerified) return () => controller.abort();
    const session = account.session;
    setPlanLoading(true);
    checkoutRequest("/api/account/entitlement", undefined, controller.signal, session.access_token)
      .then(value => { if (!controller.signal.aborted) setPlan(parseAccountEntitlement(value, session.user.id)); })
      .catch(() => { if (!controller.signal.aborted) setPlanError(true); })
      .finally(() => { if (!controller.signal.aborted) setPlanLoading(false); });
    return () => controller.abort();
  }, [account.session?.access_token, account.session?.user.id, account.session?.user.emailVerified, retry]);

  function changeMode(value: typeof mode) { setMode(value); setPassword(""); setShowPassword(false); setError(""); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = account.client;
    if (!client || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    const enteredPassword = password;
    setPassword(""); setShowPassword(false);
    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(client.auth, email.trim(), accountEmailActionSettings(window.location.origin));
        if (mounted.current) setMessage("If this email has an account, check your inbox. Firebase's secure email link lets you choose a new password.");
      } else if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(client.auth, email.trim(), enteredPassword);
        await sendEmailVerification(result.user, accountEmailActionSettings(window.location.origin));
        if (mounted.current) setMessage("Check your inbox to verify your email, then refresh your account here. Creating an account does not start a paid subscription.");
      } else {
        const result = await signInWithEmailAndPassword(client.auth, email.trim(), enteredPassword);
        if (mounted.current && result.user.emailVerified && next !== "/account") window.location.assign(next);
      }
    } catch {
      if (mounted.current) setError(mode === "signin" ? "Sign-in failed. Check your email and password, or request a password reset."
        : mode === "signup" && client.auth.currentUser ? "Your account was created, but the verification email could not be sent. Use Resend verification below."
        : "We couldn’t complete this request. Check your connection and try again in a moment.");
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function refreshAccount() {
    if (!account.client || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await getAccountSession(account.client, true);
      if (mounted.current) setRetry(value => value + 1);
    } catch { if (mounted.current) setError("We couldn’t refresh your account. Check your connection or sign in again."); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function resendVerification() {
    const user = account.client?.auth.currentUser;
    if (!user || user.emailVerified || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await sendEmailVerification(user, accountEmailActionSettings(window.location.origin));
      if (mounted.current) setMessage("Verification email sent. Check your inbox and spam folder, then refresh your account.");
    } catch { if (mounted.current) setError("We couldn’t send another email yet. Wait a moment and try again."); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function signOut() {
    if (!account.client || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await firebaseSignOut(account.client.auth);
      if (mounted.current) { setPlan(null); setPassword(""); setShowPassword(false); }
    } catch { if (mounted.current) setError("Sign-out could not complete. Please try again."); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function resetSignedInPassword() {
    const client = account.client;
    const user = client?.auth.currentUser;
    if (!client || !user?.email || operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try {
      // Explicit button click only. A mode=reset URL never sends mail by itself.
      await sendPasswordResetEmail(client.auth, user.email, accountEmailActionSettings(window.location.origin));
      if (mounted.current && client.auth.currentUser === user) {
        setResetEmailSent(true);
        setMessage("Check your inbox for a secure password reset link. Your password is changed only after you complete Firebase’s email link.");
      }
    } catch {
      if (mounted.current && client.auth.currentUser === user) setError("We couldn’t send a reset link yet. Wait a moment and try again.");
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  }

  const currentPlan = plan?.accountId === account.session?.user.id ? plan : null;
  const checkingPlan = planLoading || (!currentPlan && !planError);

  return <main id="main" className="checkout-shell checkout-live account-shell">
    <nav className="checkout-nav" aria-label="Account navigation"><Brand /><Link className="checkout-back" href="/"><ArrowLeft size={18} aria-hidden="true" />Back to home</Link></nav>
    <div className="account-layout">
      <div className="account-intro"><span className="checkout-eyebrow">FOCUS RECORDER ACCOUNT</span><h1>One login.<br /><span>Your Pro.</span></h1><p>Sign into the website and the app with the same account. No Device ID to copy. No computer to lock it to.</p><p className="checkout-help">Free recording is still available without an account.</p></div>
      <section className="checkout-panel account-panel" aria-label="Your account">
        {account.loading ? <p role="status">Loading secure sign-in…</p> : !account.client ? <div className="checkout-info" role="status"><h2>Sign-in is not available yet.</h2><p>You can keep recording with Free while account setup is completed. No subscription can be started here.</p><button className="checkout-text-button" type="button" onClick={() => setRetry(value => value + 1)}>Check again</button></div>
          : account.session ? <>
            <UserRound size={28} aria-hidden="true" /><h2>Your account.</h2><p className="account-email">{account.session.user.email}</p>
            {reset && <p className="checkout-info" role="status">You’re already signed in. Use “Send password reset email” below to reset this account’s password, or sign out to request a link for another email.</p>}
            {!account.session.user.emailVerified ? <div className="checkout-info" role="status"><strong>Verify your email before using Pro.</strong><p>Open the verification link from Firebase, then refresh your account here. Free recording remains available.</p><div className="account-actions"><button className="checkout-text-button" type="button" disabled={busy} onClick={resendVerification}>Resend verification</button><button className="checkout-text-button" type="button" disabled={busy} onClick={refreshAccount}>I verified my email — refresh</button></div></div> : <>
              <div className="checkout-info" role="status"><strong>{checkingPlan ? "Checking your plan…" : planError ? "Plan status unavailable" : currentPlan?.status === "active" ? "Focus Pro is active" : currentPlan?.status === "pending" ? "Payment confirmation pending" : currentPlan?.status === "cancelled" ? "Subscription cancelled" : currentPlan?.status === "unavailable" ? "Subscription needs attention" : "Focus Free"}</strong>
                <p>{currentPlan?.status === "active" ? "Open the latest Focus Recorder app and sign in with this account. Pro unlocks automatically after verification." : currentPlan?.status === "pending" ? "If you already approved payment, check again shortly. Please don’t start another subscription." : planError || currentPlan?.status === "unavailable" ? "Check your connection and your subscription in PayPal before attempting another purchase." : "Free includes up to 1080p at 24 fps with a bouncing watermark. Pro is $9 USD per month."}</p>
                <button className="checkout-text-button" type="button" disabled={checkingPlan || busy} onClick={refreshAccount}>Refresh plan</button>
              </div>
              {currentPlan?.status === "active" ? <Link href="/download" className="checkout-primary"><Check size={18} aria-hidden="true" />Open downloads</Link>
                : !checkingPlan && !planError && currentPlan?.status !== "unavailable" && <Link href={next !== "/account" ? next : "/checkout"} className="checkout-primary">{currentPlan?.status === "pending" ? "Continue your checkout" : "Get Focus Pro"}<ArrowUpRight size={18} aria-hidden="true" /></Link>}
            </>}
            <p className="checkout-help">Cancel automatic renewal in your PayPal account. Signing out does not cancel a subscription. For an older device-bound purchase, keep using its existing activation; ownership isn’t reassigned automatically.</p>
            <div className="account-actions"><button className="checkout-text-button" type="button" disabled={busy || resetEmailSent} onClick={resetSignedInPassword}>{resetEmailSent ? "Password reset email sent" : "Send password reset email"}</button><button className="checkout-text-button" type="button" disabled={busy} onClick={signOut}>Sign out of this browser</button></div>
          </> : <>
            <h2>{mode === "signup" ? "Create your account." : mode === "forgot" ? "Reset your password." : "Welcome back."}</h2>
            <p className="checkout-help">{mode === "forgot" ? "Request an email link. Password changes are completed on Firebase's secure page, not from a URL flag or your current login." : "Use the email you want to use in Focus Recorder."}</p>
            <form onSubmit={submit} aria-busy={busy}>
              <label className="checkout-input-label" htmlFor="account-email">Email</label><input className="checkout-device-input" id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
              {mode !== "forgot" && <><label className="checkout-input-label" htmlFor="account-password">Password</label><input className="checkout-device-input" id="account-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} maxLength={1024} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} /><button className="checkout-text-button" type="button" disabled={busy} aria-controls="account-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide password" : "Show password"}</button>{mode === "signup" && <p className="checkout-help">Use at least 8 characters.</p>}</>}
              <button className="checkout-primary account-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowUpRight size={18} aria-hidden="true" /></button>
            </form>
            <div className="account-actions"><button className="checkout-text-button" type="button" disabled={busy} onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New here? Create an account" : "Back to sign in"}</button>{mode === "signin" && <button className="checkout-text-button" type="button" disabled={busy} onClick={() => changeMode("forgot")}>Forgot password?</button>}</div>
            <p className="checkout-help">Login is handled by Firebase Authentication. Your recordings stay on your computer. <Link href="/privacy">Privacy details</Link>.</p>
          </>}
        {error && <p className="checkout-error" role="alert">{error}</p>}{message && <p className="checkout-info" role="status">{message}</p>}
      </section>
    </div>
    <footer className="checkout-footer"><Link href="/privacy">Privacy & subscription data</Link><Link href="/guide">Account and activation guide</Link></footer>
  </main>;
}
