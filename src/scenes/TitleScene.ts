import Phaser from 'phaser';
import { setupCamera } from '../game/hidpi';
import { makeBubble, makeButton, textStyle } from '../game/ui';
import { PARENT_EVENT, addUpdateButton, hasActiveList, levels, refreshOnDataChange, startAdventure } from '../game/flow';
import { consumeJustUpdated, versionLabel } from '../updates';
import { CAMPAIGN_LEVEL_COUNT, peekCampaign } from '../spelling/campaign';
import { loadPrefs, prefersReducedMotion, savePrefs } from '../audio/prefs';
import { generateTitleArt } from '../game/sceneArt';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    setupCamera(this);
    refreshOnDataChange(this);
    generateTitleArt(this);
    const calm = prefersReducedMotion();
    this.add.image(480, 270, 'title-bg');
    // Drifting clouds.
    for (const [x, y, sc, ms] of [[140, 120, 0.9, 52000], [560, 60, 0.7, 70000], [860, 150, 1.1, 60000]] as const) {
      const c = this.add.image(x, y, 'title-cloud').setScale(sc).setAlpha(0.95);
      if (!calm) this.tweens.add({ targets: c, x: x + 1100, duration: ms, repeat: -1, onRepeat: () => { c.x = -120; } });
    }
    // Sparkles drifting around the rainbow.
    if (!calm) {
      this.add.particles(0, 0, 'sparkle', {
        x: { min: 120, max: 920 }, y: { min: 80, max: 420 }, lifespan: 2400, frequency: 260,
        scale: { start: 0.2, end: 0.7 }, alpha: { start: 1, end: 0 }, speedY: { min: -10, max: 4 },
        blendMode: Phaser.BlendModes.ADD
      });
    }
    for (const [x, y, key] of [[330, 486, 'flower'], [372, 492, 'flower-b'], [612, 488, 'flower-c'], [890, 492, 'flower'], [930, 486, 'flower-b']] as const) {
      const f = this.add.image(x, y, key);
      if (!calm) this.tweens.add({ targets: f, y: y - 6, angle: { from: -4, to: 4 }, duration: 800 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const shadow = this.add.image(760, 500, 'shadow').setScale(1.6, 1.4);
    const lyla = this.add.image(760, 500, 'lyla-cheer').setOrigin(0.5, 1).setScale(1.5);
    if (!calm) {
      this.tweens.add({ targets: lyla, y: 466, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut', repeatDelay: 600 });
      this.tweens.add({ targets: shadow, scaleX: 1.1, scaleY: 1, alpha: 0.6, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut', repeatDelay: 600 });
    }

    const logo = this.add.text(480, 66, 'ROBOT BUNNIES', textStyle(70, '#ffffff', true, {
      stroke: '#ffffff', strokeThickness: 14, shadow: { offsetX: 0, offsetY: 6, color: 'rgba(90,20,120,0.45)', blur: 10, fill: true, stroke: true }
    })).setOrigin(0.5);
    const grad = logo.context.createLinearGradient(0, 0, 0, logo.height);
    grad.addColorStop(0.15, '#ff5fb0');
    grad.addColorStop(0.55, '#a347e6');
    grad.addColorStop(0.9, '#6a2fd0');
    logo.setFill(grad);
    if (!calm) this.tweens.add({ targets: logo, scale: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(480, 130, "Lyla's Spelling Quest", textStyle(32, '#7a2fb0', true, {
      stroke: '#ffffff', strokeThickness: 9, shadow: { offsetX: 0, offsetY: 3, color: 'rgba(90,20,120,0.3)', blur: 6, fill: true, stroke: true }
    })).setOrigin(0.5);
    this.add.text(480, 170, 'Story and characters by Zoey', textStyle(18, '#6a387c', true, { stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5);

    const ready = hasActiveList();
    let playLabel = '▶  PLAY';
    if (ready) {
      const saved = peekCampaign();
      if (saved && saved.nextLevelIndex > 0 && saved.nextLevelIndex < CAMPAIGN_LEVEL_COUNT) {
        playLabel = `▶  CONTINUE · Level ${saved.nextLevelIndex + 1}`;
      } else if (saved?.level) {
        playLabel = '▶  CONTINUE · Level 1';
      }
    }
    makeButton(this, 480, 262, 420, 78, playLabel, () => {
      if (!ready) { this.needWords(); return; }
      startAdventure(this);
    }, { color: 0x7445c5, fontSize: 30 });
    makeButton(this, 375, 352, 200, 60, '🗺 Map', () => {
      if (!ready) { this.needWords(); return; }
      this.scene.start('Map');
    }, { color: 0x8f53b5, fontSize: 23 });
    makeButton(this, 585, 352, 200, 60, 'Grown-ups', () => window.dispatchEvent(new Event(PARENT_EVENT)), { color: 0x8f53b5, fontSize: 23 });

    const soundBtn = makeButton(this, 905, 500, 80, 56, loadPrefs().sound ? '🔊' : '🔇', () => {
      const next = savePrefs({ sound: !loadPrefs().sound });
      (soundBtn.list[1] as Phaser.GameObjects.Text).setText(next.sound ? '🔊' : '🔇');
    }, { color: 0x6a5080, fontSize: 26 });

    // Which version is installed, and an Update button once a new one has downloaded.
    this.add.text(12, 10, versionLabel(), textStyle(13, '#5a2a7a', true)).setAlpha(0.7);
    addUpdateButton(this, 160, 500, 270);
    if (consumeJustUpdated()) {
      const done = makeBubble(this, 480, 200, 'Robot Bunnies is up to date! ✨', 420, false).setDepth(50);
      this.time.delayedCall(2600, () => done.destroy());
    }

    if (!ready) {
      this.add.text(480, 418, 'A grown-up adds this week\'s spelling words in Grown-ups first.', textStyle(19, '#5a2a7a', true, { stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5);
    } else {
      this.add.text(480, 418, `${levels.length} levels · this week's spelling words · no timers`, textStyle(19, '#5a2a7a', true, { stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5);
    }
  }

  private needWords(): void {
    const bubble = makeBubble(this, 480, 200, "Ask a grown-up to add this week's spelling words!", 460, false).setDepth(50);
    this.time.delayedCall(1600, () => {
      bubble.destroy();
      window.dispatchEvent(new Event(PARENT_EVENT));
    });
  }
}
