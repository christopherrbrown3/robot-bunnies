import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OutlineScene } from './scenes/OutlineScene';
import './style.css';

// This milestone intentionally has no playable levels: title + level-outline preview only.
// Future implementation will add an accessible platform controller and educational gameplay.
registerSW({ immediate: true });

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#f7edff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { pixelArt: false, antialias: true },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, OutlineScene]
});
