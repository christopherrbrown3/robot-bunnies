import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { GameScene } from './scenes/GameScene';
import { FinaleScene } from './scenes/FinaleScene';
import { initializeParentCorner } from './ui/ParentCorner';
import { initializePracticeSession } from './ui/PracticeSession';
import { unlockAudio } from './audio/sfx';
import { unlockSpeech } from './audio/speech';
import { unlockWordAudio } from './audio/wordAudio';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, RES } from './game/hidpi';
import './style.css';

initializeParentCorner();
initializePracticeSession();
registerSW({ immediate: true });

// iPad Safari only allows sound after a tap: prime every audio path on the first gestures.
let unlocks = 0;
const unlock = (): void => {
  unlockAudio();
  if (unlocks === 0) { unlockSpeech(); unlockWordAudio(); }
  if (++unlocks >= 3) {
    for (const type of ['touchend', 'click', 'keydown']) document.removeEventListener(type, unlock, true);
  }
};
for (const type of ['touchend', 'click', 'keydown']) document.addEventListener(type, unlock, true);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  // Logical 960×540, rendered at 2× on retina screens (each scene's camera zooms by RES).
  width: LOGICAL_WIDTH * RES,
  height: LOGICAL_HEIGHT * RES,
  backgroundColor: '#f7edff',
  scale: {
    mode: Phaser.Scale.FIT,
    // #app is a centered flexbox; Phaser centering on top of it doubled the offset in portrait.
    autoCenter: Phaser.Scale.NO_CENTER
  },
  render: { pixelArt: false, antialias: true },
  // windowEvents off: taps on DOM overlays (Parent Corner, letter tiles) must never reach game objects underneath.
  input: { activePointers: 2, windowEvents: false },
  audio: { noAudio: true },
  disableContextMenu: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1500 }, debug: false } },
  scene: [BootScene, TitleScene, MapScene, CutsceneScene, GameScene, FinaleScene]
});

// Automated playtesting hook (only with ?debug in the URL).
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __rbGame: Phaser.Game }).__rbGame = game;
}

// Parent Corner's "Play" button opens the adventure map from wherever the game is.
window.addEventListener('robot-bunnies:play', () => {
  const active = game.scene.getScenes(true)[0];
  if (active) active.scene.start('Map');
});
