/** The adventure map: progress, level info and the Play button. */
import Phaser from 'phaser';
import { COVER_HEIGHT, fillScreenBands, setupCamera } from '../game/hidpi';
import { burst, makeButton, makePanel, textStyle } from '../game/ui';
import { PARENT_EVENT, addUpdateButton, levels, refreshOnDataChange, startAdventure } from '../game/flow';
import { CAMPAIGN_LEVEL_COUNT, getOrStartCampaign, type SavedCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';
import { loadPrefs, prefersReducedMotion } from '../audio/prefs';
import { generateMapArt, mapNodePositions } from '../game/sceneArt';
import { CUTSCENES, STORYBOOK_ORDER } from '../game/cutscenes';

export class MapScene extends Phaser.Scene {
  private info!: Phaser.GameObjects.Text;
  private infoSub!: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Map');
  }

  create(): void {
    setupCamera(this);
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
    const current = Math.min(campaign.nextLevelIndex, CAMPAIGN_LEVEL_COUNT - 1);

    generateMapArt(this);
    this.add.image(480, 270, 'map-bg');
    fillScreenBands(this, 0xffeaf7, 0xa6dca0);

    this.add.text(30, 28, "Lyla's Adventure Map", textStyle(30, '#6e3b9d', true, { stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0, 0.5);
    this.add.text(30, 58, `${week?.label ?? ''} · Adventure #${campaign.runNumber + 1}`, textStyle(16, '#7a5a94', false)).setOrigin(0, 0.5);
    this.add.image(866, 42, 'hud-pill');
    this.add.image(818, 42, 'flower-icon');
    this.add.text(842, 42, String(campaign.totalFlowers + (campaign.level?.flowers ?? 0)), textStyle(26, '#c0307a')).setOrigin(0, 0.5);

    const positions = mapNodePositions();
    const calm = prefersReducedMotion();
    positions.forEach(([x, y], i) => {
      const done = i < campaign.nextLevelIndex;
      const isCurrent = i === current && campaign.nextLevelIndex < CAMPAIGN_LEVEL_COUNT;
      const node = this.add.image(x, y, done ? 'node-done' : isCurrent ? 'node-current' : 'node-locked').setScale(isCurrent ? 1.12 : 0.95);
      node.setInteractive(new Phaser.Geom.Circle(42, 42, 40), Phaser.Geom.Circle.Contains);
      const num = this.add.text(x, y, String(i + 1), textStyle(isCurrent ? 26 : 22, done || isCurrent ? '#ffffff' : '#7a5a94', true,
        done || isCurrent ? { shadow: { offsetX: 0, offsetY: 2, color: 'rgba(60,10,60,0.4)', blur: 3, fill: true } } : {})).setOrigin(0.5);
      if (done) {
        num.setY(y + 14).setFontSize(15);
        this.add.image(x, y - 6, 'flower-icon').setScale(0.7);
      }
      if (i === CAMPAIGN_LEVEL_COUNT - 1) this.add.text(x, y + 46, 'Monster!', textStyle(14, '#7a2fb0', true, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5);
      if (levels[i].play.scene === 'christmas') this.add.text(x, y + 46, 'Christmas!', textStyle(14, '#c81e3a', true, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5);
      if (i === 0) this.add.text(x, y + 48, 'Castle', textStyle(14, '#c0307a', true, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5);
      if (isCurrent) {
        if (!calm) this.tweens.add({ targets: node, scale: 1.2, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const shadow = this.add.image(x, y - 26, 'shadow').setScale(0.45, 0.5);
        const lyla = this.add.image(x, y - 28, 'lyla-stand').setOrigin(0.5, 1).setScale(0.48);
        if (!calm) {
          this.tweens.add({ targets: lyla, y: y - 40, duration: 400, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
          this.tweens.add({ targets: shadow, scaleX: 0.3, alpha: 0.5, duration: 400, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
        }
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
    addUpdateButton(this, 590, 42, 270);
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
    const dim = this.add.rectangle(480, 270, 960, COVER_HEIGHT, 0x1e1238, 0.6).setInteractive();
    const panel = makePanel(this, 480, 270, 600, 440);
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
