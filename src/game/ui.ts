/** Shared Phaser UI helpers: big, touch-friendly buttons and readable text. */
import Phaser from 'phaser';
import { play } from '../audio/sfx';

export const FONT = '"Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';

export function textStyle(size: number, color = '#3d2560', bold = true, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    resolution: Math.min(2, window.devicePixelRatio || 1),
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

/** A rounded button that fires on release (pointer still over it). Min 44px tall. */
export function makeButton(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  label: string, onTap: () => void, opts: ButtonOptions = {}
): Phaser.GameObjects.Container {
  const color = opts.color ?? 0x7445c5;
  const radius = opts.radius ?? Math.min(22, h / 2);
  const g = scene.add.graphics();
  const draw = (pressed: boolean): void => {
    g.clear();
    g.fillStyle(0x000000, 0.18).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 5), w, h, radius);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, radius);
    g.lineStyle(opts.stroke ?? 3, 0xffffff, 0.9).strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, radius);
  };
  draw(false);
  const text = scene.add.text(0, 0, label, textStyle(opts.fontSize ?? 24, opts.textColor ?? '#ffffff', true, { align: 'center' })).setOrigin(0.5);
  const container = scene.add.container(x, y, [g, text]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });
  let armed = false;
  container.on('pointerdown', () => { armed = true; draw(true); text.y = 2; });
  container.on('pointerout', () => { armed = false; draw(false); text.y = 0; });
  container.on('pointerup', () => {
    draw(false); text.y = 0;
    if (!armed) return;
    armed = false;
    play('tap');
    onTap();
  });
  return container;
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
