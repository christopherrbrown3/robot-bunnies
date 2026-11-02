/** Storybook cutscenes: big captions, optional narration, Next and Skip. Never required reading. */
import Phaser from 'phaser';
import { CUTSCENES, type PanelArt } from '../game/cutscenes';
import { makeButton, textStyle } from '../game/ui';
import { loadPrefs, markCutsceneSeen } from '../audio/prefs';
import { speak, stopSpeech } from '../audio/speech';

interface CutsceneData { id: string; next: 'Game' | 'Map' | 'Finale' | 'Title' }

export class CutsceneScene extends Phaser.Scene {
  private index = 0;
  private dataIn!: CutsceneData;
  private stage!: Phaser.GameObjects.Container;
  private caption!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('Cutscene');
  }

  init(data: CutsceneData): void {
    this.dataIn = data;
    this.index = 0;
  }

  create(): void {
    const cut = CUTSCENES[this.dataIn.id];
    if (!cut) { this.scene.start(this.dataIn.next); return; }
    markCutsceneSeen(cut.id);
    this.cameras.main.setBackgroundColor('#2a1a48');
    const frame = this.add.graphics();
    frame.fillStyle(0xfff6ff, 1).fillRoundedRect(40, 20, 880, 360, 26);
    frame.lineStyle(6, 0xf2bde4, 1).strokeRoundedRect(40, 20, 880, 360, 26);
    this.stage = this.add.container(0, 0);
    const mask = this.make.graphics({}).fillRoundedRect(46, 26, 868, 348, 22);
    this.stage.setMask(mask.createGeometryMask());

    this.caption = this.add.text(480, 428, '', textStyle(25, '#ffffff', true, { align: 'center', wordWrap: { width: 860 }, lineSpacing: 4 })).setOrigin(0.5);
    makeButton(this, 110, 500, 170, 56, '🔊 Read', () => this.read(), { color: 0x8f53b5, fontSize: 21 });
    makeButton(this, 850, 500, 170, 56, 'Skip ⏭', () => this.finish(), { color: 0x6a5080, fontSize: 21 });
    this.nextBtn = makeButton(this, 480, 500, 230, 60, 'Next ▶', () => this.advance(), { color: 0x7445c5, fontSize: 24 });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => stopSpeech());
    this.cameras.main.fadeIn(300);
    this.showPanel();
  }

  private showPanel(): void {
    const cut = CUTSCENES[this.dataIn.id];
    const panel = cut.panels[this.index];
    this.stage.removeAll(true);
    this.paint(panel.art);
    this.caption.setText(panel.caption);
    const last = this.index === cut.panels.length - 1;
    (this.nextBtn.list[1] as Phaser.GameObjects.Text).setText(last ? (this.dataIn.next === 'Game' ? "Let's go! ▶" : 'Done ▶') : 'Next ▶');
    if (loadPrefs().narration) this.read();
  }

  private read(): void {
    const panel = CUTSCENES[this.dataIn.id].panels[this.index];
    void speak(panel.caption, 0.95);
  }

  private advance(): void {
    stopSpeech();
    if (this.index < CUTSCENES[this.dataIn.id].panels.length - 1) {
      this.index++;
      this.showPanel();
    } else this.finish();
  }

  private finish(): void {
    stopSpeech();
    this.scene.start(this.dataIn.next);
  }

  // ---- panel art, composed from the generated character textures ----

  private sky(top: number, bottom: number): void {
    const g = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(top), Phaser.Display.Color.ValueToColor(bottom), 16, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)).fillRect(40, 20 + i * 23, 880, 24);
    }
    this.stage.add(g);
  }

  private ground(color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color).fillRect(40, 330, 880, 60);
    this.stage.add(g);
  }

  private img(x: number, y: number, key: string, scale = 1, flip = false): Phaser.GameObjects.Image {
    const i = this.add.image(x, y, key).setOrigin(0.5, 1).setScale(scale).setFlipX(flip);
    this.stage.add(i);
    return i;
  }

  private bob(target: Phaser.GameObjects.GameObject, dy = 10, ms = 500): void {
    this.tweens.add({ targets: target, y: `-=${dy}`, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private label(x: number, y: number, text: string, size = 30, color = '#ff4f8b'): void {
    this.stage.add(this.add.text(x, y, text, textStyle(size, color, true, { stroke: '#ffffff', strokeThickness: 7 })).setOrigin(0.5));
  }

  private castleBack(): void {
    this.sky(0xffd1ec, 0xff9fd2);
    const g = this.add.graphics();
    g.fillStyle(0xff7cc0);
    for (let x = 60; x < 920; x += 220) { g.fillRect(x, 60, 50, 280); g.fillStyle(0xffc2e3).fillRect(x + 80, 140, 100, 200); g.fillStyle(0xff7cc0); }
    this.stage.add(g);
    this.ground(0xc9468f);
  }

  private paint(art: PanelArt): void {
    switch (art) {
      case 'lyla-hello': {
        this.sky(0xa8e4ff, 0xe8fbff); this.ground(0x58b96a);
        const l = this.img(480, 340, 'lyla-cheer', 2); this.bob(l, 14, 450);
        for (const [x, k] of [[250, 'flower'], [320, 'flower-b'], [650, 'flower-c'], [720, 'flower']] as const) this.img(x, 338, k, 1.3);
        this.label(480, 70, 'Lyla', 40, '#c0307a');
        break;
      }
      case 'king-phone': {
        this.castleBack();
        const k = this.img(260, 345, 'king', 1.6); this.bob(k, 6, 900);
        for (const [x, s] of [[560, 0.9], [680, 0.9], [800, 0.9]] as const) this.img(x, 340, 'lyla-stand', s, false);
        const g = this.add.graphics(); g.lineStyle(5, 0x7fe0ff, 0.9);
        for (let r = 40; r <= 120; r += 40) { g.beginPath(); g.arc(380, 200, r, -0.6, 0.6); g.strokePath(); }
        this.stage.add(g);
        this.tweens.add({ targets: g, alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
        break;
      }
      case 'castle-cage': {
        this.castleBack();
        this.img(480, 345, 'lyla-stand', 1.1);
        this.img(480, 352, 'cage', 1.1);
        this.img(740, 345, 'king', 1.2, true);
        for (const [x, k] of [[150, 'flower'], [210, 'flower-c']] as const) this.img(x, 340, k, 1.2);
        break;
      }
      case 'police-key': {
        this.castleBack();
        this.img(360, 345, 'lyla-stand', 1.1);
        this.img(360, 352, 'cage', 1.1);
        const p = this.img(620, 345, 'police-cheer', 1.3, true); this.bob(p, 8, 400);
        const key = this.add.graphics();
        key.fillStyle(0xffd84d).lineStyle(3, 0xa87b10).fillCircle(0, 0, 16).strokeCircle(0, 0, 16).fillRect(14, -5, 46, 10).fillRect(46, 5, 8, 12).fillRect(34, 5, 8, 9);
        key.setPosition(530, 190);
        this.stage.add(key);
        this.tweens.add({ targets: key, angle: 15, duration: 400, yoyo: true, repeat: -1 });
        break;
      }
      case 'rainbow-jump': {
        this.sky(0xfff4fb, 0xe6dcff);
        const g = this.add.graphics();
        [0xff5a5a, 0xff9f43, 0xffd84d, 0x4fd17a, 0x4fb3ff, 0x9b6bff].forEach((c, i) => { g.lineStyle(26, c, 0.9).beginPath(); g.arc(480, 420, 340 - i * 26, Math.PI, 0); g.strokePath(); });
        this.stage.add(g);
        const l = this.img(480, 300, 'lyla-jump', 1.6);
        this.tweens.add({ targets: l, y: 220, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'zoo-warning': {
        this.sky(0xffe9a8, 0xfff8e0); this.ground(0xc98a4a);
        this.img(620, 340, 'tree', 1);
        const m = this.add.image(672, 150, 'monkey').setOrigin(0.5, 0.2); this.stage.add(m);
        this.tweens.add({ targets: m, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1 });
        this.img(300, 340, 'lyla-run1', 1.2);
        this.label(672, 70, '!', 70);
        break;
      }
      case 'workshop': {
        this.sky(0xd9d4ff, 0xfff0e6); this.ground(0x6a5a8a);
        const g = this.add.graphics();
        for (const [x, y, r] of [[200, 140, 50], [280, 210, 34], [760, 130, 44]] as const) {
          g.fillStyle(0xb4a8e6).fillCircle(x, y, r);
          for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillRect(x + Math.cos(a) * r - 8, y + Math.sin(a) * r - 8, 16, 16); }
          g.fillStyle(0xfff6ff).fillCircle(x, y, r * 0.35);
        }
        this.stage.add(g);
        this.tweens.add({ targets: g, alpha: { from: 0.8, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
        this.img(560, 345, 'phone-big', 0.9);
        this.img(380, 340, 'lyla-stand', 1.1);
        break;
      }
      case 'bow-hint': {
        this.sky(0x9fdcff, 0xf0fff6); this.ground(0x6cc96a);
        this.img(300, 345, 'police', 1.2);
        const b = this.add.image(520, 200, 'bow').setAngle(-90).setScale(1.3); this.stage.add(b); this.bob(b, 10, 600);
        this.img(720, 340, 'lyla-cheer', 1.2, false);
        this.stage.add(this.add.image(820, 140, 'target').setScale(0.8));
        break;
      }
      case 'monster-appears': {
        this.sky(0xffb38a, 0xffe0f0); this.ground(0x7cc95a);
        const m = this.img(640, 360, 'monster', 0.95);
        this.tweens.add({ targets: m, scaleY: 1, duration: 800, yoyo: true, repeat: -1 });
        this.img(250, 340, 'lyla-stand', 1.2);
        break;
      }
      case 'monster-friendly': {
        this.sky(0xffd6ea, 0xfff4d0); this.ground(0x7cc95a);
        const m = this.img(600, 340, 'monster-friendly', 1.6); this.bob(m, 18, 350);
        this.img(340, 340, 'lyla-cheer', 1.3);
        this.label(470, 80, '♥', 54, '#ff4f8b');
        break;
      }
      case 'robots-free': {
        this.castleBack();
        const g = this.add.graphics();
        g.fillStyle(0x2a2a3a).fillRoundedRect(130, 150, 80, 130, 12).fillStyle(0x888899).fillRoundedRect(140, 162, 60, 96, 6);
        g.lineStyle(4, 0xffffff).lineBetween(150, 175, 190, 240).lineBetween(190, 175, 150, 240);
        this.stage.add(g);
        [380, 500, 620, 740].forEach((x, i) => { const b = this.img(x, 340, i % 2 ? 'lyla-cheer' : 'lyla-stand', 0.95); this.bob(b, 16, 300 + i * 60); });
        break;
      }
      case 'flowers-home': {
        this.sky(0xa8e4ff, 0xfff0f8); this.ground(0x58b96a);
        for (let x = 90; x < 900; x += 60) this.img(x, 345, ['flower', 'flower-b', 'flower-c'][(x / 60) % 3 | 0], 1.2);
        const l = this.img(480, 330, 'lyla-cheer', 1.7); this.bob(l, 16, 380);
        this.img(680, 330, 'police-cheer', 1.2, true);
        this.label(480, 70, 'Hooray!', 44, '#c0307a');
        break;
      }
    }
  }
}
