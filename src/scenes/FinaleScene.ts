/** After the last level: celebrate, summarize this run gently, offer a fresh playthrough. */
import Phaser from 'phaser';
import { EXTRA_HEIGHT, fillScreenBands, setupCamera } from '../game/hidpi';
import { burst, makeButton, makePanel, textStyle } from '../game/ui';
import { addGround, ensureThemeArt } from '../game/themes';
import { prefersReducedMotion } from '../audio/prefs';
import { PARENT_EVENT, startAdventure } from '../game/flow';
import { CAMPAIGN_LEVEL_COUNT, coveredCurrentWords, peekCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';
import { isSecure } from '../spelling/mastery';
import { play } from '../audio/sfx';

export class FinaleScene extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create(): void {
    setupCamera(this);
    this.cameras.main.setBackgroundColor('#ffe6f6');
    const campaign = peekCampaign();
    const week = getActiveWeek(loadSpellingData());
    const art = ensureThemeArt(this, 'rainbow');
    this.add.image(480, 540, art.far).setOrigin(0.5, 1); // taller on taller screens (extra sky on top)
    fillScreenBands(this, 0xfff1fa, 0x6a4bd0);
    this.add.image(480, 370, art.mid);
    addGround(this, art.ground, 480, 515, 960);
    if (!prefersReducedMotion()) {
      // Confetti shower.
      this.add.particles(0, 0, 'confetti', {
        x: { min: 0, max: 960 }, y: -10 - EXTRA_HEIGHT / 2, lifespan: 5200, speedY: { min: 60, max: 130 }, speedX: { min: -40, max: 40 },
        rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.4 }, frequency: 70,
        tint: [0xff6fb5, 0xffd84d, 0x5fdc8a, 0x5fbfff, 0xa37bff, 0xff9f43]
      });
    }
    makePanel(this, 580, 236, 680, 300);
    this.add.text(480, 52, `You finished all ${CAMPAIGN_LEVEL_COUNT} levels!`, textStyle(42, '#7a2fb0', true, {
      stroke: '#ffffff', strokeThickness: 10, shadow: { offsetX: 0, offsetY: 4, color: 'rgba(90,20,120,0.35)', blur: 8, fill: true, stroke: true }
    })).setOrigin(0.5);
    this.add.image(130, 472, 'shadow').setScale(1.7, 1.4);
    const lyla = this.add.image(130, 470, 'lyla-cheer').setOrigin(0.5, 1).setScale(1.6);
    this.tweens.add({ targets: lyla, y: 440, duration: 380, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
    play('portal');
    this.time.addEvent({ delay: 700, repeat: 6, callback: () => burst(this, 200 + Math.random() * 560, 80 + Math.random() * 200, 10, 'sparkle-gold') });

    const lines: string[] = [];
    if (campaign) {
      const results = campaign.results.filter(r => r !== null);
      const firstTry = results.filter(r => r === 'independent').length;
      lines.push(`🌸 ${campaign.totalFlowers} flowers collected`);
      lines.push(`✏️ ${results.length} spelling words practiced · ${firstTry} spelled all by yourself`);
      if (week) {
        const covered = coveredCurrentWords(campaign).filter(w => week.words.includes(w)).length;
        lines.push(`📋 ${covered} of ${week.words.length} words from this week's list`);
        const keep = week.words.filter(w => !isSecure(week.progress[w]));
        if (keep.length) lines.push(`Words to keep practicing next time: ${keep.slice(0, 8).join(', ')}${keep.length > 8 ? '…' : ''}`);
        else lines.push('Every word on this week\'s list is feeling strong. Amazing!');
      }
    }
    this.add.text(580, 230, lines.join('\n\n'), textStyle(21, '#4a2a6a', true, { align: 'left', wordWrap: { width: 620 }, lineSpacing: 2 })).setOrigin(0.5);

    makeButton(this, 560, 432, 330, 66, `▶ Play all ${CAMPAIGN_LEVEL_COUNT} again`, () => startAdventure(this), { color: 0x7445c5, fontSize: 25 });
    makeButton(this, 400, 505, 160, 52, '🏠 Home', () => this.scene.start('Title'), { color: 0x6a5080, fontSize: 20 });
    makeButton(this, 720, 505, 180, 52, 'Grown-ups', () => window.dispatchEvent(new Event(PARENT_EVENT)), { color: 0x8f53b5, fontSize: 20 });
  }
}
