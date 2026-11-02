import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OutlineScene } from './scenes/OutlineScene';
import { initializeParentCorner } from './ui/ParentCorner';
import { initializeSpellingQuest } from './ui/SpellingQuest';
import './style.css';

// The home screen and weekly spelling practice are playable.
// The 22 platform/story levels remain planned, not implemented.
initializeParentCorner();
initializeSpellingQuest();
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
