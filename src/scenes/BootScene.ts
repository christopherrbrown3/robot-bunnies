import Phaser from 'phaser';
import { generateCoreArt } from '../game/art';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateCoreArt(this);
    // The game is running: clear the loading message and allow the portrait hint.
    (window as unknown as { __rbStarted?: boolean }).__rbStarted = true;
    document.getElementById('boot-status')?.remove();
    document.body.classList.add('game-ready');
    this.scene.start('Title');
  }
}
