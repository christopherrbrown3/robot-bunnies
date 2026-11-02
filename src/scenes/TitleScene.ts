import Phaser from 'phaser';
import { makeBubble, makeButton, textStyle } from '../game/ui';
import { PARENT_EVENT, hasActiveList, levels, refreshOnDataChange, startAdventure } from '../game/flow';
import { peekCampaign } from '../spelling/campaign';
import { loadPrefs, savePrefs } from '../audio/prefs';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    refreshOnDataChange(this);
    const g = this.add.graphics();
    // Sky, rainbow and the hot pink castle.
    const bands = 24;
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xa8dcff), Phaser.Display.Color.ValueToColor(0xffe0f4), bands, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)).fillRect(0, (540 / bands) * i, 960, 540 / bands + 1);
    }
    const rainbow = [0xff5a5a, 0xff9f43, 0xffd84d, 0x4fd17a, 0x4fb3ff, 0x9b6bff];
    rainbow.forEach((c, i) => { g.lineStyle(16, c, 0.75).beginPath(); g.arc(480, 520, 430 - i * 16, Math.PI, 0); g.strokePath(); });
    g.fillStyle(0xffffff, 0.9);
    for (const [x, y, s] of [[120, 110, 1], [800, 90, 1.2], [640, 170, 0.8]] as const) {
      g.fillCircle(x, y, 26 * s).fillCircle(x + 30 * s, y - 12 * s, 32 * s).fillCircle(x + 62 * s, y, 26 * s);
    }
    // Castle.
    g.fillStyle(0xff7cc0).fillRect(40, 250, 230, 230);
    g.fillStyle(0xff9fd2).fillRect(30, 190, 60, 290).fillRect(220, 190, 60, 290);
    g.fillStyle(0xf25aa9).fillTriangle(22, 196, 60, 130, 98, 196).fillTriangle(212, 196, 250, 130, 288, 196);
    g.fillStyle(0x9a2f6c).fillRoundedRect(128, 380, 56, 100, { tl: 28, tr: 28, bl: 0, br: 0 });
    g.fillStyle(0xffe066).fillRect(52, 230, 16, 22).fillRect(242, 230, 16, 22);
    // Ground.
    g.fillStyle(0x58b96a).fillRect(0, 478, 960, 62);
    g.fillStyle(0x7fd08a);
    for (let x = 0; x < 960; x += 24) g.fillCircle(x + 12, 480, 12);

    for (const [x, key] of [[330, 'flower'], [372, 'flower-b'], [612, 'flower-c'], [890, 'flower'], [930, 'flower-b']] as const) {
      const f = this.add.image(x, 466, key);
      this.tweens.add({ targets: f, y: 460, duration: 800 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const lyla = this.add.image(760, 480, 'lyla-cheer').setOrigin(0.5, 1).setScale(1.5);
    this.tweens.add({ targets: lyla, y: 450, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut', repeatDelay: 600 });

    this.add.text(480, 66, 'ROBOT BUNNIES', textStyle(68, '#ffffff', true, { stroke: '#7a2fb0', strokeThickness: 12 })).setOrigin(0.5);
    this.add.text(480, 128, "Lyla's Spelling Quest", textStyle(32, '#7a2fb0', true, { stroke: '#ffffff', strokeThickness: 8 })).setOrigin(0.5);
    this.add.text(480, 168, 'Story and characters by Zoey', textStyle(18, '#6a387c', true, { stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5);

    const ready = hasActiveList();
    let playLabel = '▶  PLAY';
    if (ready) {
      const saved = peekCampaign();
      if (saved && saved.nextLevelIndex > 0 && saved.nextLevelIndex < 22) {
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
