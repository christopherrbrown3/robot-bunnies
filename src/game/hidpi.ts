/**
 * Retina rendering. The game keeps its 960×540 logical coordinates, but on
 * high-density screens (every iPad since 2012) the canvas, textures and text
 * are drawn at 2× so edges stay sharp instead of being stretched by the
 * browser. Non-retina screens keep 1× (no extra cost). `?lowres` forces 1×.
 */
import Phaser from 'phaser';

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

export const RES: number = (() => {
  if (typeof window === 'undefined') return 1;
  if (new URLSearchParams(window.location.search).has('lowres')) return 1;
  return (window.devicePixelRatio || 1) >= 1.5 ? 2 : 1;
})();

/**
 * Zoom the scene's camera so logical coordinates fill the high-res canvas.
 * Origin (0,0) keeps screen-fixed UI (scrollFactor 0) at its logical position.
 */
export function setupCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(RES);
  return cam;
}
