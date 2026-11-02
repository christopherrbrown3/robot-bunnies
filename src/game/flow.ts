/** Navigation helpers shared by menu scenes. */
import Phaser from 'phaser';
import levelsJson from '../content/levels.json';
import type { LevelOutline } from '../content/types';
import { CAMPAIGN_LEVEL_COUNT, getOrStartCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';

export const levels = levelsJson as LevelOutline[];
export const PARENT_EVENT = 'robot-bunnies:open-parent';

export function hasActiveList(): boolean {
  try {
    return (getActiveWeek(loadSpellingData())?.words.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Continue the saved 22-level run (or start one), showing the level's story first if it is fresh. */
export function startAdventure(scene: Phaser.Scene): void {
  if (!hasActiveList()) {
    window.dispatchEvent(new Event(PARENT_EVENT));
    return;
  }
  try {
    const campaign = getOrStartCampaign();
    const index = Math.min(campaign.nextLevelIndex, CAMPAIGN_LEVEL_COUNT - 1);
    const cut = levels[index].play.cutscene;
    if (!campaign.level && cut) scene.scene.start('Cutscene', { id: cut, next: 'Game' });
    else scene.scene.start('Game');
  } catch {
    window.dispatchEvent(new Event(PARENT_EVENT));
  }
}

/** Re-render a menu scene when Parent Corner or a practice session changes saved data. */
export function refreshOnDataChange(scene: Phaser.Scene): void {
  const handler = (): void => { if (scene.scene.isActive()) scene.scene.restart(); };
  window.addEventListener('robot-bunnies:data-changed', handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('robot-bunnies:data-changed', handler));
}
