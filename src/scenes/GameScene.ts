/**
 * One playable story level (FINAL_SPEC §2, §6).
 *
 * RUNNING ── reach story object ──▶ SPELLING (world frozen) ──▶ CHEER ──▶ RUNNING
 *    │                                                        (grace period)
 *    ├─ capture hazard ─▶ RESCUE (Ridensee, automatic) ─▶ RUNNING at the same spot
 *    ├─ paint door ─▶ PUZZLE (rainbow order) ─▶ RUNNING
 *    └─ portal ─▶ DONE (level saved complete)
 *
 * No timers, lives, game over or lost flowers. Obstacles bounce Lyla back a
 * little; after a couple of bumps she gets an automatic helper hop.
 */
import Phaser from 'phaser';
import levelsJson from '../content/levels.json';
import type { LevelOutline } from '../content/types';
import { buildLayout, GROUND_Y, LYLA_START_X, type Collectible, type Hazard, type LevelLayout } from '../game/levelPlan';
import { ParallaxLayer, THEMES, addGround, ensureThemeArt, type Ambient, type Theme } from '../game/themes';
import { BUNNY_HEADROOM, blockTexture, gateTexture, platformTexture } from '../game/art';
import { ELF_KEYS } from '../game/christmasArt';
import { burst, makeBubble, makeButton, makePanel, pinToScreen, textStyle } from '../game/ui';
import { COVER_HEIGHT, EXTRA_HEIGHT, LOGICAL_HEIGHT, setupCamera } from '../game/hidpi';
import {
  CAMPAIGN_LEVEL_COUNT, addCampaignFlag, getOrStartCampaign, markCampaignLevelComplete,
  prioritizeCurrentWeek, resolveCampaignPrompt, saveLevelProgress, type LevelProgress, type SavedCampaign
} from '../spelling/campaign';
import { punctuationInLists } from '../spelling/store';
import { presentSpelling } from '../ui/SpellingPanel';
import { play, type Sfx } from '../audio/sfx';
import { loadPrefs, prefersReducedMotion, savePrefs } from '../audio/prefs';
import { speak, stopSpeech } from '../audio/speech';

const levels = levelsJson as LevelOutline[];

type State = 'intro' | 'running' | 'spelling' | 'cheer' | 'puzzle' | 'rescue' | 'paused' | 'boss' | 'done';

const RUN_SPEED = 215;
const DANGER_SPEED = 125;
const JUMP_VELOCITY = -760;
const SMALL_SCALE = 0.36;
/** Lyla's position on screen while the camera follows her (logical px from the left). */
const FOLLOW_X = 310;

/** Things on the ground to tap and pick up so Lyla does not trip. */
interface PickupStyle { keys: string[]; tip: string; picked: string; oops: string; sound: Sfx }
const BEADS: PickupStyle = {
  keys: ['bead-a', 'bead-b', 'bead-c'], sound: 'bead',
  tip: 'Tap the beads to pick them up so Lyla does not trip!', picked: 'Bead picked up!', oops: 'Oops! Tap beads to pick them up!'
};
/** In the Christmas village the "beads" are jingle bells that fell off a sleigh. */
const BELLS: PickupStyle = {
  keys: ['xmas-bell-a', 'xmas-bell-b', 'xmas-bell-c'], sound: 'jingle',
  tip: 'Jingle bells fell off the sleigh! Tap them so Lyla does not trip!', picked: 'Jingle, jingle!', oops: 'Oops! Tap the bells to pick them up!'
};

interface ElfRuntime { img: Phaser.GameObjects.Image; cheer: string; hello: string; greeted: boolean }

interface HazardRuntime {
  data: Hazard;
  state: 'idle' | 'warn' | 'attack' | 'done';
  parts: Phaser.GameObjects.GameObject[];
  actor?: Phaser.GameObjects.Image;
  alert?: Phaser.GameObjects.Text;
  handTween?: Phaser.Tweens.BaseTween;
  bumps: number;
}

export class GameScene extends Phaser.Scene {
  private levelIndex = 0;
  private level!: LevelOutline;
  private layout!: LevelLayout;
  private theme!: Theme;
  private campaign!: SavedCampaign;
  private progress!: LevelProgress;

  private state: State = 'intro';
  private stateBeforePause: State = 'running';
  private lyla!: Phaser.Physics.Arcade.Sprite;
  private far!: ParallaxLayer;
  private mid!: ParallaxLayer;
  private fg!: ParallaxLayer;
  private shadow!: Phaser.GameObjects.Image;
  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Camera scroll target while locked (boss arena); null follows Lyla. */
  private camLockX: number | null = null;
  private wasOnGround = true;
  private lastDustAt = 0;
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;

  private flowers: Array<{ data: Collectible; img: Phaser.GameObjects.Image }> = [];
  private beads: Array<{ data: Collectible; img: Phaser.GameObjects.Image; picked: boolean }> = [];
  private checkpoints: Array<{ x: number; img: Phaser.GameObjects.Image; passed: boolean }> = [];
  private hazards: HazardRuntime[] = [];
  private triggerParts: Phaser.GameObjects.GameObject[] = [];
  private triggerMain?: Phaser.GameObjects.Image;
  private paintDoor?: Phaser.GameObjects.Image;
  private portal!: Phaser.GameObjects.Image;
  private police?: Phaser.GameObjects.Image;
  private monster?: Phaser.GameObjects.Image;
  private bossStars: Phaser.GameObjects.Image[] = [];
  private pickups: PickupStyle = BEADS;
  private giftLid?: Phaser.GameObjects.Image;
  private elves: ElfRuntime[] = [];

  private flowerCount = 0;
  private collected = new Set<string>();
  private flags = new Set<string>();
  private small = false;
  private shrinkTween?: Phaser.Tweens.Tween;
  private safeSince = 0;
  private graceUntil = 0;
  private bumpUntil = 0;
  private jumpRequestedAt = -9999;
  private lastGroundedAt = 0;
  private bumpCounts = new Map<string, number>();
  private autoJumpFor: string | null = null;
  private tipsShown = new Set<string>();

  private hud!: { flowers: Phaser.GameObjects.Text; marker: Phaser.GameObjects.Arc; barX: number; barW: number; icon: Phaser.GameObjects.Image };
  private dangerRing!: Phaser.GameObjects.Arc;
  private dangerBubble?: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private visibilityHandler = (): void => { if (document.hidden) this.openPause(); };

  constructor() {
    super('Game');
  }

  init(): void {
    this.flowers = []; this.beads = []; this.checkpoints = []; this.hazards = [];
    this.triggerParts = []; this.bossStars = []; this.elves = []; this.giftLid = undefined;
    this.collected = new Set(); this.flags = new Set(); this.bumpCounts = new Map(); this.tipsShown = new Set();
    this.small = false; this.autoJumpFor = null; this.overlay = undefined; this.dangerBubble = undefined;
    this.monster = undefined; this.police = undefined; this.paintDoor = undefined; this.triggerMain = undefined;
    this.graceUntil = 0; this.bumpUntil = 0; this.jumpRequestedAt = -9999; this.flowerCount = 0;
    this.camLockX = null; this.wasOnGround = true; this.lastDustAt = 0; this.dust = undefined;
    this.state = 'intro';
  }

