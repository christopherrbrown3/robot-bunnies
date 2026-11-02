/** The 22-level adventure map: progress, level info and the Play button. */
import Phaser from 'phaser';
import { burst, makeButton, textStyle } from '../game/ui';
import { PARENT_EVENT, levels, refreshOnDataChange, startAdventure } from '../game/flow';
import { getOrStartCampaign, type SavedCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';
import { loadPrefs } from '../audio/prefs';
import { CUTSCENES, STORYBOOK_ORDER } from '../game/cutscenes';

export class MapScene extends Phaser.Scene {
  private info!: Phaser.GameObjects.Text;
  private infoSub!: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Map');
  }

  create(): void {
    refreshOnDataChange(this);
    this.overlay = undefined;
    let campaign: SavedCampaign;
    try {
      campaign = getOrStartCampaign();
    } catch {
      this.scene.start('Title');
      window.dispatchEvent(new Event(PARENT_EVENT));
      return;
    }
    const week = getActiveWeek(loadSpellingData());
    const current = Math.min(campaign.nextLevelIndex, 21);

    const g = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffe6f6), Phaser.Display.Color.ValueToColor(0xd9ecff), 20, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)).fillRect(0, 27 * i, 960, 28);
    }

    this.add.text(30, 28, "Lyla's Adventure Map", textStyle(30, '#6e3b9d')).setOrigin(0, 0.5);
    this.add.text(30, 58, `${week?.label ?? ''} · Adventure #${campaign.runNumber + 1}`, textStyle(16, '#7a5a94', false)).setOrigin(0, 0.5);
    const pill = this.add.graphics();
    pill.fillStyle(0xffffff, 0.95).fillRoundedRect(800, 18, 140, 48, 24).lineStyle(3, 0xff7ac0).strokeRoundedRect(800, 18, 140, 48, 24);
    this.add.image(830, 42, 'flower-icon');
    this.add.text(854, 42, String(campaign.totalFlowers + (campaign.level?.flowers ?? 0)), textStyle(26, '#c0307a')).setOrigin(0, 0.5);

    // Snake path: 8 / 7 / 7 nodes.
    const positions: Array<[number, number]> = [];
    for (let i = 0; i < 22; i++) {
      if (i < 8) positions.push([90 + i * 111, 158]);
      else if (i < 15) positions.push([835 - (i - 8) * 120, 270]);
      else positions.push([115 + (i - 15) * 120, 382]);
    }
    const path = this.add.graphics();
    path.lineStyle(10, 0xffffff, 0.9);
    path.beginPath();
    positions.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.strokePath();
    path.lineStyle(4, 0xd9b7eb, 1);
    path.beginPath();
    positions.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.strokePath();

    positions.forEach(([x, y], i) => {
      const done = i < campaign.nextLevelIndex;
      const isCurrent = i === current && campaign.nextLevelIndex < 22;
      const fill = done ? 0xff7ac0 : isCurrent ? 0x7445c5 : 0xffffff;
      const node = this.add.circle(x, y, isCurrent ? 34 : 29, fill).setStrokeStyle(4, done ? 0xffffff : 0x9a7ac0);
      node.setInteractive({ useHandCursor: true });
      const num = this.add.text(x, y, String(i + 1), textStyle(isCurrent ? 26 : 22, done || isCurrent ? '#ffffff' : '#7a5a94')).setOrigin(0.5);
      if (done) {
        num.setY(y + 14).setFontSize(15);
        this.add.image(x, y - 6, 'flower-icon').setScale(0.7);
      }
      if (i === 21) this.add.text(x, y + 46, 'Monster!', textStyle(14, '#7a2fb0')).setOrigin(0.5);
      if (i === 0) this.add.text(x, y + 48, 'Castle', textStyle(14, '#c0307a')).setOrigin(0.5);
      if (isCurrent) {
        this.tweens.add({ targets: node, scale: 1.1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const lyla = this.add.image(x, y - 30, 'lyla-stand').setOrigin(0.5, 1).setScale(0.45);
        this.tweens.add({ targets: lyla, y: y - 38, duration: 400, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      }
      node.on('pointerup', () => this.showInfo(i, campaign));
    });

    this.info = this.add.text(480, 440, '', textStyle(22, '#4a2a6a', true, { align: 'center' })).setOrigin(0.5);
    this.infoSub = this.add.text(480, 461, '', textStyle(16, '#6a5080', false, { align: 'center', wordWrap: { width: 860 } })).setOrigin(0.5, 0);
    this.showInfo(current, campaign);

    makeButton(this, 80, 508, 120, 52, '🏠', () => this.scene.start('Title'), { color: 0x6a5080, fontSize: 26 });
    makeButton(this, 230, 508, 160, 52, '📖 Stories', () => this.openStorybook(), { color: 0x8f53b5, fontSize: 20 });
    makeButton(this, 400, 508, 160, 52, 'Grown-ups', () => window.dispatchEvent(new Event(PARENT_EVENT)), { color: 0x8f53b5, fontSize: 20 });
    const label = campaign.level ? `▶ Continue Level ${current + 1}` : `▶ Play Level ${current + 1}`;
    makeButton(this, 735, 506, 360, 58, label, () => startAdventure(this), { color: 0x7445c5, fontSize: 26 });
    if (campaign.nextLevelIndex === 0 && !campaign.level && campaign.runNumber > 0) burst(this, 90, 130, 10, 'sparkle-gold');
  }

  private showInfo(i: number, campaign: SavedCampaign): void {
    const level = levels[i];
    const status = i < campaign.nextLevelIndex ? '✓ Done' : i === campaign.nextLevelIndex ? 'Next up!' : 'Coming up';
    this.info.setText(`Level ${level.id}: ${level.title}  ·  ${status}`);
    this.infoSub.setText(`${level.setting}. ${level.play.trigger.title}`);
  }

  private openStorybook(): void {
    if (this.overlay) return;
    const seen = loadPrefs().seenCutscenes;
    const root = this.add.container(0, 0).setDepth(100);
    this.overlay = root;
    const dim = this.add.rectangle(480, 270, 960, 540, 0x1e1238, 0.6).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0xfff6ff, 1).fillRoundedRect(180, 50, 600, 440, 26).lineStyle(5, 0xf2bde4).strokeRoundedRect(180, 50, 600, 440, 26);
    root.add([dim, panel, this.add.text(480, 92, '📖 Storybook', textStyle(32, '#6e3b9d')).setOrigin(0.5)]);
    const available = STORYBOOK_ORDER.filter(id => seen.includes(id));
    if (!available.length) {
      root.add(this.add.text(480, 250, 'Stories you see during the adventure\nwill be saved here to watch again.', textStyle(20, '#6a5080', true, { align: 'center' })).setOrigin(0.5));
    }
    available.forEach((id, k) => {
      const col = k % 2, row = Math.floor(k / 2);
      root.add(makeButton(this, 340 + col * 280, 160 + row * 70, 250, 56, CUTSCENES[id].title, () => {
        this.scene.start('Cutscene', { id, next: 'Map' });
      }, { color: 0x7445c5, fontSize: 19 }));
    });
    root.add(makeButton(this, 480, 448, 200, 54, 'Close', () => { root.destroy(); this.overlay = undefined; }, { color: 0x6a5080, fontSize: 21 }));
  }
}
