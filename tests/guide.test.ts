import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guide = readFileSync(new URL('../src/app/guide/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

test('guide keeps stable platform, settings, and account deep links', () => {
  for (const id of ['before-you-start', 'mac', 'windows', 'settings', 'motion', 'pro', 'help', 'updates']) {
    assert.match(guide, new RegExp('id="' + id + '"'));
    assert.match(guide, new RegExp("\\['" + id + "',"));
  }
  assert.match(guide, /aria-label="Guide chapters"/);
  assert.match(guide, /<caption>Recording options and fresh-install defaults<\/caption>/);
  assert.match(guide, /scope="col"/);
  assert.match(guide, /scope="row"/);
});

test('guide clearly distinguishes strength, platform settings, and appearance reset', () => {
  for (const text of ['Strength is not cursor speed.', 'Strength controls zoom magnification:',
    '1.25×–2.25×', '1.25×–2.50×', 'Default: 1.75×', '0 / 3 / 5 seconds',
    'System', 'Light', 'Dark', 'does not sign you out, remove your account or Pro license, cancel your subscription, or delete recordings']) {
    assert.ok(guide.includes(text), 'Missing guide contract: ' + text);
  }
  assert.match(guide, /There is no cursor-speed slider/);
  assert.match(guide, /not the colors of your exported screen recording/);
});

test('guide discloses Free export limits and does not promise untested platform features', () => {
  assert.match(guide, /Free exports: up to 1080p at 24 fps/);
  assert.match(guide, /watermark bounces throughout every exported video/);
  assert.match(guide, /\$9 USD per month/);
  assert.match(guide, /Unverified accounts can still use Free, but cannot check out or unlock Pro/);
  assert.match(guide, /PayPal approval alone is not activation/);
  assert.match(guide, /System audio, MP4, 1440p, 60 fps, and window\/region capture are not supported/);
  assert.match(guide, /building an installer is not production testing/);
  assert.match(guide, /Updates are manual/);
});

test('guide practice is native accessible HTML without service calls or new media', () => {
  assert.equal((guide.match(/<label><input type="checkbox" \/>/g) || []).length, 4);
  assert.match(guide, /It does not start recording or change your app settings/);
  assert.match(guide, /Illustration of framing, not app footage/);
  assert.doesNotMatch(guide, /['"]use client['"]|fetch\(|localStorage|<iframe|<img|<video|process\.env/);
  assert.match(guide, /ApplePlatformIcon/);
  assert.match(guide, /WindowsPlatformIcon/);
  assert.match(css, /\.guide-layout\{display:grid;grid-template-columns:225px minmax\(0,1fr\)/);
  assert.match(css, /\.guide-sidebar\{position:static/);
});
