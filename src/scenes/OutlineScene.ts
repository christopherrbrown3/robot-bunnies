import Phaser from 'phaser';
import levelsJson from '../content/levels.json';
import type { LevelOutline } from '../content/types';

const levels = levelsJson as LevelOutline[];

export class OutlineScene extends Phaser.Scene {
  private index = 0;

  constructor() {
    super('Outline');
  }

  create(): void {
    this.index = 0;
    this.renderCard();
  }

  private button(x: number, y: number, label: string, onTap: () => void): void {
    const hit = this.add.rectangle(x, y, 192, 64, 0x6546b8).setStrokeStyle(3, 0xffffff);
    hit.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '25px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    hit.on('pointerdown', onTap);
  }

  private renderCard(): void {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#f5e9ff');
    const level = levels[this.index];
    this.add.text(480, 40, 'THE 22-LEVEL PLAN', {
      fontFamily: 'Arial, sans-serif', fontSize: '37px', color: '#613b9b', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 94, `Level ${level.id} / 22: ${level.title}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#472b64', fontStyle: 'bold',
      wordWrap: { width: 900 }
    }).setOrigin(0.5);
    this.add.text(480, 137, `Location: ${level.setting}  •  ${level.provenance === 'proposed' ? 'Proposed' : 'Zoey-chosen anchor'}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#77518a'
    }).setOrigin(0.5);
    this.add.rectangle(480, 277, 860, 226, 0xffffff).setStrokeStyle(2, 0xd9b7eb);
    this.add.text(84, 174, level.story, {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#4f3761',
      wordWrap: { width: 790 }, lineSpacing: 6
    });
    this.add.text(84, 285, `PLAY: ${level.mechanic}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#644279',
      wordWrap: { width: 795 }
    });
    this.add.text(84, 345, `READING: ${level.reading}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#6a3d92',
      wordWrap: { width: 795 }
    });
    this.add.text(84, 383, `MATH: ${level.math}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#6a3d92',
      wordWrap: { width: 795 }
    });
    this.button(145, 477, 'BACK', () => this.scene.start('Title'));
    this.button(480, 477, 'PREVIOUS', () => {
      this.index = (this.index + levels.length - 1) % levels.length;
      this.renderCard();
    });
    this.button(813, 477, 'NEXT', () => {
      this.index = (this.index + 1) % levels.length;
      this.renderCard();
    });
    this.add.text(480, 531, 'Scaffold preview, not gameplay. Story & educational content may change.', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#6c5579'
    }).setOrigin(0.5, 1);
  }
}
