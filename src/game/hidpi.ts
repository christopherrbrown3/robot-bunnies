/**
 * Screen size and retina rendering. Scenes are laid out in 960×540 logical
 * coordinates (taller screens get extra room; see LOGICAL_HEIGHT), and on
 * high-density screens (every iPad since 2012) the canvas, textures and text
 * are drawn at 2× so edges stay sharp instead of being stretched by the
 * browser. Non-retina screens keep 1× (no extra cost). `?lowres` forces 1×.
 */
import Phaser from 'phaser';

export const LOGICAL_WIDTH = 960;
/** Every scene is laid out in a 960×540 (16:9) design area. */
export const DESIGN_HEIGHT = 540;

/**
 * The canvas is as tall as the screen's shape needs, so the game fills the
 * screen instead of sitting between bars: 540 on 16:9 screens, up to 720 on
 * 4:3 iPads. Worked out once from the landscape shape of the screen, so turning
 * the iPad never changes it (the game is played in landscape).
 */
export const LOGICAL_HEIGHT: number = (() => {
  if (typeof window === 'undefined') return DESIGN_HEIGHT;
  const w = window.innerWidth, h = window.innerHeight;
  if (!w || !h) return DESIGN_HEIGHT;
  const landscape = Math.max(w, h) / Math.min(w, h);
  return Math.round(Math.min(720, Math.max(DESIGN_HEIGHT, LOGICAL_WIDTH / landscape)));
})();

/** Height beyond the design area: 0 on 16:9 screens, 180 on a 4:3 iPad. */
export const EXTRA_HEIGHT = LOGICAL_HEIGHT - DESIGN_HEIGHT;

/** A height that covers the whole screen when centred on the design area (for full-screen dimmers). */
export const COVER_HEIGHT = DESIGN_HEIGHT + 2 * EXTRA_HEIGHT;

export const RES: number = (() => {
  if (typeof window === 'undefined') return 1;
  if (new URLSearchParams(window.location.search).has('lowres')) return 1;
  return (window.devicePixelRatio || 1) >= 1.5 ? 2 : 1;
})();

/**
 * Zoom the scene's camera so logical coordinates fill the high-res canvas.
 * Origin (0,0) keeps screen-fixed UI (scrollFactor 0) at its logical position,
 * so a HUD placed at the top stays at the top of the screen.
 *
 * On screens taller than 16:9 the 960×540 design area is placed in the middle
 * ('center', menus) or at the bottom ('bottom', levels: the extra space is sky).
 */
export function setupCamera(scene: Phaser.Scene, align: 'center' | 'bottom' = 'center'): Phaser.Cameras.Scene2D.Camera {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(RES);
  cam.setScroll(0, -designTop(align));
  return cam;
}

/** Where the design area's top edge sits on screen, in logical pixels. */
export function designTop(align: 'center' | 'bottom' = 'center'): number {
  return align === 'bottom' ? EXTRA_HEIGHT : EXTRA_HEIGHT / 2;
}

/**
 * Continue a centred menu's backdrop into the space above and below it on
 * taller screens, with the colours at its top and bottom edges.
 */
export function fillScreenBands(scene: Phaser.Scene, top: number, bottom: number): void {
  if (EXTRA_HEIGHT <= 0) return;
  const band = EXTRA_HEIGHT / 2;
  scene.add.rectangle(LOGICAL_WIDTH / 2, -band / 2, LOGICAL_WIDTH, band + 2, top).setDepth(-1000);
  scene.add.rectangle(LOGICAL_WIDTH / 2, DESIGN_HEIGHT + band / 2, LOGICAL_WIDTH, band + 2, bottom).setDepth(-1000);
}
