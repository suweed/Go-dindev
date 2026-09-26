import type { FatigueConfig, FatigueState } from '../fatigue/types';
import type { MoneyConfig, MoneyState, TransportType } from '../money/types';
import type { PhaseId, TimeConfig, TimeState } from '../time/types';

export type WakeUpChoice = 'go_to_work' | 'stay_home';
export type MealChoice = 'eat' | 'skip_meal';
export type ExitChoice = 'leave' | 'keep_working';
export type FreeTimeActivity = 'tv' | 'going_out' | 'end_free_time';

export interface DayEvent {
  day: number;
  phase: PhaseId;
  type: string;
  detail: string;
  extraHours?: number;
  fatigueDelta?: number;
  moneyDelta?: number;
  projectDelta?: number;
}

export interface GameState {
  day: number;
  phase: PhaseId;
  time: TimeState;
  fatigue: FatigueState;
  money: MoneyState;
  transportType: TransportType;
  wentToWork: boolean;
  projectProgress: number;
  lostSleepHours: number;
  events: DayEvent[];
}

export type EndCondition =
  | { type: 'project_complete' }
  | { type: 'fired' }
  | { type: 'fatigue_collapse' }
  | { type: 'out_of_money' };

export interface DayResult {
  state: GameState;
  endCondition?: EndCondition;
}

export interface ProjectConfig {
  progressPerMinigame: number;
  minigamesPerDay: number;
}

export interface GameConfig {
  time: TimeConfig;
  fatigue: FatigueConfig;
  money: MoneyConfig;
  project: ProjectConfig;
  transportType: TransportType;
}
