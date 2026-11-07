/** Storybook cutscenes: big captions, optional narration, Next and Skip. Never required reading. */
import Phaser from 'phaser';
import { setupCamera } from '../game/hidpi';
import { CUTSCENES, type PanelArt } from '../game/cutscenes';
import { makeButton, textStyle } from '../game/ui';
import { addGround, ensureThemeArt, type ThemeKey } from '../game/themes';
import { generateStoryFrame } from '../game/sceneArt';
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
    setupCamera(this);
    const cut = CUTSCENES[this.dataIn.id];
    if (!cut) { this.scene.start(this.dataIn.next); return; }
    markCutsceneSeen(cut.id);
    this.cameras.main.setBackgroundColor('#2a1a48');
    generateStoryFrame(this);
    this.add.image(480, 200, 'panel-frame');
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

  // ---- panel art: theme backdrops plus the generated character textures ----

  /** Paint a level theme's sky, scenery and ground into the storybook frame. */
  private backdrop(theme: ThemeKey): void {
    const art = ensureThemeArt(this, theme);
    this.stage.add(this.add.image(480, 140, art.far));
    this.stage.add(this.add.image(480, 230, art.mid));
    this.stage.add(addGround(this, art.ground, 480, 385, 880));
  }

  private img(x: number, y: number, key: string, scale = 1, flip = false, shadow = true): Phaser.GameObjects.Image {
    if (shadow) this.stage.add(this.add.image(x, y + 2, 'shadow').setScale(scale * 1.1, scale));
    const i = this.add.image(x, y, key).setOrigin(0.5, 1).setScale(scale).setFlipX(flip);
    this.stage.add(i);
    return i;
  }

  private bob(target: Phaser.GameObjects.GameObject, dy = 10, ms = 500): void {
    this.tweens.add({ targets: target, y: `-=${dy}`, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private label(x: number, y: number, text: string, size = 30, color = '#ff4f8b'): void {
    this.stage.add(this.add.text(x, y, text, textStyle(size, color, true, {
      stroke: '#ffffff', strokeThickness: 8, shadow: { offsetX: 0, offsetY: 3, color: 'rgba(60,10,60,0.35)', blur: 6, fill: true, stroke: true }
    })).setOrigin(0.5));
  }

  private paint(art: PanelArt): void {
    switch (art) {
      case 'lyla-hello': {
        this.backdrop('meadow');
        for (const [x, k] of [[250, 'flower'], [320, 'flower-b'], [650, 'flower-c'], [720, 'flower']] as const) this.img(x, 345, k, 1.3, false, false);
        const l = this.img(480, 342, 'lyla-cheer', 2); this.bob(l, 14, 450);
        this.label(480, 70, 'Lyla', 44, '#c0307a');
        break;
      }
      case 'king-phone': {
        this.backdrop('castle');
        const k = this.img(260, 345, 'king', 1.6); this.bob(k, 6, 900);
        for (const x of [560, 680, 800]) this.img(x, 342, 'lyla-stand', 0.9);
        const g = this.add.graphics(); g.lineStyle(6, 0x7fe0ff, 0.95);
        for (let r = 40; r <= 120; r += 40) { g.beginPath(); g.arc(380, 200, r, -0.6, 0.6); g.strokePath(); }
        this.stage.add(g);
        this.tweens.add({ targets: g, alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
        break;
      }
      case 'castle-cage': {
        this.backdrop('castle');
        this.img(480, 345, 'lyla-stand', 1.1);
        this.img(480, 352, 'cage', 1.1, false, false);
        this.img(740, 345, 'king', 1.2, true);
        for (const [x, k] of [[150, 'flower'], [210, 'flower-c']] as const) this.img(x, 345, k, 1.2, false, false);
        break;
      }
      case 'police-key': {
        this.backdrop('castle');
        this.img(360, 345, 'lyla-stand', 1.1);
        this.img(360, 352, 'cage', 1.1, false, false);
        const p = this.img(620, 345, 'police-cheer', 1.3, true); this.bob(p, 8, 400);
        const key = this.add.graphics();
        key.fillStyle(0xffd84d).lineStyle(3, 0xa87b10).fillCircle(0, 0, 16).strokeCircle(0, 0, 16).fillRect(14, -5, 46, 10).fillRect(46, 5, 8, 12).fillRect(34, 5, 8, 9);
        key.fillStyle(0xfff6c8).fillCircle(-5, -5, 5);
        key.setPosition(530, 190);
        this.stage.add(key);
        this.stage.add(this.add.image(530, 190, 'sparkle-gold').setScale(1.4));
        this.tweens.add({ targets: key, angle: 15, duration: 400, yoyo: true, repeat: -1 });
        break;
      }
      case 'rainbow-jump': {
        this.backdrop('rainbow');
        const l = this.img(480, 300, 'lyla-jump', 1.6, false, false);
        this.tweens.add({ targets: l, y: 220, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'zoo-warning': {
        this.backdrop('zoo');
        this.img(620, 345, 'tree', 1);
        const m = this.add.image(672, 155, 'monkey').setOrigin(0.5, 0.2); this.stage.add(m);
        this.tweens.add({ targets: m, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1 });
        this.img(300, 345, 'lyla-run1', 1.2);
        this.label(672, 70, '!', 70);
        break;
      }
      case 'workshop': {
        this.backdrop('town');
        const g = this.add.graphics();
        for (const [x, y, r] of [[200, 140, 50], [280, 210, 34], [760, 130, 44]] as const) {
          g.fillStyle(0x8f80c8).fillCircle(x, y, r);
          for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillRect(x + Math.cos(a) * r - 8, y + Math.sin(a) * r - 8, 16, 16); }
          g.fillStyle(0xe6dcff).fillCircle(x, y, r * 0.35);
        }
        this.stage.add(g);
        this.tweens.add({ targets: g, alpha: { from: 0.8, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
        this.img(560, 345, 'phone-big', 0.9);
        this.img(380, 345, 'lyla-stand', 1.1);
        break;
      }
      case 'bow-hint': {
        this.backdrop('meadow');
        this.img(300, 345, 'police', 1.2);
        const b = this.add.image(520, 200, 'bow').setAngle(-90).setScale(1.3); this.stage.add(b); this.bob(b, 10, 600);
        this.img(720, 345, 'lyla-cheer', 1.2);
        this.stage.add(this.add.image(820, 140, 'target').setScale(0.8));
        break;
      }
      case 'monster-appears': {
        this.backdrop('final');
        const m = this.img(640, 362, 'monster', 0.95);
        this.tweens.add({ targets: m, scaleY: 1, duration: 800, yoyo: true, repeat: -1 });
        this.img(250, 345, 'lyla-stand', 1.2);
        break;
      }
      case 'monster-friendly': {
        this.backdrop('final');
        const m = this.img(600, 345, 'monster-friendly', 1.6); this.bob(m, 18, 350);
        this.img(340, 345, 'lyla-cheer', 1.3);
        this.label(470, 80, '♥', 58, '#ff4f8b');
        break;
      }
      case 'robots-free': {
        this.backdrop('castle');
        const g = this.add.graphics();
        g.fillStyle(0x2a2a3a).fillRoundedRect(130, 150, 80, 130, 12).fillStyle(0x888899).fillRoundedRect(140, 162, 60, 96, 6);
        g.lineStyle(4, 0xffffff).lineBetween(150, 175, 190, 240).lineBetween(190, 175, 150, 240);
        this.stage.add(g);
        [380, 500, 620, 740].forEach((x, i) => { const b = this.img(x, 345, i % 2 ? 'lyla-cheer' : 'lyla-stand', 0.95); this.bob(b, 16, 300 + i * 60); });
        break;
      }
      case 'flowers-home': {
        this.backdrop('garden');
        for (let x = 90; x < 900; x += 60) this.img(x, 348, ['flower', 'flower-b', 'flower-c'][(x / 60) % 3 | 0], 1.2, false, false);
        const l = this.img(480, 336, 'lyla-cheer', 1.7); this.bob(l, 16, 380);
        this.img(680, 336, 'police-cheer', 1.2, true);
        this.label(480, 70, 'Hooray!', 46, '#c0307a');
        break;
      }
    }
  }
}
