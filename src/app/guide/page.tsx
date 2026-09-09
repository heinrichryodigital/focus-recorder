import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Check, Monitor, MousePointer2, SlidersHorizontal } from 'lucide-react';
import { Header, Footer } from '@/components/chrome';
import { ApplePlatformIcon, WindowsPlatformIcon } from '@/components/platform-icons';

export const metadata: Metadata = {
  title: 'Recording guide & settings',
  description: 'Your step-by-step Focus Recorder guide for Mac and Windows: first recording, zoom strength, smooth cursor, appearance, saved defaults, and account-based Pro.',
};

const chapters = [
  ['before-you-start', 'Before you start'], ['mac', 'Record on Mac'],
  ['windows', 'Record on Windows'], ['settings', 'Make it yours'],
  ['motion', 'Zoom & cursor motion'], ['pro', 'Your account & Pro'],
  ['help', 'A little help'], ['updates', 'Update the app'],
] as const;

export default function Guide() {
  return <><Header /><main id="main" className="guide-page page-width">
    <header className="guide-hero">
      <span className="eyebrow"><span className="orange-dot" /> THE FOCUS RECORDER FIELD GUIDE</span>
      <h1>Your first take.<br /><span>A little more focused.</span></h1>
      <p>Pick your screen, find your settings, and make a short test recording. Start here on Mac or Windows, then keep this guide handy.</p>
      <div className="guide-platform-links">
        <a href="#mac"><ApplePlatformIcon size={20} /> Start on Mac <ArrowDown size={16} /></a>
        <a href="#windows"><WindowsPlatformIcon size={20} /> Start on Windows <ArrowDown size={16} /></a>
      </div>
    </header>
    <div className="guide-layout">
      <aside className="guide-sidebar">
        <nav aria-label="Guide chapters">
          <p className="eyebrow">IN THIS GUIDE</p>
          <ol>{chapters.map(([id, label], index) => <li key={id}><a href={'#' + id}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}</a></li>)}</ol>
        </nav>
        <Link href="/download" className="guide-download">Get the desktop app <ArrowUpRight size={16} /></Link>
      </aside>
      <div className="guide-article">
        <section id="before-you-start" aria-labelledby="before-heading" className="guide-chapter">
          <span className="eyebrow">01 / A QUICK CHECK</span>
          <h2 id="before-heading">Free. And clear from the start.</h2>
          <p>No account or payment is needed to record with Free. Install the desktop preview from <Link href="/download">Downloads</Link> and check the platform requirements and unsigned-app notes there.</p>
          <div className="guide-callout"><strong>Free exports: up to 1080p at 24 fps.</strong><p>A Focus Recorder watermark bounces throughout every exported video. It is added at export, so a clean preview does not mean a watermark-free file. Auto zoom and cursor smoothing are included in Free.</p></div>
          <p>Pro is <strong>$9 USD per month</strong>, removes the watermark, and unlocks supported paid quality settings. Try Free on your own computer before subscribing.</p>
          <ul className="guide-checklist">
            <li><Check size={17} aria-hidden="true" /><span>Close private windows, hide notifications, and record only content you have permission to share.</span></li>
            <li><Check size={17} aria-hidden="true" /><span>Choose a local save location with enough free space. Recordings stay on your computer.</span></li>
            <li><Check size={17} aria-hidden="true" /><span>Make a 15-second test and play the exported file before a longer take.</span></li>
          </ul>
        </section>

        <section id="mac" aria-labelledby="mac-heading" className="guide-chapter">
          <span className="eyebrow">02 / MAC</span>
          <h2 id="mac-heading"><ApplePlatformIcon size={29} /> Your first Mac recording.</h2>
          <ol className="guide-steps">
            <li><h3>Allow screen recording.</h3><p>Open Focus Recorder and follow its permission prompt. If access was denied, open System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording (called Screen Recording on some macOS versions). Enable Focus Recorder, then quit and reopen the app.</p></li>
            <li><h3>Choose your display and quality.</h3><p>Select the screen you want to show. Start with <strong>1080p, 24 fps</strong>. Free also offers 720p; 1440p and 30/60 fps require Pro. Resolution is an upper bound: the app preserves your display’s proportions and does not enlarge a smaller screen.</p></li>
            <li><h3>Set the sound and focus.</h3><p>Turn <strong>System audio</strong> on to include sound playing on your Mac. This is not microphone narration. Keep <strong>Smart zoom</strong> on and start at <strong>Strength 1.75×</strong>. Two clicks close together in time start a smooth zoom.</p></li>
            <li><h3>Save, then start.</h3><p>Choose <strong>Start recording</strong>, pick a destination for the QuickTime <code>.mov</code> file, and let the countdown finish. The default countdown is 3 seconds; choose 0, 3, or 5 seconds in Settings before starting.</p></li>
            <li><h3>Stop and check the result.</h3><p>Use the menu-bar control or <kbd>Shift–Command–R</kbd> to stop. If another app owns the shortcut, use Focus Recorder’s controls. Let the app finish saving, then play the exported movie and check the cursor, sound, and framing.</p></li>
          </ol>
          <p className="guide-small">The recording controls stay out of the capture. Keep the app running until saving is complete.</p>
        </section>

        <section id="windows" aria-labelledby="windows-heading" className="guide-chapter">
          <span className="eyebrow">03 / WINDOWS PREVIEW</span>
          <h2 id="windows-heading"><WindowsPlatformIcon size={27} /> Your first Windows recording.</h2>
          <ol className="guide-steps">
            <li><h3>Install the Windows preview.</h3><p>Use the separate Windows 10 / 11 x64 download. Read the unsigned-installer notes on <Link href="/download">Downloads</Link>; do not turn off operating-system security protections.</p></li>
            <li><h3>Pick a display and recording quality.</h3><p>Choose a whole display, then <strong>720p or 1080p</strong>. Free uses <strong>24 fps</strong>. Pro also offers 30 fps. Recheck the selected display each time, especially after connecting another monitor.</p></li>
            <li><h3>Choose whether to narrate.</h3><p>Enable <strong>Microphone</strong> if you want your voice in the recording and allow microphone access if prompted. It is off by default. Windows does not record system audio. Leave Automatic zoom on and start at <strong>Zoom strength 1.75×</strong>.</p></li>
            <li><h3>Choose a WebM file and record.</h3><p>Choose <strong>Start recording</strong> and save to a filename ending in <code>.webm</code>. The app minimizes during recording. Walk through your demonstration, pausing briefly on the details you want viewers to see.</p></li>
            <li><h3>Stop and let the file finish.</h3><p>Use <kbd>Ctrl–Shift–R</kbd> or return to the app and choose <strong>Stop &amp; save</strong>. Keep it open while it finishes writing. Play the exported file to check the picture, microphone, and watermark before sharing.</p></li>
          </ol>
          <div className="guide-callout guide-callout-neutral"><strong>A preview, with platform limits.</strong><p>Windows currently exports WebM, up to 1080p at 30 fps with Pro. System audio, MP4, 1440p, 60 fps, and window/region capture are not supported. Some players have limited seeking for WebM. Real Windows capture, audio, high-DPI monitor alignment, and long recordings still need on-device validation; building an installer is not production testing.</p></div>
        </section>

        <section id="settings" aria-labelledby="settings-heading" className="guide-chapter">
          <span className="eyebrow">04 / MAKE IT YOURS</span>
          <h2 id="settings-heading"><SlidersHorizontal size={28} aria-hidden="true" /> Your setup, remembered.</h2>
          <p>Open <strong>Settings</strong> to choose an appearance; on Mac, you can also press <kbd>Command–,</kbd>. Recording controls save your defaults automatically for your next launch. Change them before starting a recording; a paid preference never unlocks Pro by itself.</p>
          <dl className="guide-setting-list">
            <div><dt>System</dt><dd>Follow your computer’s light or dark appearance. This is the default.</dd></div>
            <div><dt>Light</dt><dd>Keep the warm paper background, dark text, and Focus orange accents.</dd></div>
            <div><dt>Dark</dt><dd>Keep the dark desktop interface with the same Focus orange accents.</dd></div>
          </dl>
          <p>Appearance changes the recorder’s controls, not the colors of your exported screen recording.</p>
          <div className="guide-table-wrap"><table className="guide-settings-table">
            <caption>Recording options and fresh-install defaults</caption>
            <thead><tr><th scope="col">Setting</th><th scope="col">Mac</th><th scope="col">Windows</th></tr></thead>
            <tbody>
              <tr><th scope="row">Resolution</th><td>720p / 1080p / 1440p<br /><span>Default: 1080p</span></td><td>720p / 1080p<br /><span>Default: 1080p</span></td></tr>
              <tr><th scope="row">Frame rate</th><td>24 / 30 / 60 fps<br /><span>Default: 24 fps</span></td><td>24 / 30 fps<br /><span>Default: 24 fps</span></td></tr>
              <tr><th scope="row">Automatic zoom</th><td>On / Off<br /><span>Default: On</span></td><td>On / Off<br /><span>Default: On</span></td></tr>
              <tr><th scope="row">Zoom strength</th><td>1.25×–2.25×<br /><span>Default: 1.75×</span></td><td>1.25×–2.50×<br /><span>Default: 1.75×</span></td></tr>
              <tr><th scope="row">Audio</th><td>System audio<br /><span>Default: On</span></td><td>Microphone<br /><span>Default: Off</span></td></tr>
              <tr><th scope="row">Countdown</th><td>0 / 3 / 5 seconds<br /><span>Default: 3 seconds</span></td><td>No configurable countdown</td></tr>
            </tbody>
          </table></div>
          <p className="guide-small">Free remains limited to 720p or 1080p at 24 fps. Pro is required for Mac 1440p and 30/60 fps, or Windows 30 fps. Both platforms adjust zoom strength in 0.05× steps.</p>
          <div className="guide-callout"><strong>Reset preferences is a fresh setup, not a fresh account.</strong><p>It restores recording and appearance defaults. It does not sign you out, remove your account or Pro license, cancel your subscription, or delete recordings. Check your display and save destination before your next take.</p></div>
        </section>

        <section id="motion" aria-labelledby="motion-heading" className="guide-chapter">
          <span className="eyebrow">05 / FIND YOUR FOCUS</span>
          <h2 id="motion-heading"><MousePointer2 size={28} aria-hidden="true" /> Strength is not cursor speed.</h2>
          <p><strong>Strength controls zoom magnification:</strong> how close the camera moves in when automatic zoom activates. A lower number leaves more context visible. A higher number makes details larger and crops more of the surrounding screen.</p>
          <figure className="guide-zoom-comparison">
            <div><div className="guide-zoom-frame"><div className="guide-zoom-content"><Monitor size={28} aria-hidden="true" /><span>YOUR DETAIL</span><i /><i /></div></div><strong>1.25× · More context</strong></div>
            <div><div className="guide-zoom-frame"><div className="guide-zoom-content guide-zoom-content-close"><Monitor size={28} aria-hidden="true" /><span>YOUR DETAIL</span><i /><i /></div></div><strong>2.00× · A closer look</strong></div>
            <figcaption>Illustration of framing, not app footage. Both settings keep the same playback speed.</figcaption>
          </figure>
          <p><strong>Cursor smoothing is separate and automatic.</strong> It softens fast pointer movements in the recording while keeping clicks aligned. There is no cursor-speed slider, and it does not change your physical mouse speed or slow down the whole video.</p>
          <p>Start at 1.75×. Turn zoom off when viewers need the entire screen; lower Strength when a close-up feels too tight. For a calmer walkthrough, move deliberately and pause before clicking. Smoothing cannot make every rushed action easy to follow.</p>
          <details className="guide-practice">
            <summary>Try a 15-second practice take <span aria-hidden="true">+</span></summary>
            <div><p>This checklist is just for practice. It does not start recording or change your app settings.</p>
              <label><input type="checkbox" /><span>Start at 1080p, 24 fps, zoom on, 1.75×.</span></label>
              <label><input type="checkbox" /><span>Move to a harmless control, pause, then make two clicks close together in time.</span></label>
              <label><input type="checkbox" /><span>Move across the display, pause on another detail, then stop.</span></label>
              <label><input type="checkbox" /><span>Play the exported file. Check the framing, cursor, sound, and Free watermark.</span></label>
              <p className="guide-small">Checkboxes are temporary and may reset when you leave this page.</p>
            </div>
          </details>
        </section>

        <section id="pro" aria-labelledby="pro-heading" className="guide-chapter">
          <span className="eyebrow">06 / ONE LOGIN. YOUR PRO.</span>
          <h2 id="pro-heading">When you want a cleaner export.</h2>
          <p>Pro follows your Focus Recorder login, not a Device ID. The account flow uses Firebase Authentication; you only need your own email and password, not Firebase configuration or API keys.</p>
          <ol className="guide-steps">
            <li><h3>Create and verify your account.</h3><p>Open <Link href="/account">Your account</Link>, create an account, and open the email verification link. Return to the account page and choose <strong>I verified my email — refresh</strong>. Unverified accounts can still use Free, but cannot check out or unlock Pro.</p></li>
            <li><h3>Review the monthly subscription.</h3><p>Open <Link href="/checkout">Focus Pro checkout</Link>, read the <strong>$9 USD monthly automatic renewal</strong> terms, and check the consent box. Continue to PayPal and approve the subscription. There is no free trial.</p></li>
            <li><h3>Wait for payment verification.</h3><p>Keep the return page open. PayPal approval alone is not activation. If confirmation is delayed, use <strong>Check payment again</strong> or check your account before making another purchase. A payment simulation never grants Pro.</p></li>
            <li><h3>Sign into the desktop app.</h3><p>Use <strong>Account / Sign in</strong> on Mac or <strong>Your account → Sign in</strong> on Windows with the same email and password. Refresh account access if you just verified your email or paid. The app unlocks Pro only after it verifies paid access.</p></li>
          </ol>
          <p>Connect the app to the internet at least every three days to refresh paid access. Otherwise it returns to Free until it can verify access again. Signing out removes account-based Pro from that app; it does not cancel PayPal billing.</p>
          <details className="guide-faq"><summary>Cancel, reset a password, or use an older license <span aria-hidden="true">+</span></summary><div>
            <p><strong>Cancel renewal:</strong> manage the subscription in your PayPal account. Cancelling stops future renewals and keeps Pro through the paid period. Refunds or disputes can revoke access earlier.</p>
            <p><strong>Reset your password:</strong> use Forgot password before sign-in, or Send password reset email on the account page after sign-in. Follow the email link; never share your password or verification link.</p>
            <p><strong>Older licenses:</strong> use the existing/legacy license option and retain the original activation on its original computer. Creating an account does not automatically transfer an older purchase or associate it by email.</p>
          </div></details>
        </section>

        <section id="help" aria-labelledby="help-heading" className="guide-chapter">
          <span className="eyebrow">07 / A LITTLE HELP</span>
          <h2 id="help-heading">Get back to your take.</h2>
          <details className="guide-faq"><summary>The screen is blank or missing <span aria-hidden="true">+</span></summary><div><p>On Mac, check Screen Recording permission, quit and reopen the app, then select the display again. On Windows, select a normal desktop window: protected video, some fullscreen GPU apps, the locked screen, and the secure/UAC desktop may appear black. Do not try to bypass protected content.</p></div></details>
          <details className="guide-faq"><summary>The video has no sound <span aria-hidden="true">+</span></summary><div><p>On Mac, enable System audio and make sure the source app is playing sound. There is no microphone recording control. On Windows, enable Microphone and check Windows microphone permissions and input selection; system audio is not supported. Verify with a short exported test.</p></div></details>
          <details className="guide-faq"><summary>Zoom feels too strong, or the pointer feels rushed <span aria-hidden="true">+</span></summary><div><p>Lower Strength to show more of the display. This does not change cursor speed. Leave brief pauses during navigation and check the exported movie, where smoothing is applied. Turn auto zoom off when the full display should stay visible.</p></div></details>
          <details className="guide-faq"><summary>A setting is locked, or Pro still says Free <span aria-hidden="true">+</span></summary><div><p>Check that you are signed into the same verified account used at checkout, then refresh account access while online. Confirm payment in PayPal and on the website before trying another purchase. Reset preferences cannot unlock paid settings. Older licenses use the separate existing-license option.</p></div></details>
          <details className="guide-faq"><summary>Saving is slow, or the file will not play <span aria-hidden="true">+</span></summary><div><p>Let saving finish before quitting. Check free disk space, try a local folder, and make a short 720p test. Mac exports MOV; Windows exports WebM, which some players handle differently. Higher frame rates depend on your screen and hardware; dropped frames are possible on busy computers.</p></div></details>
        </section>

        <section id="updates" aria-labelledby="updates-heading" className="guide-chapter">
          <span className="eyebrow">08 / STAY UP TO DATE</span>
          <h2 id="updates-heading">Keep the app and guide together.</h2>
          <p>The appearance and saved-preference controls in this guide are in the redesigned desktop release. If yours looks different, finish and save any recording, quit the app, then get the latest installer for your platform from <Link href="/download">Downloads</Link>.</p>
          <p>On Mac, replace the app in Applications. On Windows, run the newer installer. Keep your saved recordings and existing license information; do not delete account data to update. Open the updated app, review your settings, and make a short test before your next full recording.</p>
          <p>Updates are manual; there is no automatic updater promised in these previews. You can return here from the app’s help controls. On Mac, <strong>Quick start</strong> also opens the built-in tutorial.</p>
          <Link href="/download" className="button button-dark">Find your download <ArrowUpRight size={17} /></Link>
        </section>
      </div>
    </div>
  </main><Footer /></>;
}
