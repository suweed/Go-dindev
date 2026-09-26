export type PhaseId =
  | 'wake_up'
  | 'transport_to_work'
  | 'office_entry'
  | 'work'
  | 'office_exit'
  | 'transport_home'
  | 'free_time'
  | 'sleep';

export interface PhaseConfig {
  gameHours: number;
  realSeconds: number; // 0 in all phases EXCEPT work (minigames)
}

export interface TimeConfig {
  projectDays: number; // 30
  phases: Record<PhaseId, PhaseConfig>;
  lostSleepFatiguePerHour: number; // 2
}

export interface TimeState {
  day: number; // 1..projectDays
  phase: PhaseId;
  gameHour: number; // hour within the day
  dayHoursConsumed: number; // total for the day: default phases + extras
}

export interface ExtraTimeResult {
  state: TimeState;
  hoursTakenFromFreeTime: number;
  hoursTakenFromSleep: number;
  lostSleepHours: number; // fatigue cost applied by the caller
  rolledToNextDay: boolean;
}

export interface DaySummary {
  day: number;
  totalHours: number;
  lostSleepHours: number;
  nextState: TimeState;
}
