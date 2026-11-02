/** After all 22 levels: celebrate, summarize this run gently, offer a fresh playthrough. */
import Phaser from 'phaser';
import { burst, makeButton, textStyle } from '../game/ui';
import { PARENT_EVENT, startAdventure } from '../game/flow';
import { coveredCurrentWords, peekCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';
import { isSecure } from '../spelling/mastery';
import { play } from '../audio/sfx';

export class FinaleScene extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#ffe6f6');
    const campaign = peekCampaign();
    const week = getActiveWeek(loadSpellingData());
    const g = this.add.graphics();
    [0xff5a5a, 0xff9f43, 0xffd84d, 0x4fd17a, 0x4fb3ff, 0x9b6bff].forEach((c, i) => { g.lineStyle(18, c, 0.8).beginPath(); g.arc(480, 560, 460 - i * 18, Math.PI, 0); g.strokePath(); });
    this.add.text(480, 60, 'You finished all 22 levels!', textStyle(42, '#7a2fb0', true, { stroke: '#ffffff', strokeThickness: 9 })).setOrigin(0.5);
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

    makeButton(this, 560, 430, 330, 66, '▶ Play all 22 again', () => startAdventure(this), { color: 0x7445c5, fontSize: 25 });
    makeButton(this, 400, 505, 160, 52, '🏠 Home', () => this.scene.start('Title'), { color: 0x6a5080, fontSize: 20 });
    makeButton(this, 720, 505, 180, 52, 'Grown-ups', () => window.dispatchEvent(new Event(PARENT_EVENT)), { color: 0x8f53b5, fontSize: 20 });
  }
}
