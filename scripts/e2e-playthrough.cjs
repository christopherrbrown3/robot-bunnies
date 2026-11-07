/**
 * Optional browser smoke test: plays every level of the production build.
 *
 *   npm run build && npm run preview          # in one terminal
 *   npm run e2e                               # in another (needs Playwright + Chromium)
 *
 * Uses the `?debug` hook to teleport Lyla near each story object, answers each
 * spelling prompt with the keyboard fallback (every 4th one wrong first, to
 * exercise reveal → retry), solves the paint doors, shoots the boss stars and
 * checks that the run covers every word on a 15-word list with no page errors.
 * Not part of `npm test`: CI has no browser.
 */
const { chromium } = require('playwright');

const URL = process.env.RB_URL || 'http://localhost:4173/robot-bunnies/?debug';
const words = ['ship', 'happy', 'rabbit', 'flower', 'jump', 'moon', 'star', 'king', 'blue', "don't", 'ice-cream', 'night', 'light', 'bright', 'green'];
const week = { schemaVersion: 2, activeWeekId: 'w1', weeks: [{ id: 'w1', label: 'Test week', words, progress: {}, createdAt: new Date().toISOString() }] };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  await page.evaluate(w => { localStorage.clear(); localStorage.setItem('robot-bunnies.spelling.v1', JSON.stringify(w)); }, week);
  await page.reload();
  await page.waitForTimeout(1200);
  const box = await page.locator('canvas').boundingBox();
  const tap = async (x, y) => page.mouse.click(box.x + x * box.width / 960, box.y + y * box.height / 540);
  const G = (body, arg) => page.evaluate(([b, a]) => new Function('g', 'a', b)(window.__rbGame.scene.getScene('Game'), a), [body, arg]);
  const panelOpen = () => page.evaluate(() => { const p = document.querySelector('#spell-panel'); return !!p && !p.hidden; });
  const campaign = () => page.evaluate(() => JSON.parse(localStorage.getItem('robot-bunnies.campaign.v2')));

  await page.evaluate(() => window.__rbGame.scene.getScenes(true)[0].scene.start('Map'));
  await page.waitForTimeout(500);
  const LEVELS = require('../src/content/levels.json').length;
  for (let lvl = 1; lvl <= LEVELS; lvl++) {
    await page.evaluate(() => window.__rbGame.scene.getScenes(true)[0].scene.start('Game'));
    for (let i = 0; i < 100; i++) { await page.waitForTimeout(100); if (await G('return g.level ? g.level.id : 0') === lvl) break; }
    if (lvl !== 1) {
      for (let i = 0; i < 60; i++) { if ((await G('return g.state;')) === 'running') break; await page.waitForTimeout(100); }
      const target = await G('const L = g.layout; return L.arenaX !== null ? L.arenaX - 150 : L.trigger.x - 300;');
      await G('g.lyla.body.reset(a, 470);', target);
    }
    let puzzled = false;
    for (let i = 0; i < 300; i++) {
      const state = await G('return g.state;');
      if (state === 'puzzle' && !puzzled) {
        puzzled = true;
        const order = [3, 0, 5, 2, 4, 1];
        for (let ci = 0; ci < 6; ci++) { await tap(330 + order.indexOf(ci) * 92, 330); await page.waitForTimeout(120); }
      } else if (state === 'boss' && !(await panelOpen())) {
        const stars = await G('const s = g.cameras.main.scrollX; return g.bossStars.filter(x => x.active && x.input && x.input.enabled).map(st => [st.x - s, st.y]);');
        for (const [x, y] of stars) { await tap(x, y); await page.waitForTimeout(500); }
      }
      if (await panelOpen()) {
        const word = await G('return g.campaign.steps[g.levelIndex].word;');
        if (lvl % 4 === 0) {
          await page.keyboard.type('q'.repeat(word.length));
          await page.keyboard.press('Enter'); // miss → correct spelling revealed
          await page.keyboard.press('Enter'); // hide it & try again
        }
        await page.keyboard.type(word);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(150);
        await page.keyboard.press('Enter'); // Continue
        break;
      }
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(lvl === LEVELS ? 4000 : 1500);
    await G('g.lyla.body.reset(a, 470);', (await G('return g.layout.portalX;')) - 200);
    let done = false;
    for (let i = 0; i < 120 && !done; i++) { await page.waitForTimeout(150); done = (await campaign()).nextLevelIndex >= lvl; }
    const c = await campaign();
    console.log(`Level ${lvl}: ${done ? 'complete' : 'STUCK'} · word "${c.steps[lvl - 1].word}" · ${c.results[lvl - 1]}`);
    if (!done) { process.exitCode = 1; break; }
  }
  const c = await campaign();
  const covered = new Set(c.steps.filter((s, i) => c.results[i] && s.source === 'current').map(s => s.word));
  const missing = words.filter(w => !covered.has(w));
  console.log(missing.length ? `Missing words: ${missing.join(', ')}` : `Every weekly word was covered in the ${LEVELS}-level run.`);
  if (missing.length || errors.length) process.exitCode = 1;
  console.log(errors.length ? `Page errors:\n${errors.join('\n')}` : 'No page errors.');
  await browser.close();
})();
