export type LevelProvenance = 'confirmed-setting' | 'confirmed-final' | 'proposed';
export type DevelopmentStatus = 'planned' | 'in-progress' | 'playable';

export interface LevelOutline {
  id: number;
  slug: string;
  title: string;
  setting: string;
  theme: string;
  provenance: LevelProvenance;
  story: string;
  mechanic: string;
  reading: string;
  math: string;
  developmentStatus: DevelopmentStatus;
}
