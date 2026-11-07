/**
 * Optional browser check for the Parent Corner voice-recording cue (issue #3).
 * Uses Chromium's fake microphone so MediaRecorder really records.
 *
 *   npm run build && npm run preview     # in one terminal
 *   npm run e2e:recording                # in another (needs Playwright + Chromium)
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const URL = process.env.RB_URL || 'http://localhost:4173/robot-bunnies/';
const SHOT = process.env.RB_SHOT;
const week = {
  schemaVersion: 2, activeWeekId: 'w1',
  weeks: [{ id: 'w1', label: 'Test week', words: ['ship', 'happy', 'moon'], progress: {}, createdAt: new Date().toISOString() }]
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.evaluate(w => { localStorage.clear(); localStorage.setItem('robot-bunnies.spelling.v1', JSON.stringify(w)); }, week);
  await page.reload();
  await page.waitForTimeout(800);
  await page.evaluate(() => window.dispatchEvent(new Event('robot-bunnies:open-parent')));
  await page.fill('#adult-answer', '84');
  await page.click('#adult-unlock');
  await page.waitForSelector('#week-stats .rec-btn');

  const rowState = () => page.evaluate(() => {
    const rows = [...document.querySelectorAll('#week-stats li')];
    return {
      banner: document.querySelector('#rec-banner').hidden ? null : document.querySelector('#rec-banner').textContent,
      recordingRows: rows.filter(r => r.classList.contains('is-recording')).map(r => r.querySelector('strong').textContent),
      buttons: [...document.querySelectorAll('#week-stats .rec-btn')].map(b => ({ text: b.textContent, disabled: b.disabled, stop: b.classList.contains('rec-stop') })),
      level: (() => { const l = document.querySelector('.rec-level'); return l ? parseFloat(l.style.width) || 0 : null; })(),
      message: document.querySelector('#parent-message').textContent
    };
  });

  // 1. Tap Record: the cue appears immediately (before the mic opens), other Record buttons disabled.
  await page.locator('#week-stats .rec-btn').first().click();
  let s = await rowState();
  assert.match(s.banner, /(Opening the microphone to record|Get ready to say) “ship”/, 'banner appears the instant Record is tapped');
  assert.deepEqual(s.recordingRows, ['ship'], 'the word row is highlighted');
  assert.ok(s.buttons[0].stop && s.buttons[1].disabled && s.buttons[2].disabled, 'active button is Stop; others disabled');

  // 2. Recording: countdown, banner, live level meter.
  await page.waitForTimeout(900);
  s = await rowState();
  assert.match(s.buttons[0].text, /■ Stop · [1-5]/, 'Stop button shows seconds left');
  assert.match(s.banner, /Recording “ship”.*s left/, 'banner says recording with time left');
  // The fake mic plays short beeps, so watch the meter for a moment rather than sampling one frame.
  const meterMoved = await page.waitForFunction(() => {
    const l = document.querySelector('.rec-level');
    return !l || parseFloat(l.style.width) > 0;
  }, null, { timeout: 1500, polling: 'raf' }).then(() => true, () => false);
  assert.ok(meterMoved, 'mic level meter moves (fake mic plays a tone)');
  if (SHOT) await page.screenshot({ path: SHOT });

  // 3. Tap Stop to finish early → saved, cue removed, recording available.
  // force: the Stop button pulses, and Playwright otherwise waits for it to stop moving.
  await page.locator('#week-stats .rec-btn').first().click({ force: true });
  await page.waitForFunction(() => /Saved your recording of "ship"/.test(document.querySelector('#parent-message').textContent), null, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('#week-stats .rec-btn').length === 3);
  s = await rowState();
  assert.equal(s.banner, null, 'banner hidden after stopping');
  assert.deepEqual(s.recordingRows, [], 'no row highlighted after stopping');
  assert.ok(s.buttons.every(b => !b.disabled && !b.stop), 'all Record buttons restored');
  assert.match(s.buttons[0].text, /Re-record/, 'saved word now offers Re-record');

  // 4. Auto-stop after the time limit.
  await page.locator('#week-stats .rec-btn').nth(1).click();
  await page.waitForFunction(() => /Saved your recording of "happy"/.test(document.querySelector('#parent-message').textContent), null, { timeout: 9000 });
  await page.waitForFunction(() => document.querySelectorAll('#week-stats .rec-btn').length === 3);
  s = await rowState();
  assert.equal(s.banner, null);
  assert.match(s.buttons[1].text, /Re-record/);

  // 5. Closing Parent Corner mid-recording stops cleanly (nothing left recording).
  await page.locator('#week-stats .rec-btn').nth(2).click();
  await page.waitForTimeout(800);
  await page.click('#parent-close');
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => document.querySelector('#rec-banner').hidden), true, 'no banner after closing');

  assert.deepEqual(errors, [], 'no page errors');
  console.log('Passed: recording cue (get-ready, highlighted row, Stop countdown, level meter, banner), early stop, auto-stop and close-while-recording.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
