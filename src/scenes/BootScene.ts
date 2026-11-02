import Phaser from 'phaser';
import { generateCoreArt } from '../game/art';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateCoreArt(this);
    this.scene.start('Title');
  }
}
