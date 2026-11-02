import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  private button(x: number, y: number, width: number, label: string, event: string, color = 0x6942c9): void {
    const surface = this.add.rectangle(x, y, width, 63, color).setStrokeStyle(3, 0xffffff);
    surface.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    surface.on('pointerdown', () => {
      if (event === 'Outline') this.scene.start('Outline');
      else window.dispatchEvent(new CustomEvent(event, { detail: { mode: 'quick' } }));
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#f9ecff');
    const art = this.add.graphics();
    art.fillStyle(0x9ddaf8).fillRect(0, 0, 960, 300);
    art.fillStyle(0xe8c4ff).fillRect(0, 300, 960, 240);
    art.fillStyle(0xf985c8).fillRoundedRect(75, 130, 220, 200, 14);
    art.fillStyle(0xffb9df).fillRect(105, 90, 55, 70).fillRect(210, 90, 55, 70);
    art.fillStyle(0xf4d8ff).fillTriangle(95, 92, 133, 45, 170, 92);
    art.fillTriangle(199, 92, 237, 45, 276, 92);
    art.fillStyle(0x7536a6).fillRoundedRect(161, 245, 50, 85, 14);
    // Zoey's Lyla is a fluffy white bunny. She must not visibly look robotic.
    art.fillStyle(0xffffff);
    art.fillEllipse(740, 321, 125, 110);
    art.fillEllipse(706, 237, 36, 105);
    art.fillEllipse(763, 235, 36, 105);
    art.fillStyle(0xffb8d8);
    art.fillEllipse(706, 238, 14, 68);
    art.fillEllipse(763, 236, 14, 68);
    art.fillStyle(0xffffff).fillCircle(734, 298, 61);
    art.fillStyle(0x39244b).fillCircle(717, 299, 5).fillCircle(750, 299, 5);
    art.fillStyle(0xf98dbd).fillCircle(735, 314, 7);
    art.fillStyle(0xff73b8).fillRoundedRect(710, 344, 67, 30, 8);

    this.add.text(480, 64, 'ROBOT BUNNIES', {
      fontFamily: 'Arial, sans-serif', fontSize: '60px', color: '#632d93', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 113, "Lyla's Spelling Quest", {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#6a387c', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 350, 'Designed by Zoey · 22 story levels · weekly spelling words', {
      fontFamily: 'Arial, sans-serif', fontSize: '21px', color: '#473053'
    }).setOrigin(0.5);

    this.button(480, 422, 475, '🌸 PLAY SPELLING QUEST', 'robot-bunnies:open-spelling');
    this.button(326, 498, 295, 'PARENT CORNER', 'robot-bunnies:open-parent', 0x8f53b5);
    this.button(670, 498, 295, '22-LEVEL PLAN', 'Outline', 0x8f53b5);
    this.add.text(12, 531, 'Spelling practice is playable. Story platform levels are still planned.', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#5e4671'
    }).setOrigin(0, 1);
  }
}
