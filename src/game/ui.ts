/** Shared Phaser UI helpers: big, touch-friendly buttons, panels and readable text. */
import Phaser from 'phaser';
import { play } from '../audio/sfx';
import { RES } from './hidpi';
import { buttonTexture, panelTexture } from './art';

export const FONT = '"Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';

export function textStyle(size: number, color = '#3d2560', bold = true, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    // Rendered at the canvas density so text stays sharp through the 2× camera.
    resolution: RES,
    ...extra
  };
}

export interface ButtonOptions {
  color?: number;
  textColor?: string;
  fontSize?: number;
  radius?: number;
  stroke?: number;
}

/** A glossy rounded button that fires on release (pointer still over it). Min 44px tall. */
export function makeButton(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  label: string, onTap: () => void, opts: ButtonOptions = {}
): Phaser.GameObjects.Container {
  const color = opts.color ?? 0x7445c5;
  const normal = buttonTexture(scene, w, h, color, false);
  const pressed = buttonTexture(scene, w, h, color, true);
  // The texture has a 4px margin and a 6px drop lip; offset so the face is centred.
  const face = scene.add.image(0, 4, normal);
  const text = scene.add.text(0, 0, label, textStyle(opts.fontSize ?? 24, opts.textColor ?? '#ffffff', true, {
    align: 'center', shadow: { offsetX: 0, offsetY: 2, color: 'rgba(40,10,70,0.45)', blur: 3, fill: true }
  })).setOrigin(0.5);
  const container = scene.add.container(x, y, [face, text]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });
  let armed = false;
  const show = (down: boolean): void => { face.setTexture(down ? pressed : normal); text.y = down ? 4 : 0; };
  container.on('pointerdown', () => { armed = true; show(true); });
  container.on('pointerout', () => { armed = false; show(false); });
  container.on('pointerup', () => {
    show(false);
    if (!armed) return;
    armed = false;
    play('tap');
    onTap();
  });
  return container;
}

/** A soft rounded panel centred at (x, y). */
export function makePanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Image {
  // Texture adds a 20px margin for the drop shadow; the panel sits 2px above its centre.
  return scene.add.image(x, y + 2, panelTexture(scene, w, h));
}

/** A speech/caption bubble with an optional tail pointing down at (0, h/2+tail). */
export function makeBubble(scene: Phaser.Scene, x: number, y: number, message: string, width = 360, tail = true): Phaser.GameObjects.Container {
  const text = scene.add.text(0, 0, message, textStyle(20, '#3d2560', true, { align: 'center', wordWrap: { width: width - 36 } })).setOrigin(0.5);
  const h = Math.max(56, text.height + 26);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.15).fillRoundedRect(-width / 2 + 3, -h / 2 + 5, width, h, 18);
  g.fillStyle(0xffffff, 1).fillRoundedRect(-width / 2, -h / 2, width, h, 18);
  g.lineStyle(3, 0x8f6fc0, 1).strokeRoundedRect(-width / 2, -h / 2, width, h, 18);
  if (tail) {
    g.fillStyle(0xffffff, 1).fillTriangle(-14, h / 2 - 2, 14, h / 2 - 2, 0, h / 2 + 18);
    g.lineStyle(3, 0x8f6fc0, 1).lineBetween(-14, h / 2, 0, h / 2 + 18).lineBetween(14, h / 2, 0, h / 2 + 18);
  }
  return scene.add.container(x, y, [g, text]);
}

export function burst(scene: Phaser.Scene, x: number, y: number, count = 8, texture = 'sparkle', depth = 60): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const s = scene.add.image(x, y, texture).setDepth(depth).setScale(0.6 + Math.random() * 0.6);
    scene.tweens.add({
      targets: s, x: x + Math.cos(a) * (40 + Math.random() * 40), y: y + Math.sin(a) * (40 + Math.random() * 40),
      alpha: 0, angle: 180, scale: 0.2, duration: 520 + Math.random() * 200, ease: 'Cubic.easeOut',
      onComplete: () => s.destroy()
    });
  }
}

/**
 * Pin a screen-space overlay and EVERY descendant to the camera. Phaser hit-tests
 * interactive children with their own scroll factor, so setting it only on the
 * parent container leaves buttons tappable at the wrong place once the camera scrolls.
 */
export function pinToScreen(obj: Phaser.GameObjects.GameObject): void {
  const anyObj = obj as unknown as { setScrollFactor?: (x: number, y?: number) => unknown; list?: Phaser.GameObjects.GameObject[] };
  anyObj.setScrollFactor?.(0, 0);
  if (Array.isArray(anyObj.list)) for (const child of anyObj.list) pinToScreen(child);
}