  create(): void {
    try {
      this.campaign = getOrStartCampaign();
    } catch {
      this.scene.start('Title');
      return;
    }
    if (this.campaign.nextLevelIndex >= CAMPAIGN_LEVEL_COUNT) {
      this.scene.start('Finale');
      return;
    }
    this.levelIndex = this.campaign.nextLevelIndex;
    this.level = levels[this.levelIndex];
    this.layout = buildLayout(this.level);
    this.theme = THEMES[this.level.play.scene];
    this.pickups = this.level.play.scene === 'christmas' ? BELLS : BEADS;
    this.progress = this.campaign.level ?? {
      levelIndex: this.levelIndex, promptResolved: false, checkpointX: null, flowers: 0, collected: [], flags: []
    };
    this.flowerCount = this.progress.flowers;
    this.collected = new Set(this.progress.collected);
    this.flags = new Set(this.progress.flags);

    // Levels after "Finding the Bow" need the bow even if a run somehow skipped it.
    const bowIndex = levels.findIndex(l => l.play.trigger.kind === 'bow');
    if (bowIndex >= 0 && this.levelIndex > bowIndex && !this.campaign.flags.includes('bow')) {
      this.campaign = addCampaignFlag(this.campaign, this.levelIndex, 'bow');
    }

    this.physics.world.setBounds(0, 0, this.layout.length, 540);
    this.physics.world.gravity.y = 1500;
    // On taller screens (4:3 iPads) the level sits at the bottom and the extra room is sky.
    setupCamera(this, 'bottom').setBackgroundColor(this.theme.sky[2]);

    this.buildBackground();
    this.buildWorld();
    this.buildLyla();
    this.buildHud();
    this.bindInput();
    this.updateCamera(0, true);

    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      stopSpeech();
      this.anims.resumeAll();
    });

    this.cameras.main.fadeIn(350, 255, 255, 255);
    this.startLevel();
  }

  // ------------------------------------------------------------------ build

  private buildBackground(): void {
    const art = ensureThemeArt(this, this.level.play.scene);
    // Screen-fixed backdrop layers sit EXTRA_HEIGHT lower to line up with the world; the far
    // layer is that much taller, so its sky reaches the top of the screen.
    this.far = new ParallaxLayer(this, art.far, (540 + EXTRA_HEIGHT) / 2, -30);
    this.mid = new ParallaxLayer(this, art.mid, GROUND_Y - 100 + EXTRA_HEIGHT, -20);
    addGround(this, art.ground, this.layout.length / 2, GROUND_Y + 45, this.layout.length).setDepth(5);
    // Soft contact shadow where the ground meets the world above it.
    this.add.rectangle(this.layout.length / 2, GROUND_Y - 3, this.layout.length, 6, 0x000000, 0.06).setDepth(4);
    this.fg = new ParallaxLayer(this, art.fg, 540 - 35 + EXTRA_HEIGHT, 45);
    this.buildAmbient(this.theme.ambient, this.theme.ambientTint);
    const ground = this.add.zone(this.layout.length / 2, GROUND_Y + 45, this.layout.length, 90);
    this.physics.add.existing(ground, true);
    this.groundZone = ground;
  }

  private groundZone!: Phaser.GameObjects.Zone;

  private buildWorld(): void {
    const L = this.layout;
    const checkpointX = this.progress.checkpointX ?? 0;

    this.obstacleGroup = this.physics.add.staticGroup();
    for (const o of L.obstacles) {
      const key = blockTexture(this, this.level.play.scene, o.w, o.h, this.theme.prop.style, this.theme.prop.colors);
      const img = this.obstacleGroup.create(o.x + o.w / 2, GROUND_Y - o.h / 2, key) as Phaser.Physics.Arcade.Image;
      img.setDepth(10).setData('id', o.id);
      img.refreshBody();
    }

    this.platformGroup = this.physics.add.staticGroup();
    for (const p of L.platforms) {
      const key = platformTexture(this, this.level.play.scene, p.w, this.theme.platform.style, this.theme.platform.colors);
      const img = this.platformGroup.create(p.x + p.w / 2, p.y + 15, key) as Phaser.Physics.Arcade.Image;
      img.setDepth(9);
      img.refreshBody();
      const body = img.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
    }

    const flowerKeys = ['flower', 'flower-b', 'flower-c'];
    L.flowers.forEach((f, i) => {
      if (this.collected.has(f.id)) return;
      const img = this.add.image(f.x, f.y, flowerKeys[i % 3]).setDepth(12);
      this.tweens.add({ targets: img, y: f.y - 5, duration: 900 + (i % 5) * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.flowers.push({ data: f, img });
    });

    L.beads.forEach((b, i) => {
      if (this.collected.has(b.id)) return;
      const img = this.add.image(b.x, b.y, this.pickups.keys[i % 3]).setDepth(13);
      img.setInteractive(new Phaser.Geom.Circle(img.width / 2, img.height / 2, 46), Phaser.Geom.Circle.Contains);
      const entry = { data: b, img, picked: false };
      // One tap scoops up the whole little cluster of beads.
      img.on('pointerdown', () => {
        for (const other of this.beads) if (Math.abs(other.data.x - b.x) < 70) this.pickBead(other, true);
      });
      this.beads.push(entry);
    });

    for (const x of L.checkpoints) {
      const passed = x <= checkpointX;
      const img = this.add.image(x, GROUND_Y, passed ? 'checkpoint-on' : 'checkpoint').setOrigin(0.25, 1).setDepth(8);
      this.checkpoints.push({ x, img, passed });
    }

    for (const h of L.hazards) this.buildHazard(h);
    this.buildTrigger();
    if (this.level.play.scene === 'christmas') this.buildChristmas();

    if (L.paintDoorX !== null) {
      const open = this.flags.has('paint-door');
      this.paintDoor = this.add.image(L.paintDoorX, GROUND_Y, 'paint-door').setOrigin(0.5, 1).setDepth(11);
      if (open) this.paintDoor.setAlpha(0.25);
    }

    for (const t of L.targets) {
      if (this.flags.has(`${t.id}-hit`)) continue;
      const pole = this.add.rectangle(t.x, (t.y + GROUND_Y) / 2, 10, GROUND_Y - t.y, 0x9a6a3c).setDepth(7);
      const img = this.add.image(t.x, t.y, 'target').setDepth(14).setScale(0.9);
      img.setInteractive(new Phaser.Geom.Circle(50, 50, 70), Phaser.Geom.Circle.Contains);
      img.on('pointerdown', () => this.shootTarget(t, img, pole));
    }

    this.portalGlow = this.add.image(L.portalX, GROUND_Y - 95, 'portal-glow').setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.portalGlow, alpha: { from: 0.65, to: 1 }, scale: { from: 0.95, to: 1.12 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.portal = this.add.image(L.portalX, GROUND_Y - 95, 'portal').setDepth(8);
    this.portalSparks = this.add.particles(L.portalX, GROUND_Y - 95, 'sparkle', {
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 72), quantity: 24 },
      lifespan: 1100, speed: { min: 6, max: 24 }, scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
      frequency: prefersReducedMotion() ? 600 : 140, tint: [0xffffff, 0xbfe4ff, 0xd8c8ff], blendMode: Phaser.BlendModes.ADD
    }).setDepth(9);
    this.tweens.add({ targets: this.portal, angle: 360, duration: 4000, repeat: -1 });
    this.tweens.add({ targets: this.portal, scale: 1.08, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.portalLabel = this.add.text(L.portalX, GROUND_Y - 205, 'PORTAL', textStyle(18, '#5b2bd1')).setOrigin(0.5).setDepth(8);
    if (L.arenaX !== null && !this.progress.promptResolved) {
      // The finale portal appears only after the monster is befriended.
      this.portal.setVisible(false);
      this.portalLabel.setVisible(false);
      this.portalGlow.setVisible(false);
      this.portalSparks.stop();
    }
  }

  private portalGlow!: Phaser.GameObjects.Image;
  private portalSparks!: Phaser.GameObjects.Particles.ParticleEmitter;

  /** Gentle theme particles drifting across the screen (petals, fireflies, sparkles…). */
  private buildAmbient(kind: Ambient, tint: number): void {
    if (prefersReducedMotion()) return;
    const common = { x: { min: -20, max: 980 }, lifespan: 9000, alpha: { start: 0.9, end: 0 }, tint };
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    let key = 'sparkle';
    switch (kind) {
      case 'petal': case 'blossom': case 'leaf':
        key = kind === 'leaf' ? 'leaf' : 'petal';
        cfg = { ...common, y: -10, speedY: { min: 22, max: 46 }, speedX: { min: -30, max: 10 }, rotate: { min: 0, max: 360 },
          scale: { min: 0.6, max: 1.1 }, frequency: 650, quantity: 1,
          tint: kind === 'blossom' ? 0xffffff : tint };
        break;
      case 'firefly':
        key = 'firefly';
        cfg = { ...common, y: { min: 180, max: 470 }, speedX: { min: -12, max: 12 }, speedY: { min: -14, max: 6 },
          scale: { start: 0.5, end: 1.0 }, alpha: { start: 0, end: 1, ease: 'Sine.easeInOut' }, lifespan: 4000, frequency: 260,
          blendMode: Phaser.BlendModes.ADD };
        break;
      case 'snow':
        key = 'xmas-snowflake';
        cfg = { ...common, y: -10, speedY: { min: 28, max: 60 }, speedX: { min: -24, max: 12 }, rotate: { min: 0, max: 360 },
          scale: { min: 0.45, max: 1.1 }, alpha: { start: 0.95, end: 0.25 }, lifespan: 11000, frequency: 110, quantity: 1 };
        break;
      case 'pollen': case 'mote':
        key = 'dot';
        cfg = { ...common, y: { min: 60, max: 460 }, speedX: { min: -14, max: 14 }, speedY: { min: -10, max: 6 },
          scale: { min: 0.25, max: 0.6 }, alpha: { start: 0.85, end: 0 }, lifespan: 6000, frequency: 260 };
        break;
      default:
        key = 'sparkle';
        cfg = { ...common, y: { min: 40, max: 440 }, speedX: { min: -8, max: 8 }, speedY: { min: -8, max: 4 },
          scale: { start: 0.15, end: 0.6 }, alpha: { start: 1, end: 0 }, lifespan: 2600, frequency: 220, blendMode: Phaser.BlendModes.ADD };
    }
    // Falling things start at the top of the screen; drifting ones stay level with the world.
    const falls = kind === 'petal' || kind === 'blossom' || kind === 'leaf' || kind === 'snow';
    const emitter = this.add.particles(0, falls ? 0 : EXTRA_HEIGHT, key, cfg).setScrollFactor(0).setDepth(30);
    emitter.fastForward(6000);
    this.dust = this.add.particles(0, 0, 'dust', {
      lifespan: 520, speedX: { min: -70, max: -20 }, speedY: { min: -40, max: -10 }, scale: { start: 0.55, end: 1.2 },
      alpha: { start: 0.75, end: 0 }, emitting: false,
      tint: this.theme.ground.style === 'cloud' || this.theme.ground.style === 'icing' ? 0xffffff : 0xf6efe6
    }).setDepth(17);
  }

  /** Smoothly follow Lyla (or a locked target), clamped to the level. */
  private updateCamera(delta: number, snap = false): void {
    const cam = this.cameras.main;
    const max = Math.max(0, this.layout.length - 960);
    const target = Phaser.Math.Clamp(this.camLockX ?? this.lyla.x - FOLLOW_X, 0, max);
    if (snap) cam.scrollX = target;
    else cam.scrollX += (target - cam.scrollX) * (1 - Math.pow(0.85, Math.min(delta, 50) / 16.67));
    cam.scrollY = -EXTRA_HEIGHT;
  }

  private buildHazard(h: Hazard): void {
    const done = this.flags.has(`${h.id}-gone`) || h.x < (this.progress.checkpointX ?? 0) - 120;
    const rt: HazardRuntime = { data: h, state: done ? 'done' : 'idle', parts: [], bumps: 0 };
    if (h.type === 'tiger') {
      const bush = this.add.image(h.x + 40, GROUND_Y + 6, 'bush').setOrigin(0.5, 1).setDepth(15);
      rt.parts.push(bush);
    } else if (h.type === 'monkey') {
      const tree = this.add.image(h.x, GROUND_Y, 'tree').setOrigin(0.5, 1).setDepth(6);
      rt.parts.push(tree);
      if (!done) {
        rt.actor = this.add.image(h.x + 52, GROUND_Y - 196, 'monkey').setOrigin(0.5, 0.2).setDepth(16);
        this.tweens.add({ targets: rt.actor, angle: { from: -6, to: 6 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    } else if (h.type === 'hand') {
      rt.actor = this.add.image(h.x, GROUND_Y - 210, 'hand').setOrigin(0.5, 1).setDepth(16);
      const napping = this.flags.has('hands-napping');
      if (napping) rt.state = 'done';
      if (!napping && !done) {
        rt.handTween = this.tweens.chain({
          targets: rt.actor, loop: -1,
          tweens: [
            { y: GROUND_Y - 40, duration: 520, ease: 'Quad.easeIn' },
            { y: GROUND_Y - 40, duration: 650 },
            { y: GROUND_Y - 210, duration: 560, ease: 'Quad.easeOut' },
            { y: GROUND_Y - 210, duration: 1100 }
          ]
        });
      } else {
        rt.actor.setAngle(-8);
      }
    }
    this.hazards.push(rt);
  }

  private buildTrigger(): void {
    const { kind, x } = this.layout.trigger;
    const resolved = this.progress.promptResolved;
    const g = this.theme.gate;
    switch (kind) {
      case 'cage': {
        this.triggerMain = this.add.image(x, GROUND_Y + 2, resolved ? 'cage-open' : 'cage').setOrigin(0.5, 1).setDepth(20);
        if (resolved) this.triggerMain.setY(GROUND_Y - 170);
        this.police = this.add.image(resolved ? x + 150 : x + 620, GROUND_Y, resolved ? 'police-cheer' : 'police')
          .setOrigin(0.5, 1).setDepth(19).setFlipX(true);
        break;
      }
      case 'flower':
        this.triggerMain = this.add.image(x, GROUND_Y + 4, 'magic-flower').setOrigin(0.5, 1).setDepth(11);
        if (resolved) this.triggerMain.setVisible(false);
        else this.tweens.add({ targets: this.triggerMain, scale: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      case 'gate':
        this.triggerMain = this.add.image(x, GROUND_Y, gateTexture(this, g.main, g.dark, g.style)).setOrigin(0.5, 1).setDepth(11);
        if (resolved) this.triggerMain.setVisible(false);
        break;
      case 'bow': {
        const pedestal = this.add.image(x, GROUND_Y, 'pedestal').setOrigin(0.5, 1).setDepth(10);
        this.triggerParts.push(pedestal);
        this.triggerMain = this.add.image(x, GROUND_Y - 140, 'bow').setDepth(11).setAngle(-90);
        if (resolved) this.triggerMain.setVisible(false);
        else this.tweens.add({ targets: this.triggerMain, y: GROUND_Y - 150, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'phone':
        this.triggerMain = this.add.image(x, GROUND_Y, 'phone-big').setOrigin(0.5, 1).setDepth(11);
        if (resolved) this.triggerMain.setTint(0x888899).setAngle(8);
        break;
      case 'gift': {
        // The elves' giant present: a box with its lid (and big bow) sitting on top.
        this.triggerMain = this.add.image(x, GROUND_Y + 2, 'xmas-gift-box').setOrigin(0.5, 1).setDepth(11);
        this.giftLid = this.add.image(x, GROUND_Y - 96, 'xmas-gift-lid').setOrigin(0.5, 1).setDepth(12);
        if (resolved) this.openGift(false);
        else this.tweens.add({ targets: this.giftLid, y: GROUND_Y - 104, duration: 240, yoyo: true, repeat: -1, repeatDelay: 1200, ease: 'Quad.easeOut' });
        break;
      }
      case 'heart':
        // The final boss is built when Lyla reaches the arena.
        break;
    }
    if (this.triggerMain && !resolved && kind !== 'cage' && kind !== 'heart') {
      const sparkle = this.add.image(x, GROUND_Y - 290, 'sparkle-gold').setDepth(12);
      this.tweens.add({ targets: sparkle, angle: 360, scale: { from: 0.8, to: 1.4 }, duration: 1200, yoyo: true, repeat: -1 });
      this.triggerParts.push(sparkle);
    }
  }

  /** The Christmas village: welcome arch, Christmas trees, candy canes, a snowman and friendly elves. */
  private buildChristmas(): void {
    const L = this.layout;
    const tx = L.trigger.x;
    this.add.image(560, GROUND_Y + 4, 'xmas-arch').setOrigin(0.5, 1).setDepth(7);
    // The big tree stands right behind the giant present; a little one waits by the portal.
    this.add.image(tx + 10, GROUND_Y + 6, 'xmas-tree').setOrigin(0.5, 1).setDepth(6);
    this.add.image(L.portalX - 250, GROUND_Y + 4, 'xmas-tree-small').setOrigin(0.5, 1).setDepth(6);

    // Candy canes, little trees and a snowman in the open stretches, clear of everything else.
    const blocked: Array<[number, number]> = [
      ...L.obstacles.map((o): [number, number] => [o.x - 70, o.x + o.w + 70]),
      ...L.platforms.map((p): [number, number] => [p.x - 40, p.x + p.w + 40]),
      ...L.checkpoints.map((c): [number, number] => [c - 80, c + 90]),
      ...L.beads.map((b): [number, number] => [b.x - 50, b.x + 60]),
      [tx - 360, tx + 360]
    ];
    const decor = ['xmas-candycane', 'xmas-tree-small', 'xmas-candycane', 'xmas-snowman'];
    let placed = 0;
    for (let x = 860; x < L.portalX - 520; x += 30) {
      if (blocked.some(([a, b]) => x > a && x < b)) continue;
      this.add.image(x, GROUND_Y + 4, decor[placed++ % decor.length]).setOrigin(0.5, 1).setDepth(7);
      x += 400;
    }

    // Elves: one under the arch, one beside the present, one near the portal.
    const spots: Array<[number, number, string]> = [
      [650, 0, 'Merry Christmas, Lyla!'],
      [tx + 160, 1, 'A present for you, Lyla!'],
      [L.portalX - 400, 0, 'Jingle all the way!']
    ];
    spots.forEach(([x, variant, hello], i) => {
      const keys = ELF_KEYS[variant];
      const cheering = i === 1 && this.progress.promptResolved;
      this.add.image(x, GROUND_Y + 3, 'shadow').setScale(0.65, 0.7).setDepth(7);
      const img = this.add.image(x, GROUND_Y + 2, cheering ? keys.cheer : keys.stand).setOrigin(0.5, 1).setDepth(8).setFlipX(i === 2);
      this.tweens.add({ targets: img, y: GROUND_Y - 5, duration: 380 + i * 60, yoyo: true, repeat: -1, repeatDelay: 500 + i * 150, ease: 'Quad.easeOut' });
      this.elves.push({ img, cheer: keys.cheer, hello, greeted: false });
    });
  }

  /** Elves call out a greeting as Lyla runs up to them. */
  private updateElves(): void {
    for (const elf of this.elves) {
      if (elf.greeted || this.lyla.x < elf.img.x - 300) continue;
      elf.greeted = true;
      if (this.lyla.x > elf.img.x + 150) continue; // already past (resumed from a checkpoint)
      this.floatText(elf.img.x, GROUND_Y - 160, elf.hello, '#1f8a3e');
      play('jingle');
    }
  }

  /** The giant present opens: the lid pops off and flowers peek out (instantly when resuming). */
  private openGift(animate: boolean): void {
    const x = this.layout.trigger.x;
    const lid = this.giftLid;
    const restX = x - 250, restY = GROUND_Y + 8;
    this.triggerMain?.setTexture('xmas-gift-box-open');
    const peek = ['flower-b', 'flower', 'flower-c', 'flower'].map((key, i) =>
      this.add.image(x - 48 + i * 32, GROUND_Y - 110, key).setOrigin(0.5, 1).setDepth(11.5).setScale(animate ? 0 : 1));
    if (!animate) {
      lid?.setPosition(restX, restY).setAngle(-10);
      return;
    }
    if (lid) {
      this.tweens.killTweensOf(lid);
      this.tweens.chain({
        targets: lid,
        tweens: [
          { x: x - 110, y: lid.y - 180, angle: -190, duration: 420, ease: 'Quad.easeOut' },
          { x: restX, y: restY, angle: -370, duration: 520, ease: 'Bounce.easeOut' }
        ]
      });
    }
    this.tweens.add({ targets: peek, scale: 1, duration: 420, delay: this.tweens.stagger(90, {}), ease: 'Back.easeOut' });
    for (let i = 0; i < 6; i++) {
      const f = this.add.image(x, GROUND_Y - 120, ['flower', 'flower-b', 'flower-c'][i % 3]).setDepth(60).setScale(0.5);
      const dx = (i - 2.5) * 60;
      this.tweens.add({
        targets: f, x: x + dx, y: GROUND_Y - 270 - (i % 2) * 40, scale: 1, angle: dx * 0.6, duration: 560, ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({ targets: f, y: f.y - 30, alpha: 0, duration: 450, onComplete: () => f.destroy() })
      });
    }
    for (const elf of this.elves) elf.img.setTexture(elf.cheer);
  }

  private buildLyla(): void {
    if (!this.anims.exists('lyla-run')) {
      this.anims.create({ key: 'lyla-run', frames: ['run0', 'run1', 'run2', 'run3'].map(f => ({ key: `lyla-${f}` })), frameRate: 11, repeat: -1 });
    }
    let startX = LYLA_START_X;
    if (this.progress.checkpointX !== null) startX = this.progress.checkpointX;
    else if (this.layout.trigger.kind === 'cage') startX = this.layout.trigger.x;
    this.shadow = this.add.image(startX, GROUND_Y + 2, 'shadow').setDepth(16);
    this.lyla = this.physics.add.sprite(startX, GROUND_Y, 'lyla-stand').setOrigin(0.5, 1).setDepth(18);
    const body = this.lyla.body as Phaser.Physics.Arcade.Body;
    body.setSize(46, 76);
    body.setOffset(37, 42 + BUNNY_HEADROOM);
    body.setMaxVelocityY(1200);
    this.lyla.setCollideWorldBounds(true);
    this.physics.add.collider(this.lyla, this.groundZone);
    this.physics.add.collider(this.lyla, this.obstacleGroup);
    this.physics.add.collider(this.lyla, this.platformGroup);

    this.dangerRing = this.add.circle(startX, GROUND_Y - 50, 70).setStrokeStyle(5, 0xff4fa8, 0.9).setDepth(17).setVisible(false);
    this.tweens.add({ targets: this.dangerRing, scale: { from: 0.85, to: 1.15 }, alpha: { from: 1, to: 0.5 }, duration: 420, yoyo: true, repeat: -1 });
  }

  private buildHud(): void {
    const depth = 500;
    this.add.image(80, 37, 'hud-pill').setScrollFactor(0).setDepth(depth);
    const icon = this.add.image(42, 37, 'flower-icon').setScrollFactor(0).setDepth(depth + 1);
    const flowers = this.add.text(66, 37, String(this.flowerCount), textStyle(28, '#c0307a')).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 1);

    const darkHud = this.theme.hudText.toLowerCase() === '#ffffff';
    this.add.text(480, 22, `Level ${this.level.id}: ${this.level.title}`, textStyle(20, this.theme.hudText, true, {
      stroke: darkHud ? '#2a1f5c' : '#ffffff', strokeThickness: 5
    })).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(depth);

    const barX = 330, barW = 300;
    this.add.image(barX + barW / 2, 48, 'hud-bar').setScrollFactor(0).setDepth(depth);
    const tx = barX + (this.layout.trigger.x / this.layout.length) * barW;
    this.add.image(tx, 48, 'sparkle-gold').setScale(0.8).setScrollFactor(0).setDepth(depth + 1);
    this.add.image(barX + barW, 48, 'portal').setScale(0.14).setScrollFactor(0).setDepth(depth + 1);
    const marker = this.add.circle(barX, 48, 8, 0xff5fae).setStrokeStyle(3, 0xffffff).setScrollFactor(0).setDepth(depth + 2);

    const pause = makeButton(this, 912, 40, 76, 58, 'II', () => this.openPause(), { color: 0x7445c5, fontSize: 26 });
    pause.setScrollFactor(0).setDepth(depth);
    this.hud = { flowers, marker, barX, barW, icon };
  }

  private bindInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return; // a bead, target, star or HUD button handles its own tap
      if (this.state === 'boss') { this.pulseBossHint(); return; }
      if (this.state !== 'running') return;
      const danger = this.dangerActive();
      const cx = this.lyla.x, cy = this.lyla.y - 50 * this.lyla.scaleY;
      const near = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cx, cy) < 125;
      if (danger && near) this.shrink();
      else this.requestJump();
    });
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture('SPACE,UP,DOWN');
      kb.on('keydown-SPACE', () => { if (this.state === 'running') this.requestJump(); });
      kb.on('keydown-UP', () => { if (this.state === 'running') this.requestJump(); });
      kb.on('keydown-W', () => { if (this.state === 'running') this.requestJump(); });
      kb.on('keydown-DOWN', () => { if (this.state === 'running' && this.dangerActive()) this.shrink(); });
      kb.on('keydown-S', () => { if (this.state === 'running' && this.dangerActive()) this.shrink(); });
      kb.on('keydown-P', () => this.openPause());
      kb.on('keydown-ESC', () => this.openPause());
    }
  }

  // ------------------------------------------------------------------ flow

  private startLevel(): void {
    const kind = this.layout.trigger.kind;
    if (kind === 'cage' && !this.progress.promptResolved) {
      this.cageIntro();
      return;
    }
    this.showGo();
  }

  private showGo(): void {
    this.state = 'intro';
    const resumed = this.progress.checkpointX !== null;
    const label = resumed ? 'Welcome back! 🌸' : `Level ${this.level.id}`;
    const banner = this.add.text(480, 230 + EXTRA_HEIGHT / 2, label, textStyle(52, '#ffffff', true, { stroke: '#7445c5', strokeThickness: 10 }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(600).setScale(0.6).setAlpha(0);
    const sub = this.add.text(480, 292 + EXTRA_HEIGHT / 2, resumed ? 'Picking up where you left off' : this.level.title, textStyle(28, '#ffffff', true, { stroke: '#7445c5', strokeThickness: 7 }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(600).setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, duration: 350, delay: 150 });
    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: [banner, sub], alpha: 0, duration: 250, onComplete: () => { banner.destroy(); sub.destroy(); } });
      if (this.state !== 'intro') return; // never clobber a newer state
      this.state = 'running';
      this.graceUntil = this.time.now + 800;
      this.lyla.play('lyla-run', true);
      if (this.level.id <= 2) this.showTip('jump', 'Tap anywhere to jump!', 480, 150, 2600);
    });
  }

  private cageIntro(): void {
    this.state = 'intro';
    this.lyla.setTexture('lyla-stand');
    const police = this.police!;
    const cageX = this.layout.trigger.x;
    this.tweens.add({
      targets: police, x: cageX + 150, duration: 1300, ease: 'Sine.easeInOut',
      onComplete: () => {
        police.setTexture('police-cheer');
        const msg = 'Psst, Lyla! Here is a key! The king is secretly EVIL. He controls robot bunnies with his phone!';
        const bubble = makeBubble(this, cageX + 170, GROUND_Y - 200, msg, 400);
        bubble.setDepth(40);
        if (loadPrefs().narration) void speak(msg, 0.95);
        let advanced = false;
        const next = (): void => {
          if (advanced) return;
          advanced = true;
          bubble.destroy();
          void this.runSpelling();
        };
        this.time.delayedCall(4200, next);
        this.input.once('pointerdown', next);
      }
    });
  }

  private requestJump(): void {
    this.jumpRequestedAt = this.time.now;
  }

  private doJump(helper = false): void {
    const body = this.lyla.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.small ? JUMP_VELOCITY * 0.75 : JUMP_VELOCITY);
    this.jumpRequestedAt = -9999;
    this.lastGroundedAt = -9999;
    play('jump');
    if (helper) {
      burst(this, this.lyla.x, this.lyla.y - 40, 6, 'sparkle-gold');
      this.floatText(this.lyla.x, this.lyla.y - 150, 'Boing! A helper hop!', '#7445c5');
    }
  }

  update(time: number, delta: number): void {
    if (!this.lyla) return;
    this.updateCamera(delta);
    const cam = this.cameras.main;
    this.far.set(cam.scrollX * 0.15);
    this.mid.set(cam.scrollX * 0.45);
    this.fg.set(cam.scrollX * 1.25);
    // Contact shadow shrinks and fades as Lyla rises.
    const height = Math.max(0, GROUND_Y - this.lyla.y);
    const k = Phaser.Math.Clamp(1 - height / 260, 0.25, 1) * Math.abs(this.lyla.scaleX);
    this.shadow.setPosition(this.lyla.x - 2, GROUND_Y + 2).setScale(k * 0.9, k).setAlpha(this.lyla.visible ? this.lyla.alpha * (0.4 + 0.6 * k) : 0);
    this.hud.marker.x = this.hud.barX + Phaser.Math.Clamp(this.lyla.x / this.layout.length, 0, 1) * this.hud.barW;
    this.dangerRing.setPosition(this.lyla.x, this.lyla.y - 46 * this.lyla.scaleY);

    if (this.state !== 'running') {
      this.dangerRing.setVisible(false);
      return;
    }
    const body = this.lyla.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.lastGroundedAt = time;

    const danger = this.dangerActive();
    const bumped = time < this.bumpUntil;
    if (!bumped) body.setVelocityX(danger ? DANGER_SPEED : RUN_SPEED);

    // Forgiving jump: buffered taps and a little "coyote" time after leaving a ledge.
    if (time - this.jumpRequestedAt < 160 && time - this.lastGroundedAt < 120 && !bumped) this.doJump();

    if (this.autoJumpFor) {
      const o = this.layout.obstacles.find(ob => ob.id === this.autoJumpFor);
      if (o && onGround && o.x - body.right < 80 && o.x - body.right > 0) {
        this.autoJumpFor = null;
        this.doJump(true);
      }
    }

    if (body.blocked.right && !bumped) this.bump();

    // Landing squash, take-off stretch and running dust.
    if (onGround && !this.wasOnGround) this.landFx();
    if (!onGround && this.wasOnGround && body.velocity.y < -200) this.squash(0.9, 1.12, 160);
    this.wasOnGround = onGround;
    if (onGround && !this.small && time - this.lastDustAt > 230) {
      this.lastDustAt = time;
      this.dust?.emitParticleAt(this.lyla.x - 20, this.lyla.y - 4, 1);
    }

    // Visuals.
    if (!onGround) {
      this.lyla.anims.stop();
      this.lyla.setTexture('lyla-jump');
    } else if (!this.lyla.anims.isPlaying) {
      this.lyla.play('lyla-run', true);
    }
    this.lyla.setAlpha(time < this.graceUntil ? (Math.floor(time / 90) % 2 ? 0.55 : 1) : 1);

    this.dangerRing.setVisible(danger && !this.small);
    if (danger && !this.small) this.showDangerBubble(); else this.hideDangerBubble();
    if (this.small) {
      if (danger) this.safeSince = time;
      else if (time - this.safeSince > 650 && !this.handOverhead()) this.grow();
    }

    this.updateCollectibles();
    this.updateBeads(body, onGround);
    this.updateCheckpoints();
    this.updateHazards(time);
    this.updateTips();
    if (this.elves.length) this.updateElves();

    const L = this.layout;
    if (L.paintDoorX !== null && !this.flags.has('paint-door') && this.lyla.x > L.paintDoorX - 90) {
      this.openPaintDoor();
      return;
    }
    if (L.arenaX !== null && !this.progress.promptResolved && this.lyla.x > L.arenaX + 120) {
      this.startBoss();
      return;
    }
    if (L.trigger.kind !== 'heart' && L.trigger.kind !== 'cage' && !this.progress.promptResolved && this.lyla.x > L.trigger.x - 95) {
      void this.runSpelling();
      return;
    }
    if (this.lyla.x > L.portalX - 30) this.finishLevel();
  }

  // --------------------------------------------------------------- movement

  private landFx(): void {
    if (this.small) return;
    this.squash(1.14, 0.86, 140);
    this.dust?.emitParticleAt(this.lyla.x - 10, this.lyla.y - 4, 3);
    this.dust?.emitParticleAt(this.lyla.x + 14, this.lyla.y - 4, 2);
  }

  /** Brief squash-and-stretch that never fights the shrink tween. */
  private squash(sx: number, sy: number, ms: number): void {
    if (this.small || this.shrinkTween?.isPlaying() || prefersReducedMotion()) return;
    this.tweens.killTweensOf(this.lyla);
    this.lyla.setScale(sx, sy);
    this.tweens.add({ targets: this.lyla, scaleX: 1, scaleY: 1, duration: ms, ease: 'Back.easeOut' });
  }

  private bump(): void {
    const now = this.time.now;
    if (now < this.graceUntil) return;
    this.bumpUntil = now + 430;
    const body = this.lyla.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-230, -250);
    play('bump');
    burst(this, body.right, body.center.y, 5, 'sparkle');
    const ahead = this.layout.obstacles.find(o => o.x >= body.right - 12 && o.x - body.right < 40);
    if (ahead) {
      const count = (this.bumpCounts.get(ahead.id) ?? 0) + 1;
      this.bumpCounts.set(ahead.id, count);
      if (count >= 2) this.autoJumpFor = ahead.id;
      else if (count === 1 && this.level.id <= 3) this.floatText(this.lyla.x, this.lyla.y - 150, 'Boing! Tap to jump!', '#7445c5');
    }
  }

  private dangerActive(): boolean {
    const x = this.lyla.x;
    return this.hazards.some(h => {
      if (h.state === 'done') return false;
      if (h.data.type === 'hand') return !this.flags.has('hands-napping') && x > h.data.x - 520 && x < h.data.x + 70;
      return h.state === 'warn' || h.state === 'attack';
    });
  }

  private handOverhead(): boolean {
    return this.hazards.some(h => h.data.type === 'hand' && h.state !== 'done' && h.actor &&
      Math.abs(this.lyla.x - h.data.x) < 90 && h.actor.y > GROUND_Y - 140);
  }

  private shrink(): void {
    if (this.small) return;
    this.small = true;
    this.safeSince = this.time.now;
    play('shrink');
    burst(this, this.lyla.x, this.lyla.y - 40, 8);
    this.shrinkTween?.stop();
    this.shrinkTween = this.tweens.add({ targets: this.lyla, scale: SMALL_SCALE, duration: 220, ease: 'Back.easeIn' });
    this.hideDangerBubble();
    if (!this.tipsShown.has('small')) {
      this.tipsShown.add('small');
      this.floatText(this.lyla.x, this.lyla.y - 110, 'Tiny like an ant!', '#c0307a');
    }
  }

  private grow(): void {
    if (!this.small) return;
    this.small = false;
    play('grow');
    this.shrinkTween?.stop();
    this.shrinkTween = this.tweens.add({ targets: this.lyla, scale: 1, duration: 260, ease: 'Back.easeOut' });
  }

  // ----------------------------------------------------------- collectibles

  private lylaBox(): Phaser.Geom.Rectangle {
    const b = this.lyla.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(b.x - 6, b.y - 6, b.width + 12, b.height + 12);
  }

  private updateCollectibles(): void {
    if (this.small) return; // Lyla must be normal size to collect flowers.
    const box = this.lylaBox();
    for (const f of this.flowers) {
      if (this.collected.has(f.data.id)) continue;
      if (Math.abs(f.data.x - this.lyla.x) > 80) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(box, new Phaser.Geom.Rectangle(f.data.x - 16, f.img.y - 22, 32, 40))) {
        this.collected.add(f.data.id);
        this.addFlowers(1);
        play('flower');
        const img = f.img;
        this.tweens.killTweensOf(img);
        this.tweens.add({ targets: img, y: img.y - 50, scale: 1.4, alpha: 0, duration: 320, onComplete: () => img.destroy() });
        burst(this, f.data.x, f.img.y, 4, 'sparkle-gold');
      }
    }
  }

  private addFlowers(n: number): void {
    this.flowerCount += n;
    this.hud.flowers.setText(String(this.flowerCount));
    this.tweens.add({ targets: [this.hud.flowers, this.hud.icon], scale: 1.3, duration: 120, yoyo: true });
  }

  private pickBead(entry: { data: Collectible; img: Phaser.GameObjects.Image; picked: boolean }, tapped: boolean): void {
    if (entry.picked) return;
    if (tapped && ['spelling', 'puzzle', 'paused', 'rescue', 'done'].includes(this.state)) return;
    entry.picked = true;
    this.collected.add(entry.data.id);
    play(this.pickups.sound);
    entry.img.disableInteractive();
    this.tweens.add({ targets: entry.img, y: entry.img.y - 70, alpha: 0, scale: 1.6, duration: 380, onComplete: () => entry.img.destroy() });
    burst(this, entry.data.x, entry.data.y, 5, 'sparkle');
    if (tapped && !this.tipsShown.has('bead-yay')) {
      this.tipsShown.add('bead-yay');
      this.floatText(entry.data.x, entry.data.y - 90, this.pickups.picked, '#2f88c0');
    }
  }

  private updateBeads(body: Phaser.Physics.Arcade.Body, onGround: boolean): void {
    for (const b of this.beads) {
      if (b.picked) continue;
      if (!this.tipsShown.has('beads') && b.data.x - this.lyla.x < 560 && b.data.x > this.lyla.x) {
        this.tipsShown.add('beads');
        this.showTip('beads', this.pickups.tip, 480, 150, 3200);
      }
      if (onGround && !this.small && body.right > b.data.x - 10 && body.x < b.data.x + 10 && this.time.now > this.graceUntil) {
        // Trip: a small stumble, never a penalty. The bead is cleared so it can't happen twice.
        this.pickBead(b, false);
        this.bumpUntil = this.time.now + 380;
        body.setVelocity(-170, -200);
        play('bump');
        this.floatText(this.lyla.x, this.lyla.y - 140, this.pickups.oops, '#2f88c0');
      }
    }
  }

  private updateCheckpoints(): void {
    for (const cp of this.checkpoints) {
      if (cp.passed || this.lyla.x < cp.x) continue;
      cp.passed = true;
      cp.img.setTexture('checkpoint-on');
      play('checkpoint');
      burst(this, cp.x + 16, GROUND_Y - 100, 6, 'sparkle-gold');
      this.saveProgress(cp.x + 10);
      this.floatText(cp.x, GROUND_Y - 170, 'Saved! 🌸', '#c0307a');
    }
  }

  private saveProgress(checkpointX: number | null): void {
    try {
      this.campaign = saveLevelProgress(this.campaign, this.levelIndex, {
        ...(checkpointX !== null ? { checkpointX } : {}),
        flowers: this.flowerCount,
        collected: [...this.collected],
        flags: [...this.flags]
      });
      this.progress = this.campaign.level ?? this.progress;
    } catch (error) {
      this.listChanged(error);
    }
  }

  private shootTarget(t: Collectible, img: Phaser.GameObjects.Image, pole: Phaser.GameObjects.Rectangle): void {
    if (this.state !== 'running' || this.flags.has(`${t.id}-hit`)) return;
    if (!this.campaign.flags.includes('bow')) {
      this.floatText(t.x, t.y - 80, 'Lyla needs her bow first!', '#7445c5');
      return;
    }
    this.flags.add(`${t.id}-hit`);
    img.disableInteractive();
    this.fireArrow(this.lyla.x + 30, this.lyla.y - 60, t.x, t.y, 'arrow', () => {
      play('pop');
      burst(this, t.x, t.y, 10, 'sparkle-gold');
      this.tweens.add({ targets: [img, pole], alpha: 0, duration: 300, onComplete: () => { img.destroy(); pole.destroy(); } });
      this.addFlowers(2);
      this.floatText(t.x, t.y - 70, 'Bullseye! +2 🌸', '#c0307a');
    });
  }

  private fireArrow(x: number, y: number, tx: number, ty: number, key: string, onHit: () => void): void {
    play('arrow');
    const arrow = this.add.image(x, y, key).setDepth(70);
    arrow.setRotation(Math.atan2(ty - y, tx - x));
    this.tweens.add({ targets: arrow, x: tx, y: ty, duration: 420, ease: 'Quad.easeIn', onComplete: () => { arrow.destroy(); onHit(); } });
  }

  // ---------------------------------------------------------------- hazards

  private updateHazards(time: number): void {
    const x = this.lyla.x;
    for (const h of this.hazards) {
      if (h.state === 'done') continue;
      const hx = h.data.x;
      if (h.data.type === 'tiger') {
        if (h.state === 'idle' && x > hx - 560) {
          h.state = 'warn';
          h.alert = this.add.text(hx + 40, GROUND_Y - 150, '!', textStyle(64, '#ff4f8b', true, { stroke: '#ffffff', strokeThickness: 8 })).setOrigin(0.5).setDepth(30);
          this.tweens.add({ targets: h.alert, scale: 1.25, duration: 260, yoyo: true, repeat: -1 });
          this.tweens.add({ targets: h.parts[0], angle: { from: -3, to: 3 }, duration: 120, yoyo: true, repeat: -1 });
        } else if (h.state === 'warn' && x > hx - 200) {
          this.tigerPounce(h);
        }
      } else if (h.data.type === 'monkey') {
        if (h.state === 'idle' && x > hx - 430) {
          h.state = 'warn';
          h.alert = this.add.text(hx + 52, GROUND_Y - 300, '!', textStyle(64, '#ff4f8b', true, { stroke: '#ffffff', strokeThickness: 8 })).setOrigin(0.5).setDepth(30);
          this.tweens.add({ targets: h.alert, scale: 1.25, duration: 260, yoyo: true, repeat: -1 });
        } else if (h.state === 'warn' && x > hx + 52 - 75) {
          this.monkeyDrop(h);
        }
      } else if (h.data.type === 'hand' && h.actor) {
        if (this.flags.has('hands-napping')) { h.state = 'done'; continue; }
        if (x > hx + 120) { h.state = 'done'; continue; }
        const body = this.lyla.body as Phaser.Physics.Arcade.Body;
        const overlapX = body.right > hx - 52 && body.x < hx + 58;
        if (overlapX && body.top < h.actor.y - 4 && time > this.graceUntil && time > this.bumpUntil) {
          this.bumpUntil = time + 450;
          body.setVelocity(-260, -220);
          play('bump');
          h.bumps++;
          if (h.bumps >= 3 && h.handTween) {
            // Helper: the hand lifts up and waits so Lyla can pass.
            h.handTween.stop();
            this.tweens.add({ targets: h.actor, y: GROUND_Y - 220, duration: 400 });
            this.floatText(hx, GROUND_Y - 280, 'The hand waves hello and waits!', '#7445c5');
            this.flags.add(`${h.data.id}-gone`);
            h.state = 'done';
          } else if (h.bumps === 1) {
            this.floatText(this.lyla.x, this.lyla.y - 150, 'Tap Lyla to shrink and run under!', '#c0307a');
          }
        }
      }
    }
  }

  private tigerPounce(h: HazardRuntime): void {
    h.state = 'attack';
    h.alert?.destroy();
    this.tweens.killTweensOf(h.parts[0]);
    (h.parts[0] as Phaser.GameObjects.Image).setAngle(0);
    const tiger = this.add.image(h.data.x + 40, GROUND_Y, 'tiger-leap').setOrigin(0.5, 1).setDepth(25).setFlipX(true);
    h.actor = tiger;
    const targetX = this.lyla.x + DANGER_SPEED * 0.55;
    play('whoosh');
    this.tweens.add({ targets: tiger, x: targetX, duration: 560, ease: 'Linear' });
    this.tweens.add({
      targets: tiger, y: GROUND_Y - 150, duration: 280, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.state !== 'running') { tiger.destroy(); h.state = 'done'; return; }
        const caught = !this.small && this.time.now > this.graceUntil && Math.abs(this.lyla.x - tiger.x) < 90;
        if (caught) {
          this.capture(h);
        } else {
          tiger.setTexture('tiger');
          this.floatText(tiger.x, GROUND_Y - 180, this.small ? 'The tiger missed tiny Lyla!' : 'Phew! Missed!', '#c0307a');
          this.tweens.add({ targets: tiger, x: tiger.x - 700, duration: 900, onComplete: () => tiger.destroy() });
          h.state = 'done';
          this.flags.add(`${h.data.id}-gone`);
        }
      }
    });
  }

  private monkeyDrop(h: HazardRuntime): void {
    h.state = 'attack';
    h.alert?.destroy();
    const monkey = h.actor!;
    this.tweens.killTweensOf(monkey);
    monkey.setAngle(0).setTexture('monkey-grab').setOrigin(0.5, 1);
    monkey.y = GROUND_Y - 196 + 100;
    play('whoosh');
    this.tweens.add({
      targets: monkey, y: GROUND_Y, duration: 360, ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.state !== 'running') { h.state = 'done'; return; }
        const caught = !this.small && this.time.now > this.graceUntil && Math.abs(this.lyla.x - monkey.x) < 75;
        if (caught) {
          this.capture(h);
        } else {
          monkey.setTexture('monkey');
          this.floatText(monkey.x, GROUND_Y - 160, this.small ? 'Where did Lyla go? Too tiny to see!' : 'Missed!', '#c0307a');
          this.tweens.add({ targets: monkey, angle: { from: -15, to: 15 }, duration: 160, yoyo: true, repeat: 2,
            onComplete: () => this.tweens.add({ targets: monkey, y: GROUND_Y - 260, alpha: 0, duration: 600, onComplete: () => monkey.destroy() }) });
          h.state = 'done';
          this.flags.add(`${h.data.id}-gone`);
        }
      }
    });
  }

  /** Captured: Ridensee rescues Lyla automatically and returns her to the same spot. */
  private capture(h: HazardRuntime): void {
    this.state = 'rescue';
    const captureX = this.lyla.x;
    h.state = 'done';
    this.flags.add(`${h.data.id}-gone`);
    this.hideDangerBubble();
    this.physics.pause();
    this.lyla.setVisible(false);
    h.actor?.setTexture(h.data.type === 'tiger' ? 'tiger' : 'monkey-grab');
    this.saveProgress(null);

    const cam = this.cameras.main;
    const root = this.add.container(0, EXTRA_HEIGHT / 2).setScrollFactor(0).setDepth(900);
    const bg = this.add.image(480, 270, 'rescue-bg').setDisplaySize(Math.max(960, LOGICAL_HEIGHT * 16 / 9), LOGICAL_HEIGHT).setAlpha(0);
    root.add(bg);
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      this.tweens.add({
        targets: root, alpha: 0, duration: 250,
        onComplete: () => {
          root.destroy();
          h.actor?.destroy();
          this.lyla.setVisible(true).setPosition(captureX, GROUND_Y - 4).setScale(1);
          this.small = false;
          (this.lyla.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          this.graceUntil = this.time.now + 2200;
          this.physics.resume();
          this.state = 'running';
          this.floatText(captureX, GROUND_Y - 170, 'Back where you were!', '#2a5c9e');
        }
      });
    };

    this.tweens.add({
      targets: bg, alpha: 1, duration: 300,
      onComplete: () => {
        const cage = this.add.image(480, 430, 'cage').setOrigin(0.5, 1);
        const trapped = this.add.image(480, 420, 'lyla-stand').setOrigin(0.5, 1).setScale(0.9);
        const caption = this.add.text(480, 70, 'Oh no! Lyla is back in the cage...', textStyle(32, '#6a1f4c', true, { stroke: '#ffffff', strokeThickness: 8 })).setOrigin(0.5);
        const skip = this.add.text(940, 520, 'Tap to skip ⏭', textStyle(18, '#6a1f4c')).setOrigin(1, 1);
        root.add([trapped, cage, caption, skip]);
        const ridensee = this.add.image(-120, 430, 'ridensee-run0').setOrigin(0.5, 1);
        root.add(ridensee);
        this.time.delayedCall(900, () => {
          if (finished) return;
          caption.setText('Ridensee to the rescue! ZOOM!');
          if (loadPrefs().narration) void speak('Ridensee to the rescue!', 1);
          play('whoosh');
          for (let i = 0; i < 4; i++) {
            const line = this.add.image(-100, 360 + i * 22, 'speedline');
            root.add(line);
            this.tweens.add({ targets: line, x: 1100, duration: 420, delay: i * 60, onComplete: () => line.destroy() });
          }
          this.tweens.add({
            targets: ridensee, x: 360, duration: 420, ease: 'Cubic.easeOut',
            onComplete: () => {
              if (finished) return;
              ridensee.setTexture('ridensee-cheer');
              cage.setTexture('cage-open');
              play('pop');
              this.time.delayedCall(650, () => {
                if (finished) return;
                caption.setText('Off they go, super fast!');
                ridensee.setTexture('ridensee-run1');
                trapped.setTexture('lyla-run2');
                this.tweens.add({ targets: [ridensee, trapped], x: 1150, duration: 520, ease: 'Cubic.easeIn' });
                this.time.delayedCall(700, finish);
              });
            }
          });
        });
        bg.setInteractive();
        bg.once('pointerdown', finish);
        pinToScreen(root);
      }
    });
    cam.shake(reducedShake(), 0.004);
  }

  // ---------------------------------------------------------------- spelling

  private freeze(): void {
    this.physics.pause();
    this.tweens.pauseAll();
    this.anims.pauseAll();
    this.hideDangerBubble();
    this.dangerRing.setVisible(false);
    this.lyla.anims.stop();
    this.lyla.setTexture('lyla-stand').setAlpha(1);
  }

  private resumeWorld(grace = 1300): void {
    this.tweens.resumeAll();
    this.anims.resumeAll();
    this.physics.resume();
    this.graceUntil = this.time.now + grace;
    this.state = 'running';
    this.lyla.play('lyla-run', true);
  }

  /** Freeze the world, run the level's one spelling prompt, then resume once. */
  private async runSpelling(): Promise<void> {
    if (this.state === 'spelling' || this.progress.promptResolved) return;
    this.state = 'spelling';
    this.freeze();
    if (this.small) { this.small = false; this.lyla.setScale(1); }
    try {
      this.campaign = prioritizeCurrentWeek(this.campaign, this.levelIndex);
    } catch (error) {
      this.listChanged(error);
      return;
    }
    const step = this.campaign.steps[this.levelIndex];
    const trig = this.level.play.trigger;
    const resumeX = this.layout.trigger.kind === 'cage' ? this.layout.trigger.x + 60
      : this.layout.trigger.kind === 'heart' ? this.lyla.x : this.layout.trigger.x + 110;

    const result = await presentSpelling({
      word: step.word,
      weekId: step.weekId,
      title: trig.title,
      story: trig.story,
      badge: step.source === 'previous'
        ? `✨ Bonus review word from an earlier week · Level ${this.level.id}`
        : `🌸 This week's word · Level ${this.level.id} of ${CAMPAIGN_LEVEL_COUNT}`,
      successLine: trig.success,
      punctuation: punctuationInLists(),
      leaveLabel: '⏸ Save & leave',
      onResolved: outcome => {
        // Save immediately, before any celebration: never re-present on reload.
        try {
          this.campaign = resolveCampaignPrompt(this.campaign, this.levelIndex, outcome);
          this.progress = this.campaign.level ?? this.progress;
          if (this.layout.trigger.kind === 'bow') {
            this.campaign = addCampaignFlag(this.campaign, this.levelIndex, 'bow');
          }
          if (this.level.play.napHands) this.flags.add('hands-napping');
          this.flowerCount += 3;
          this.saveProgress(resumeX);
          this.progress.promptResolved = true;
        } catch (error) {
          console.error(error);
        }
      }
    });

    if (result === 'left') {
      this.leaveToMap(false);
      return;
    }
    this.completeTrigger();
  }

  private completeTrigger(): void {
    this.state = 'cheer';
    this.tweens.resumeAll();
    this.anims.resumeAll();
    this.hud.flowers.setText(String(this.flowerCount));
    this.lyla.setTexture('lyla-cheer');
    this.tweens.add({ targets: this.lyla, y: this.lyla.y - 30, duration: 200, yoyo: true, repeat: 1 });
    const x = this.layout.trigger.x;
    const main = this.triggerMain;
    this.floatText(this.lyla.x, this.lyla.y - 170, '+3 🌸', '#c0307a');
    for (const p of this.triggerParts) if (p instanceof Phaser.GameObjects.Image && p.texture.key === 'sparkle-gold') p.destroy();

    let delay = 900;
    switch (this.layout.trigger.kind) {
      case 'cage':
        main?.setTexture('cage-open');
        if (main) this.tweens.add({ targets: main, y: GROUND_Y - 170, duration: 700, ease: 'Back.easeOut' });
        play('pop');
        burst(this, x, GROUND_Y - 100, 12, 'sparkle-gold');
        this.police?.setTexture('police-cheer');
        if (this.police) {
          const bubble = makeBubble(this, this.police.x, GROUND_Y - 180, 'Run, Lyla, run! Collect the flowers!', 330);
          bubble.setDepth(40);
          this.time.delayedCall(2200, () => bubble.destroy());
        }
        delay = 1200;
        break;
      case 'flower':
        if (main) {
          this.tweens.killTweensOf(main);
          this.tweens.add({ targets: main, y: main.y - 120, scale: 0.2, alpha: 0, duration: 650, ease: 'Back.easeIn' });
        }
        burst(this, x, GROUND_Y - 120, 14, 'sparkle-gold');
        break;
      case 'gate':
        if (main) this.tweens.add({ targets: main, y: main.y - 300, alpha: 0, duration: 800, ease: 'Cubic.easeIn' });
        burst(this, x, GROUND_Y - 130, 10, 'sparkle');
        if (this.flags.has('hands-napping')) this.napHands();
        break;
      case 'bow':
        if (main) {
          this.tweens.killTweensOf(main);
          this.tweens.add({ targets: main, x: this.lyla.x, y: this.lyla.y - 60, scale: 0.4, alpha: 0, duration: 600 });
        }
        this.floatText(x, GROUND_Y - 260, 'Tap targets to shoot arrows!', '#7445c5');
        delay = 1300;
        break;
      case 'gift':
        this.openGift(true);
        play('jingle');
        burst(this, x, GROUND_Y - 140, 14, 'sparkle-gold');
        delay = 1300;
        break;
      case 'phone':
        if (main) {
          this.tweens.add({ targets: main, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 8,
            onComplete: () => { main.setTint(0x888899).setAngle(8); } });
        }
        burst(this, x, GROUND_Y - 160, 12, 'sparkle-gold');
        break;
      case 'heart':
        this.bossVictory();
        return;
    }
    play('correct');
    this.time.delayedCall(delay, () => { if (this.state === 'cheer') this.resumeWorld(); });
  }

  /** The Helping Hand Hall: spelling the word makes the remaining big hands lift up and nap. */
  private napHands(): void {
    for (const h of this.hazards) {
      if (h.data.type !== 'hand' || !h.actor) continue;
      h.handTween?.stop();
      h.state = 'done';
      this.tweens.add({ targets: h.actor, y: GROUND_Y - 220, angle: -8, duration: 600, ease: 'Sine.easeOut' });
      const zzz = this.add.text(h.data.x + 60, GROUND_Y - 330, 'z z z', textStyle(26, '#7a4f8f')).setDepth(30);
      this.tweens.add({ targets: zzz, y: zzz.y - 16, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
    }
  }

  // -------------------------------------------------------------- paint door

  /** Zoey's rainbow paint-door puzzle: tap paints in rainbow order. Never a dead end. */
  private openPaintDoor(): void {
    this.state = 'puzzle';
    this.freeze();
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const order = [3, 0, 5, 2, 4, 1]; // fixed shuffle for a consistent layout
    const root = this.add.container(0, EXTRA_HEIGHT / 2).setScrollFactor(0).setDepth(800);
    this.overlay = root;
    const dim = this.add.rectangle(480, 270, 960, COVER_HEIGHT, 0x1e1238, 0.55).setInteractive();
    const panel = makePanel(this, 480, 275, 840, 430);
    const title = this.add.text(480, 100, 'Rainbow Paint Door!', textStyle(34, '#6e3b9d')).setOrigin(0.5);
    const instruction = 'Tap the paints in rainbow order: red, orange, yellow, green, blue, purple.';
    const help = this.add.text(560, 150, instruction, textStyle(20, '#4f3761', true, { align: 'center', wordWrap: { width: 600 } })).setOrigin(0.5, 0);
    const door = this.add.image(170, 300, 'paint-door').setScale(0.8);
    root.add([dim, panel, title, help, door]);
    if (loadPrefs().narration) void speak(instruction, 0.95);

    let next = 0;
    let wrongInRow = 0;
    const pots: Phaser.GameObjects.Image[] = [];
    order.forEach((ci, slot) => {
      const pot = this.add.image(330 + slot * 92, 330, `paint-${ci}`).setInteractive({ useHandCursor: true });
      const label = this.add.text(330 + slot * 92, 385, colors[ci], textStyle(16, '#4f3761')).setOrigin(0.5);
      pot.setData('ci', ci);
      pots.push(pot);
      root.add([pot, label]);
      pot.on('pointerdown', () => {
        if (next >= 6) return;
        if (ci === next) {
          play('pop');
          wrongInRow = 0;
          pots.forEach(p => p.clearTint());
          const splat = this.add.image(pot.x, pot.y, `splat-${ci}`).setScale(0.6).setScrollFactor(0);
          root.add(splat);
          // Door slots sit at y = 46 + i*38 inside the 270px-tall door texture (scaled 0.8).
          const slotY = door.y - 135 * 0.8 + (46 + ci * 38) * 0.8;
          this.tweens.add({ targets: splat, x: door.x, y: slotY, scale: 0.42, duration: 320, ease: 'Quad.easeOut' });
          pot.setAlpha(0.35).disableInteractive();
          next++;
          if (next === 6) done();
        } else {
          play('gentle');
          wrongInRow++;
          this.tweens.add({ targets: pot, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => pot.setAngle(0) });
          if (wrongInRow >= 2) {
            const right = pots.find(p => p.getData('ci') === next);
            right?.setTint(0xfff27a);
            help.setText(`Next is ${colors[next]}! It is glowing.`);
          }
        }
      });
    });

    pinToScreen(root);

    const done = (): void => {
      play('correct');
      title.setText('Hooray! The rainbow door opens!');
      help.setText('Flowers were hiding inside! +6 🌸');
      burst(this, 170, 300, 14, 'sparkle-gold', 900);
      this.flags.add('paint-door');
      this.flowerCount += 6;
      this.saveProgress(null);
      this.time.delayedCall(1500, () => {
        root.destroy();
        this.overlay = undefined;
        this.paintDoor?.setAlpha(0.25);
        this.hud.flowers.setText(String(this.flowerCount));
        if (this.state === 'puzzle') this.resumeWorld();
      });
    };
  }

  // --------------------------------------------------------------- the boss

  private startBoss(): void {
    this.state = 'boss';
    const L = this.layout;
    const arena = L.arenaX!;
    const body = this.lyla.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.lyla.anims.stop();
    this.lyla.setTexture('lyla-stand');
    this.camLockX = arena - 60;
    this.hideDangerBubble();

    const mx = arena + 700;
    this.monster = this.add.image(mx, GROUND_Y + 330, 'monster').setOrigin(0.5, 1).setDepth(15);
    play('whoosh');
    this.tweens.add({
      targets: this.monster, y: GROUND_Y, duration: 900, ease: 'Back.easeOut',
      onComplete: () => {
        this.cameras.main.shake(reducedShake(), 0.006);
        this.tweens.add({ targets: this.monster, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const bubble = makeBubble(this, arena + 300, 150, 'Tap the glowing stars to shoot arrows!', 380);
        bubble.setDepth(40);
        this.bossHint = bubble;
        if (loadPrefs().narration) void speak('Tap the glowing stars to shoot arrows!', 0.95);
        this.spawnBossStars(mx);
        this.time.addEvent({ delay: 3800, loop: true, callback: () => this.bossStomp() });
      }
    });
  }

  private bossHint?: Phaser.GameObjects.Container;
  private portalLabel?: Phaser.GameObjects.Text;

  private spawnBossStars(mx: number): void {
    const spots = [[-95, -250], [105, -175]];
    let popped = 0;
    for (const [dx, dy] of spots) {
      const s = this.add.image(mx + dx, GROUND_Y + dy, 'star-target').setDepth(30);
      s.setInteractive(new Phaser.Geom.Circle(45, 45, 70), Phaser.Geom.Circle.Contains);
      this.tweens.add({ targets: s, scale: { from: 0.9, to: 1.15 }, angle: { from: -8, to: 8 }, duration: 600, yoyo: true, repeat: -1 });
      this.bossStars.push(s);
      s.once('pointerdown', () => {
        s.disableInteractive();
        this.lyla.setTexture('lyla-cheer');
        this.fireArrow(this.lyla.x + 30, this.lyla.y - 70, s.x, s.y, 'arrow', () => {
          play('pop');
          burst(this, s.x, s.y, 12, 'sparkle-gold');
          s.destroy();
          this.floatText(mx - 60, GROUND_Y - 330, 'Hee hee! That tickles!', '#6d43d1');
          if (this.monster) this.tweens.add({ targets: this.monster, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.monster?.setAngle(0) });
          popped++;
          this.lyla.setTexture('lyla-stand');
          if (popped === spots.length) this.spawnHeart(mx);
        });
      });
    }
  }

  private spawnHeart(mx: number): void {
    this.bossHint?.destroy();
    const heart = this.add.image(mx, GROUND_Y - 110, 'heart-target').setDepth(30).setScale(0.2);
    this.triggerMain = heart;
    this.tweens.add({ targets: heart, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: heart, scale: 1.12, duration: 500, yoyo: true, repeat: -1, delay: 500 });
    const hint = makeBubble(this, (this.layout.arenaX ?? mx - 700) + 330, 130, 'One more! Power up the rainbow arrow!', 400).setDepth(40);
    this.time.delayedCall(1250, () => hint.destroy());
    this.time.delayedCall(1300, () => { void this.runSpelling(); });
  }

  private bossStomp(): void {
    if (this.state !== 'boss' || !this.monster) return;
    this.tweens.add({ targets: this.monster, y: GROUND_Y - 30, duration: 220, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { if (!prefersReducedMotion()) this.cameras.main.shake(180, 0.004); } });
  }

  private pulseBossHint(): void {
    for (const s of this.bossStars) if (s.active) this.tweens.add({ targets: s, scale: 1.5, duration: 150, yoyo: true });
  }

  private bossVictory(): void {
    const mx = this.monster?.x ?? this.lyla.x + 600;
    const heart = this.triggerMain;
    this.lyla.setTexture('lyla-cheer');
    this.fireArrow(this.lyla.x + 30, this.lyla.y - 70, mx, GROUND_Y - 110, 'rainbow-arrow', () => {
      play('portal');
      burst(this, mx, GROUND_Y - 110, 18, 'sparkle-gold');
      heart?.destroy();
      if (this.monster) {
        const m = this.monster;
        this.tweens.killTweensOf(m);
        this.tweens.add({
          targets: m, scale: 0.3, duration: 900, ease: 'Back.easeIn',
          onComplete: () => {
            m.setTexture('monster-friendly').setScale(0.9);
            this.floatText(mx - 180, GROUND_Y - 200, 'Thank you! I feel so much better!', '#6d43d1');
            this.portal.setVisible(true).setAlpha(0);
            this.portalLabel?.setVisible(true);
            this.portalGlow.setVisible(true);
            this.portalSparks.start();
            this.tweens.add({ targets: this.portal, alpha: 1, duration: 600 });
            this.tweens.add({ targets: m, y: GROUND_Y - 40, duration: 260, yoyo: true, repeat: 3, ease: 'Quad.easeOut',
              onComplete: () => this.tweens.add({ targets: m, x: m.x + 600, duration: 1600 }) });
          }
        });
      }
      // Flower shower.
      for (let i = 0; i < 10; i++) {
        const f = this.add.image(mx - 300 + Math.random() * 600, -20, 'flower').setDepth(60);
        this.tweens.add({ targets: f, y: GROUND_Y - 30, angle: 360, duration: 1100 + Math.random() * 600, delay: i * 90, ease: 'Bounce.easeOut',
          onComplete: () => this.tweens.add({ targets: f, alpha: 0, duration: 400, delay: 400, onComplete: () => f.destroy() }) });
      }
      this.flowerCount += 10;
      this.saveProgress(null);
      this.addFlowers(0);
      this.time.delayedCall(2600, () => {
        this.camLockX = null;
        this.resumeWorld();
      });
    });
  }

  // -------------------------------------------------------------- finishing

  private finishLevel(): void {
    if (this.state === 'done') return;
    if (!this.progress.promptResolved) {
      // Safety net: the prompt always comes before the portal.
      void this.runSpelling();
      return;
    }
    this.state = 'done';
    this.hideDangerBubble();
    this.physics.pause();
    play('portal');
    this.lyla.anims.stop();
    this.tweens.add({ targets: this.lyla, x: this.layout.portalX, y: GROUND_Y - 60, scale: 0, angle: 540, duration: 700, ease: 'Cubic.easeIn' });
    let completed: SavedCampaign;
    try {
      completed = markCampaignLevelComplete(this.campaign, this.levelIndex, this.flowerCount);
    } catch (error) {
      this.listChanged(error);
      return;
    }
    this.campaign = completed;
    const last = this.levelIndex + 1 >= CAMPAIGN_LEVEL_COUNT;
    this.time.delayedCall(800, () => this.showLevelComplete(last));
  }

  private showLevelComplete(last: boolean): void {
    const root = this.add.container(0, EXTRA_HEIGHT / 2).setScrollFactor(0).setDepth(900);
    const dim = this.add.rectangle(480, 270, 960, COVER_HEIGHT, 0x1e1238, 0.5).setInteractive();
    const panel = makePanel(this, 480, 270, 580, 380);
    const title = this.add.text(480, 135, `Level ${this.level.id} complete!`, textStyle(38, '#6e3b9d')).setOrigin(0.5);
    const lyla = this.add.image(330, 290, 'lyla-cheer').setScale(1.1);
    const icon = this.add.image(510, 250, 'flower-icon').setScale(1.4);
    const count = this.add.text(545, 250, `× ${this.flowerCount}`, textStyle(40, '#c0307a')).setOrigin(0, 0.5);
    const total = this.add.text(575, 312, `${this.campaign.totalFlowers} flowers in Lyla's fanny pack`, textStyle(19, '#6a5080', false)).setOrigin(0.5);
    root.add([dim, panel, title, lyla, icon, count, total]);
    burst(this, 480, 135, 12, 'sparkle-gold', 950);
    this.tweens.add({ targets: lyla, y: 270, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });

    const nextLabel = last ? 'See the ending ▶' : `Level ${this.level.id + 1} ▶`;
    const next = makeButton(this, 600, 400, 260, 66, nextLabel, () => this.goNext(last), { color: 0x7445c5, fontSize: 26 });
    const map = makeButton(this, 360, 400, 180, 66, '🗺 Map', () => this.scene.start('Map'), { color: 0x8f53b5, fontSize: 24 });
    root.add([next, map]);
    pinToScreen(root);
  }

  private goNext(last: boolean): void {
    if (last) {
      this.scene.start('Cutscene', { id: 'ending', next: 'Finale' });
      return;
    }
    const nextLevel = levels[this.levelIndex + 1];
    const cut = nextLevel.play.cutscene;
    if (cut) this.scene.start('Cutscene', { id: cut, next: 'Game' });
    else this.scene.start('Game');
  }

  // ------------------------------------------------------------ pause/leave

  private openPause(): void {
    if (this.overlay || this.state === 'spelling' || this.state === 'done' || this.state === 'paused') return;
    this.stateBeforePause = this.state;
    this.state = 'paused';
    const wasFrozen = this.physics.world.isPaused;
    this.physics.pause();
    this.tweens.pauseAll();
    this.anims.pauseAll();
    this.time.paused = true;
    stopSpeech();

    const root = this.add.container(0, EXTRA_HEIGHT / 2).setScrollFactor(0).setDepth(950);
    this.overlay = root;
    const dim = this.add.rectangle(480, 270, 960, COVER_HEIGHT, 0x1e1238, 0.6).setInteractive();
    const panel = makePanel(this, 480, 275, 460, 370);
    const title = this.add.text(480, 140, 'Paused', textStyle(40, '#6e3b9d')).setOrigin(0.5);
    const note = this.add.text(480, 182, 'Take a break any time. Your adventure is saved.', textStyle(17, '#6a5080', false)).setOrigin(0.5);
    root.add([dim, panel, title, note]);

    const resume = (): void => {
      root.destroy();
      this.overlay = undefined;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.anims.resumeAll();
      if (!wasFrozen) this.physics.resume();
      this.state = this.stateBeforePause;
      if (this.state === 'running') this.graceUntil = this.time.now + 600;
    };
    const prefs = loadPrefs();
    const soundLabel = (on: boolean): string => `🔊 Sounds: ${on ? 'On' : 'Off'}`;
    const narrLabel = (on: boolean): string => `🗣 Story voice: ${on ? 'On' : 'Off'}`;
    root.add(makeButton(this, 480, 240, 340, 60, '▶ Keep playing', resume, { color: 0x7445c5, fontSize: 25 }));
    const sound = makeButton(this, 480, 310, 340, 52, soundLabel(prefs.sound), () => {
      const next = savePrefs({ sound: !loadPrefs().sound });
      (sound.list[1] as Phaser.GameObjects.Text).setText(soundLabel(next.sound));
    }, { color: 0x8f53b5, fontSize: 21 });
    const narr = makeButton(this, 480, 368, 340, 52, narrLabel(prefs.narration), () => {
      const next = savePrefs({ narration: !loadPrefs().narration });
      (narr.list[1] as Phaser.GameObjects.Text).setText(narrLabel(next.narration));
    }, { color: 0x8f53b5, fontSize: 21 });
    root.add([sound, narr]);
    root.add(makeButton(this, 480, 428, 340, 52, '🗺 Save & leave', () => {
      this.time.paused = false;
      this.leaveToMap(this.stateBeforePause === 'running');
    }, { color: 0x6a5080, fontSize: 21 }));
    pinToScreen(root);
  }

  /** Save a safe resume point (when Lyla is on open ground) and go to the map. */
  private leaveToMap(savePosition: boolean): void {
    if (savePosition && this.progress) {
      const body = this.lyla.body as Phaser.Physics.Arcade.Body;
      const x = this.lyla.x;
      const nearHazard = this.hazards.some(h => h.state !== 'done' && x > h.data.x - 650 && x < h.data.x + 320);
      const nearObstacle = this.layout.obstacles.some(o => x > o.x - 160 && x < o.x + o.w + 60);
      const safe = (body.blocked.down || body.touching.down) && !nearHazard && !nearObstacle && !this.small;
      const before = this.layout.trigger.x - 120;
      const resumeOk = this.progress.promptResolved || x < before;
      if (safe && resumeOk && x > (this.progress.checkpointX ?? 0)) this.saveProgress(Math.round(x));
      else this.saveProgress(null);
    }
    this.tweens.resumeAll();
    this.anims.resumeAll();
    this.scene.start('Map');
  }

  private listChanged(error: unknown): void {
    console.error(error);
    this.scene.start('Map');
  }

  // ---------------------------------------------------------------- helpers

  private floatText(x: number, y: number, message: string, color: string): void {
    const t = this.add.text(x, y, message, textStyle(22, color, true, { stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1700, delay: 400, onComplete: () => t.destroy() });
  }

  private showTip(id: string, message: string, x: number, y: number, ms: number): void {
    if (this.tipsShown.has(`tip-${id}`)) return;
    this.tipsShown.add(`tip-${id}`);
    const b = makeBubble(this, x, y, message, 420, false).setScrollFactor(0).setDepth(450).setAlpha(0);
    this.tweens.add({ targets: b, alpha: 1, duration: 250 });
    this.time.delayedCall(ms, () => this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }));
  }

  private updateTips(): void {
    if (this.level.id > 2) return;
    const firstRow = this.layout.flowers[0];
    if (firstRow && this.lyla.x > firstRow.x - 500) this.showTip('flowers', 'Run into flowers to collect them!', 480, 150, 2600);
    if (this.lyla.x > this.layout.portalX - 600) this.showTip('portal', 'Run into the purple-and-blue portal!', 480, 150, 2600);
  }

  private showDangerBubble(): void {
    if (!this.dangerBubble) {
      this.dangerBubble = makeBubble(this, 0, 0, 'Tap Lyla to shrink!', 250).setDepth(45);
      if (!this.tipsShown.has('danger-voice') && loadPrefs().narration) {
        this.tipsShown.add('danger-voice');
        void speak('Tap Lyla to shrink!', 1);
      }
    }
    this.dangerBubble.setPosition(this.lyla.x, this.lyla.y - 200);
  }

  private hideDangerBubble(): void {
    this.dangerBubble?.destroy();
    this.dangerBubble = undefined;
  }
}

function reducedShake(): number {
  return prefersReducedMotion() ? 0 : 240;
}

