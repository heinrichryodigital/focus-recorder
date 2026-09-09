/** Firebase's hosted action handler verifies one-time codes and applies password/email changes.
 * A query parameter or a signed-in session never authorizes a password reset on this website. */
export function accountEmailActionSettings(origin: string): { url: string; handleCodeInApp: false } {
  if (origin !== "https://focus-recorder.netlify.app" && !/^http:\/\/localhost(?::[0-9]{1,5})?$/.test(origin)) {
    throw new Error("This website is not configured for account email actions.");
  }
  return { url: `${origin}/account`, handleCodeInApp: false };
}
