import type { GameConfig, ProjectConfig } from './types';
import { DEFAULT_TIME_CONFIG } from '../time/balance';
import { DEFAULT_FATIGUE_CONFIG } from '../fatigue/balance';
import { DEFAULT_MONEY_CONFIG } from '../money/balance';

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  progressPerMinigame: 100 / 60, // 30 days x 2 minigames = 60 minigames for 100%
  minigamesPerDay: 2,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  time: DEFAULT_TIME_CONFIG,
  fatigue: DEFAULT_FATIGUE_CONFIG,
  money: DEFAULT_MONEY_CONFIG,
  project: DEFAULT_PROJECT_CONFIG,
  transportType: 'bus',
};
